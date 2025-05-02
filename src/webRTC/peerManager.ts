type PeerEventHandlers = {
    onData: (fromUID: string, data: any) => void
    onDisconnect?: (uid: string) => void
    onPing?: (uid: string, latencyMS: number) => void
}

export class PeerManager {
    private peers: Record<string, { conn: RTCPeerConnection; channel: RTCDataChannel }> = {}
    private localUID: string
    private handlers: PeerEventHandlers
    private signalingSocket: WebSocket

    constructor(localUID: string, signalingSocket: WebSocket, handlers: PeerEventHandlers) {
        this.localUID = localUID
        this.signalingSocket = signalingSocket
        this.handlers = handlers

        this.setupSignalingHandlers()
    }

    private setupSignalingHandlers() {
        this.signalingSocket.addEventListener('message', async (e) => {
            const msg = JSON.parse(e.data)
            const { type, ...data } = msg

            if (type === 'incomingCall') {
                console.log(msg)
                console.log('peer manager, incoming call', data)
                const { callerId, offer: localDescription } = data
                const peer = this.createPeer(callerId, false)
                console.log(peer)
                await peer.conn.setRemoteDescription(new RTCSessionDescription(localDescription))
                const answer = await peer.conn.createAnswer()
                await peer.conn.setLocalDescription(answer)

                // send call to websockets
                this.signalingSocket.send(
                    JSON.stringify({
                        type: 'answerCall',
                        data: { answer, callerId, answererId: this.localUID },
                    })
                )
            }

            if (type === 'callAnswered') {
                console.log('peer manager, call Answered')
                const { callerId, answer } = data
                const peer = this.peers[callerId]
                console.log('answer peer', peer)
                if (peer) {
                    await peer.conn.setRemoteDescription(new RTCSessionDescription(answer))
                    console.log('setting remote desc after answering')
                }
            }

            if (type === 'iceCandidate') {
                const { candidate, fromUID } = data
                const peer = this.peers[fromUID]
                console.log('ice peer', peer)
                if (peer && candidate) {
                    console.log('peer manager, ice candidate')
                    await peer.conn.addIceCandidate(new RTCIceCandidate(candidate))
                }
            }
        })
    }

    public async connectTo(uid: string) {
        if (this.peers[uid]) return
        const peer = this.createPeer(uid, true)
        const offer = await peer.conn.createOffer()
        await peer.conn.setLocalDescription(offer)
        console.log('peer manager, calling users')
        this.signalingSocket.send(
            JSON.stringify({
                type: 'callUser',
                data: {
                    callerId: this.localUID,
                    calleeId: uid,
                    localDescription: offer,
                },
            })
        )
    }

    private createPeer(uid: string, isInitiator: boolean) {
        const googleStuns = [
            'stun:stun.l.google.com:19302',
            'stun:stun.l.google.com:5349',
            'stun:stun1.l.google.com:3478',
            'stun:stun1.l.google.com:5349',
            'stun:stun2.l.google.com:19302',
            'stun:stun2.l.google.com:5349',
            'stun:stun3.l.google.com:3478',
            'stun:stun3.l.google.com:5349',
            'stun:stun4.l.google.com:19302',
            'stun:stun4.l.google.com:5349',
        ]

        const conn = new RTCPeerConnection({
            iceServers: [{ urls: googleStuns }],
        })

        // Pre-fill so setupDataChannel has access
        this.peers[uid] = { conn, channel: null as any } // channel will be set later

        if (isInitiator) {
            console.log('attempting to create data channel')
            const channel = conn.createDataChannel('data')
            this.setupDataChannel(uid, channel)
        } else {
            conn.ondatachannel = (event) => {
                console.log('other user channel being set')
                this.setupDataChannel(uid, event.channel)
            }
        }

        conn.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingSocket.send(
                    JSON.stringify({
                        type: 'iceCandidate',
                        data: {
                            fromUID: this.localUID,
                            toUID: uid,
                            candidate: event.candidate,
                        },
                    })
                )
            }
        }

        conn.onconnectionstatechange = () => {
            if (conn.connectionState === 'disconnected' || conn.connectionState === 'failed') {
                this.handlers.onDisconnect?.(uid)
                delete this.peers[uid]
            }
        }

        return this.peers[uid]
    }

    private setupDataChannel(uid: string, channel: RTCDataChannel) {
        channel.onopen = () => console.log('data channel open with: ', uid)
        channel.onmessage = (e) => {
            const msg = JSON.parse(e.data)
            if (msg.type === 'ping') {
                const latency = Date.now() - msg.ts
                this.handlers?.onPing?.(uid, latency)
            } else {
                this.handlers.onData(uid, msg)
            }
        }

        this.peers[uid].channel = channel
        console.log('starting data channel', channel)
    }

    public sendTo(uid: string, data: any) {
        const msg = JSON.stringify(data)
        const channel = this.peers[uid]?.channel
        if (channel?.readyState === 'open') {
            channel.send(msg)
        }
    }

    public broadcast(data: any) {
        console.log('broadcasted some data')
        const msg = JSON.stringify(data)
        for (const peer of Object.values(this.peers)) {
            console.log(peer)
            if (peer?.channel?.readyState === 'open') {
                console.log('data channel is open sending a message')
                peer.channel.send(msg)
            }
        }
    }

    public pingAll() {
        for (const uid in this.peers) {
            this.sendTo(uid, { type: 'ping', ts: Date.now() })
        }
    }

    public closeAll() {
        for (const uid in this.peers) {
            this.peers[uid].conn.close()
            delete this.peers[uid]
        }
    }

    public closeByID(uid: string) {
        if (!uid) return
        console.log('removing user from list')
        this.peers[uid].conn.close()
        delete this.peers[uid]
    }
}
