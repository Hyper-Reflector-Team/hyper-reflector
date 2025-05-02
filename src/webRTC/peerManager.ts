import keys from '../private/keys' // for stun server

type PeerEventHandlers = {
    onData: (fromUID: string, data: any) => void
    onDisconnect?: (uid: string) => void
    onPing?: (uid: string, latencyMS: number) => void
}

export class PeerManager {
    private peers: Record<
        string,
        { conn: RTCPeerConnection; channel: RTCDataChannel; pendingCandidates?: RTCIceCandidate[] }
    > = {}
    private localUID: string
    private handlers: PeerEventHandlers
    private signalingSocket: WebSocket
    private pendingPings: number[]

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
                console.log('peer manager, incoming call', data)
                const { callerId, offer: localDescription } = data

                const peer = this.createPeer(callerId, false)

                try {
                    await peer.conn.setRemoteDescription(
                        new RTCSessionDescription(localDescription)
                    )

                    // Apply buffered ICE candidates
                    if (peer.pendingCandidates?.length) {
                        for (const candidate of peer.pendingCandidates) {
                            try {
                                await peer.conn.addIceCandidate(candidate)
                            } catch (err) {
                                console.log('Error applying buffered candidate', err)
                            }
                        }
                        peer.pendingCandidates = []
                    }

                    const answer = await peer.conn.createAnswer()
                    await peer.conn.setLocalDescription(answer)

                    // send call to websockets
                    this.signalingSocket.send(
                        JSON.stringify({
                            type: 'answerCall',
                            data: { answer, callerId, answererId: this.localUID },
                        })
                    )
                } catch (err) {
                    console.error('Error handling incoming call:', err)
                }
            }

            if (type === 'callAnswered') {
                console.log('peer manager, call Answered')
                const { answererId, answer } = data
                const peer = this.peers[answererId]
                console.log('answer peer', peer)
                if (peer) {
                    console.log(
                        `[${answererId}] Setting remote description with signaling state: ${peer.conn.signalingState}`
                    )
                    if (peer.conn.signalingState !== 'stable') {
                        await peer.conn
                            .setRemoteDescription(new RTCSessionDescription(answer))
                            .then(() =>
                                console.log(`[${answererId}] Remote description set successfully.`)
                            )
                            .catch((err) =>
                                console.error(
                                    `[${answererId}] Error setting remote description:`,
                                    err
                                )
                            )
                    }
                    if (peer.pendingCandidates?.length) {
                        for (const candidate of peer.pendingCandidates) {
                            try {
                                await peer.conn.addIceCandidate(candidate)
                            } catch (err) {
                                console.log('Error applying buffered candidate', err)
                            }
                        }
                        peer.pendingCandidates = []
                    }
                }
            }

            if (type === 'iceCandidate') {
                const { candidate, fromUID } = data
                // console.log(candidate, '   --- from ', fromUID)
                const peer = this.peers[fromUID]

                // In the 'iceCandidate' handler:
                if (peer && candidate) {
                    const rtcCandidate = new RTCIceCandidate(candidate)
                    if (peer.conn.remoteDescription) {
                        try {
                            await peer.conn.addIceCandidate(rtcCandidate)
                        } catch (err) {
                            console.error('Error adding ICE candidate:', err) // Use console.error for errors
                        }
                    } else {
                        peer.pendingCandidates = peer.pendingCandidates || []
                        peer.pendingCandidates.push(rtcCandidate)
                        console.log(
                            `[${fromUID}] Received ICE candidate before remote description, buffering.`
                        )
                    }
                }
            }
        })
    }

    // A
    public async connectTo(uid: string) {
        const peer = this.createPeer(uid, true)
        const offer = await peer.conn.createOffer()
        await peer.conn.setLocalDescription(offer)
        console.log('peer manager, calling users')
        // if (this.peers[uid]) return
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
            `stun:${keys.COTURN_IP}:${keys.COTURN_PORT}`,
        ]

        const conn = new RTCPeerConnection({
            iceServers: [{ urls: googleStuns }],
        })

        // Pre-fill so setupDataChannel has access
        this.peers[uid] = { conn, channel: null as any, pendingCandidates: [] as RTCIceCandidate[] } // channel will be set later

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
                // console.log('Candidate Type:', event.candidate.candidate)
                // console.log(event.candidate, '   --- sending to ', uid)
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
            } else {
                console.log('All ICE candidates have been sent')
            }
        }

        conn.onconnectionstatechange = () => {
            if (conn.connectionState === 'disconnected' || conn.connectionState === 'failed') {
                this.handlers.onDisconnect?.(uid)
                delete this.peers[uid]
            }
        }

        conn.onsignalingstatechange = () => {
            console.log(`[${uid}] Signaling state:`, conn.signalingState)
        }

        conn.oniceconnectionstatechange = () => {
            console.log(`[${uid}] ICE state:`, conn.iceConnectionState)
        }

        conn.ondatachannel = (event) => {
            this.setupDataChannel(uid, event.channel)
        }

        return this.peers[uid]
    }

    private setupDataChannel(uid: string, channel: RTCDataChannel) {
        channel.onopen = () => console.log('data channel open with: ', uid)
        channel.onmessage = (e) => {
            const msg = JSON.parse(e.data)
            if (msg.type === 'ping') {
                const latency = Date.now() - msg.ts
                this.handlers.onPing?.(uid, latency)
            } else if (msg.type === 'ping-rt') {
                this.sendTo(uid, {
                    type: 'pong',
                    pingId: msg.pingId,
                })
            } else if (msg.type === 'pong') {
                const sent = this.pendingPings[msg.pingId]
                if (sent) {
                    const rtt = Date.now() - sent
                    delete this.pendingPings[msg.pingId]
                    this.handlers?.onPing?.(uid, rtt)
                }
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
            console.log('pinging, ', uid)
        }
    }

    public pingRoundTrip() {
        const now = Date.now()
        for (const uid in this.peers) {
            const pingId = Math.random().toString(36).slice(2)
            this.pendingPings[pingId] = now
            this.sendTo(uid, {
                type: 'ping-rt',
                ts: now,
                pingId,
            })
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

    public debugPeers() {
        console.log('Current peer connections:', this.peers)
    }
}
