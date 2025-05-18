export class WebRTCPeer {
    constructor(signalingServer, iceServers, localId) {
        this.signalingServer = signalingServer
        this.iceServers = iceServers
        this.localPeerConnection = null
        this.dataChannel = null
        this.localId = localId // Simple local ID
        this.onDataChannelOpen = null
        this.onDataChannelMessage = null
        this.onIceCandidate = null
        this.onRemoteHangup = null

        this.signalingServer.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'webrtc-ping-offer') {
                console.log('got an offer, ', msg.from)
                this._handleOffer(msg)
            } else if (msg.type === 'webrtc-ping-answer') {
                console.log('got an answer from, ', msg.from)
                this._handleAnswer(msg)
            } else if (msg.type === 'webrtc-ping-candidate') {
                this._handleCandidate(msg)
                console.log('got an ice candidate, ', msg.from)
            }
        })
        // this.signalingServer.onmessage = async (event) => {
        //     try {
        //         const message = JSON.parse(event.data)
        //         console.log('Received signaling message:', message)
        //         switch (message.type) {
        //             case 'webrtc-ping-offer':
        //                 console.log('offer get')
        //                 this._handleOffer(message)
        //                 break
        //             case 'webrtc-ping-answer':
        //                 console.log('answer get')
        //                 this._handleAnswer(message)
        //                 break
        //             case 'webrtc-ping-candidate':
        //                 this._handleCandidate(message)
        //                 break
        //         }
        //     } catch (error) {
        //         console.error('Error processing signaling message:', error)
        //     }
        // }
    }

    async connect(remotePeerId) {
        this.remotePeerId = remotePeerId
        this._createPeerConnection()
        this._createDataChannel()

        try {
            const offer = await this.localPeerConnection.createOffer()
            await this.localPeerConnection.setLocalDescription(offer)
            this._sendSignalingMessage({
                type: 'webrtc-ping-offer',
                to: this.remotePeerId,
                from: this.localId,
                offer: offer,
            })
        } catch (error) {
            console.error('Error creating and sending offer:', error)
        }
    }

    async receiveOffer(offer, fromPeerId) {
        this.remotePeerId = fromPeerId
        this._createPeerConnection()
        try {
            await this.localPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await this.localPeerConnection.createAnswer()
            await this.localPeerConnection.setLocalDescription(answer)
            this._sendSignalingMessage({
                type: 'webrtc-ping-answer',
                to: this.remotePeerId,
                from: this.localId,
                answer: answer,
            })
        } catch (error) {
            console.error('Error handling offer:', error)
        }
    }

    send(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data)
        } else {
            console.warn('Data channel not open.')
        }
    }

    hangup() {
        if (this.localPeerConnection) {
            this.localPeerConnection.close()
            this.localPeerConnection = null
            if (this.onRemoteHangup) {
                this.onRemoteHangup()
            }
        }
    }

    _createPeerConnection() {
        this.localPeerConnection = new RTCPeerConnection({ iceServers: this.iceServers })

        this.localPeerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this._sendSignalingMessage({
                    type: 'webrtc-ping-candidate',
                    to: this.remotePeerId,
                    from: this.localId,
                    candidate: event.candidate,
                })
                if (this.onIceCandidate) {
                    this.onIceCandidate(event.candidate)
                }
            }
        }

        this.localPeerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel
            this._setupDataChannelListeners()
            if (this.onDataChannelOpen) {
                this.onDataChannelOpen()
            }
        }

        this.localPeerConnection.onconnectionstatechange = () => {
            console.log('ICE connection state:', this.localPeerConnection.connectionState)
            if (
                this.localPeerConnection.connectionState === 'failed' ||
                this.localPeerConnection.connectionState === 'closed' ||
                this.localPeerConnection.connectionState === 'disconnected'
            ) {
                this.hangup()
            }
        }
    }

    _createDataChannel() {
        this.dataChannel = this.localPeerConnection.createDataChannel('data-channel')
        this._setupDataChannelListeners()
    }

    _setupDataChannelListeners() {
        if (this.dataChannel) {
            this.dataChannel.onopen = () => {
                console.log('Data channel is open')
                if (this.onDataChannelOpen) {
                    this.onDataChannelOpen()
                }
            }

            this.dataChannel.onmessage = (event) => {
                console.log('Received data channel message:', event.data)
                if (this.onDataChannelMessage) {
                    this.onDataChannelMessage(event.data)
                }
            }

            this.dataChannel.onclose = () => {
                console.log('Data channel closed')
            }
        }
    }

    async _handleOffer(message) {
        if (!this.localPeerConnection) {
            this._createPeerConnection()
        }
        this.remotePeerId = message.from
        try {
            await this.localPeerConnection.setRemoteDescription(
                new RTCSessionDescription(message.offer)
            )
            const answer = await this.localPeerConnection.createAnswer()
            await this.localPeerConnection.setLocalDescription(answer)
            this._sendSignalingMessage({
                type: 'webrtc-ping-answer',
                to: this.remotePeerId,
                from: this.localId,
                answer: answer,
            })
        } catch (error) {
            console.error('Error handling offer:', error)
        }
    }

    async _handleAnswer(message) {
        try {
            await this.localPeerConnection.setRemoteDescription(
                new RTCSessionDescription(message.answer)
            )
        } catch (error) {
            console.error('Error handling answer:', error)
        }
    }

    async _handleCandidate(message) {
        try {
            if (message.candidate) {
                await this.localPeerConnection.addIceCandidate(message.candidate)
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error)
        }
    }

    _sendSignalingMessage(message) {
        console.log('Sending signaling message:', message)
        this.signalingServer.send(JSON.stringify(message))
    }
}
