// utils/PingManager.ts

type PeerInfo = {
    uid: string
}

type PingResult = {
    uid: string
    ping: number | null
}

export class PingManager {
    static queue: PeerInfo[] = []
    static activeCount = 0
    static maxConcurrent = 5
    static pingResults: Record<string, number | null> = {}

    static socket: WebSocket
    static localId: string

    static init(socket: WebSocket, localId: string) {
        this.socket = socket
        this.localId = localId

        // Handle incoming WebRTC messages
        socket.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'webrtc-ping-offer') {
                this.handleOffer(msg.from, msg.offer)
            } else if (msg.type === 'webrtc-ping-answer') {
                this.handleAnswer(msg.from, msg.answer)
            } else if (msg.type === 'webrtc-ping-candidate') {
                this.handleCandidate(msg.from, msg.candidate)
            }
        })
    }

    static addPeers(peers: PeerInfo[]) {
        console.log('ping manager adding peers')
        this.queue.push(...peers.filter((p) => p.id !== this.localId))
        this.processQueue()
    }

    static processQueue() {
        while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
            const peer = this.queue.shift()
            if (peer) {
                console.log('pinging peer -> ', peer)
                this.pingPeer(peer.uid)
            }
        }
    }

    static async pingPeer(peerId: string) {
        this.activeCount++
        const conn = new RTCPeerConnection()
        const channel = conn.createDataChannel('ping')
        const start = performance.now()

        let timeout = setTimeout(() => {
            conn.close()
            this.pingResults[peerId] = null
            this.activeCount--
            this.processQueue()
            console.log('removing peer from')
        }, 5000)

        const candidates: RTCIceCandidate[] = []

        conn.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.send(
                    JSON.stringify({
                        type: 'webrtc-ping-candidate',
                        to: peerId,
                        from: this.localId,
                        candidate: event.candidate,
                    })
                )
            }
        }

        channel.onopen = () => {
            const rtt = Math.round(performance.now() - start)
            this.pingResults[peerId] = rtt
            console.log(rtt)
            clearTimeout(timeout)
            conn.close()
            this.activeCount--
            this.processQueue()
        }

        const offer = await conn.createOffer()
        await conn.setLocalDescription(offer)

        this.socket.send(
            JSON.stringify({
                type: 'webrtc-ping-offer',
                to: peerId,
                from: this.localId,
                offer,
            })
        )

        // Store temporarily for ICE later
        this.pendingConnections[peerId] = conn
    }

    // Called when a peer sends you an offer
    static async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
        const conn = new RTCPeerConnection()
        this.pendingConnections[from] = conn

        conn.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.send(
                    JSON.stringify({
                        type: 'webrtc-ping-candidate',
                        to: from,
                        from: this.localId,
                        candidate: event.candidate,
                    })
                )
            }
        }

        conn.ondatachannel = (event) => {
            const start = performance.now()
            const channel = event.channel

            channel.onopen = () => {
                const rtt = Math.round(performance.now() - start)
                this.pingResults[from] = rtt
                conn.close()
            }
        }

        await conn.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await conn.createAnswer()
        await conn.setLocalDescription(answer)

        this.socket.send(
            JSON.stringify({
                type: 'webrtc-ping-answer',
                to: from,
                from: this.localId,
                answer,
            })
        )
    }

    static async handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
        const conn = this.pendingConnections[from]
        if (conn) {
            await conn.setRemoteDescription(new RTCSessionDescription(answer))
        }
    }

    // static async handleCandidate(from: string, candidate: RTCIceCandidateInit) {
    //     const conn = this.pendingConnections[from]
    //     if (conn) {
    //         await conn.addIceCandidate(new RTCIceCandidate(candidate))
    //     }
    // }

    private static handleCandidate(from: string, candidateData: any) {
        const conn = this.pendingConnections[from]
        if (!conn) return

        // Ensure the candidate has necessary fields
        if (
            !candidateData?.candidate ||
            (candidateData?.sdpMid == null && candidateData?.sdpMLineIndex == null)
        ) {
            console.warn('Invalid ICE candidate received:', candidateData)
            return
        }

        const candidate = new RTCIceCandidate({
            candidate: candidateData.candidate,
            sdpMid: candidateData.sdpMid,
            sdpMLineIndex: candidateData.sdpMLineIndex,
        })

        conn.addIceCandidate(candidate).catch((err) => {
            console.warn('Failed to add ICE candidate:', err)
        })
    }

    static pendingConnections: Record<string, RTCPeerConnection> = {}

    static getPingResult(peerId: string): number | null {
        return this.pingResults[peerId] ?? null
    }
}
