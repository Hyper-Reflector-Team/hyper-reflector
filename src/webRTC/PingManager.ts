import keys from '../private/keys'

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
                console.log('got an offer, ', msg.from)
                this.handleOffer(msg.from, msg.offer)
            } else if (msg.type === 'webrtc-ping-answer') {
                console.log('got an answer from, ', msg.from)
                this.handleAnswer(msg.from, msg.answer)
            } else if (msg.type === 'webrtc-ping-candidate') {
                this.handleCandidate(msg.from, msg.candidate)
                console.log('got an ice candidate, ', msg.from)
            }
        })
    }

    static addPeers(peers: PeerInfo[]) {
        console.log('ping manager adding peers')
        this.queue.push(...peers.filter((p) => p.uid !== this.localId))
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
        console.log('attempting ping in pingPeer')
        this.activeCount++
        const conn = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: `stun:${keys.COTURN_IP}:${keys.COTURN_PORT}` },
                {
                    urls: [`turn:${keys.COTURN_IP}:${keys.COTURN_PORT}`],
                    username: 'turn',
                    credential: 'turn',
                },
            ],
            iceTransportPolicy: 'relay',
        })
        const channel = conn.createDataChannel('ping')
        console.log('created data channel', channel)
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
                        candidate: event.candidate.toJSON(),
                    })
                )
            }
        }

        conn.oniceconnectionstatechange = () => {
            console.log(`[${peerId}] ICE state:`, conn.iceConnectionState)
        }

        conn.onconnectionstatechange = () => {
            console.log(`[${peerId}] Connection state:`, conn.connectionState)
        }

        channel.onopen = () => {
            console.log('data channel trying to open?')
            const rtt = Math.round(performance.now() - start)
            this.pingResults[peerId] = rtt
            console.log(rtt)
            clearTimeout(timeout)
            conn.close()
            this.activeCount--
            this.processQueue()
        }

        channel.onerror = (e) => {
            console.error('Data channel error', e)
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
        if (this.pendingConnections[from]) {
            console.warn(`Already have connection from ${from}, closing old one`)
            this.pendingConnections[from].close()
            delete this.pendingConnections[from]
        }

        const conn = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: `stun:${keys.COTURN_IP}:${keys.COTURN_PORT}` },
                {
                    urls: [`turn:${keys.COTURN_IP}:${keys.COTURN_PORT}`],
                    username: 'turn',
                    credential: 'turn',
                },
            ],
            iceTransportPolicy: 'relay',
        })
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

        conn.oniceconnectionstatechange = () => {
            console.log(`[${from}] ICE state:`, conn.iceConnectionState)
        }

        conn.onconnectionstatechange = () => {
            console.log(`[${from}] Connection state:`, conn.connectionState)
        }
        conn.ondatachannel = (event) => {
            console.log('data init')
            const start = performance.now()
            const channel = event.channel

            channel.onopen = () => {
                console.log('data channel open')
                const rtt = Math.round(performance.now() - start)
                this.pingResults[from] = rtt
                conn.close()
            }

            channel.onerror = (e) => {
                console.error('Data channel error', e)
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
        // make sure we don't get answer twice
        if (conn.remoteDescription && conn.remoteDescription.type === 'answer') {
            console.warn('Already have remote answer, skipping duplicate.')
            return
        }

        if (conn) {
            console.log(conn.signalingState)
            // Only apply if we are in the right state to receive an answer
            if (
                conn.signalingState === 'have-remote-offer' ||
                conn.signalingState === 'have-local-offer'
            ) {
                await conn.setRemoteDescription(new RTCSessionDescription(answer))

                // Apply any queued candidates
                const queued = this.pendingCandidates[from] || []
                for (const cand of queued) {
                    await conn.addIceCandidate(cand).catch((err) => {
                        console.warn('Failed to apply queued ICE candidate:', err)
                    })
                }
                delete this.pendingCandidates[from]
            } else {
                console.warn(`Cannot set remote answer SDP in state: ${conn.signalingState}`)
            }
        }
    }

    private static async handleCandidate(from: string, candidateData: any) {
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

        if (!conn.remoteDescription || !conn.remoteDescription.type) {
            // Queue candidate
            if (!this.pendingCandidates[from]) {
                this.pendingCandidates[from] = []
            }
            this.pendingCandidates[from].push(candidate)
            return
        }
        // After setting remote description...
        const queued = this.pendingCandidates[from] || []
        for (const cand of queued) {
            await conn.addIceCandidate(cand).catch((err) => {
                console.warn('Failed to apply queued ICE candidate:', err)
            })
        }
        delete this.pendingCandidates[from]
    }

    static pendingConnections: Record<string, RTCPeerConnection> = {}
    static pendingCandidates: Record<string, RTCIceCandidate[]> = {}

    static getPingResult(peerId: string): number | null {
        return this.pingResults[peerId] ?? null
    }
}
