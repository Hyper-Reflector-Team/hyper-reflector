import keys from '../private/keys' // for stun server
// init webrtc
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: `stun:${keys.COTURN_IP}:${keys.COTURN_PORT}` },
    // {
    //     urls: [`turn:${keys.COTURN_IP}:${keys.COTURN_PORT}?transport=udp`],
    //     username: 'turn',
    //     credential: 'turn',
    //     credentialType: 'password',
    // },
]

var clients: { to: string; peer: RTCPeerConnection }[] = []
var dataChannels: { to: string; from: string; channel: RTCDataChannel }[] = []

export async function initWebRTC(
    myUID: string,
    toUID: string,
    signalingSocket: WebSocket,
    isAnswer?: boolean,
    offer?: any
): Promise<RTCPeerConnection> {
    const peer = new RTCPeerConnection({
        iceServers,
        //iceTransportPolicy: 'relay',
    })

    createDataChannel(peer, toUID, myUID)

    // send new ice candidates from the coturn server
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            signalingSocket.send(
                JSON.stringify({
                    type: 'webrtc-ping-candidate',
                    to: toUID,
                    from: myUID,
                    candidate: event.candidate,
                })
            )
            if (event.candidate.type === 'srflx' || event.candidate.type === 'host') {
                // if we only require the stun server then we can break out of here.
                console.log('STUN ICE Candidate:', event.candidate)
            }
            // if the below is true it means we've successfully udp tunnelled to the candidate on the turn server
            if (event.candidate.type === 'relay') {
                // we should be able use the below information on relayed players to connect via fbneo
                console.log('TURN ICE Candidate:', event.candidate)
                console.log(event.candidate.address, event.candidate.port)
                console.log('UDP tunneled through TURN server!')
            }
        }
    }

    peer.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peer.iceConnectionState)
        if (peer.iceConnectionState === 'connected') {
            console.log('-------------------------- > Peer connection established!')
        }
    }

    if (isAnswer) {
        await peer.setRemoteDescription(new RTCSessionDescription(offer))
        answerCall(peer, signalingSocket, toUID, myUID)
    }

    return peer
}

export async function startCall(
    peerConnection: RTCPeerConnection,
    signalingSocket: WebSocket,
    to: string,
    from: string,
    isCaller?: boolean // debug feature
) {
    if (!isCaller) return

    if (clients.find((client) => client.to === to)) {
        console.log('peer client exists skipping call')
        return
    }
    console.log('starting call with: ', to)
    if (peerConnection) {
        clients.push({ to: to, peer: peerConnection })
        console.log('current clients after push', clients)
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        signalingSocket.send(
            JSON.stringify({
                type: 'webrtc-ping-offer',
                to,
                from,
                offer,
            })
        )
    }
}

export async function answerCall(
    peerConnection: RTCPeerConnection,
    signalingSocket: WebSocket,
    to: string,
    from: string
) {
    console.log('answering call', to, from)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    signalingSocket.send(
        JSON.stringify({
            type: 'webrtc-ping-answer',
            to,
            from,
            answer,
        })
    )
}

function createDataChannel(peerConnection: RTCPeerConnection, to: string, from: string) {
    const channel = peerConnection.createDataChannel('chat', { negotiated: true, id: 0 })
    channel.onopen = (event) => {
        channel.send('Hi!')
    }
    channel.onmessage = (event) => {
        console.log(event.data)
    }
    dataChannels.push({ to, from, channel })
}

export function webCheckData(peerConnection: RTCPeerConnection) {
    if (peerConnection) {
        console.log('signalling state', peerConnection.signalingState)
        console.log('ice gathering state', peerConnection.iceGatheringState)
        console.log('ice connection state', peerConnection.iceConnectionState)
        console.log('remote state', peerConnection.currentRemoteDescription)
        console.log('local state', peerConnection.currentLocalDescription)
        if (dataChannels && dataChannels.length) {
            console.log('data channel id? ', dataChannels[0]?.channel?.id || 'no id')
            console.log(
                'data channel is ready? ',
                dataChannels[0]?.channel?.readyState || 'no channel'
            )
            console.log('data channels ', dataChannels)
        }
        console.log('peer connections ', peerConnection)
    }
}

export function sendDataChannelMessage(message: string) {
    if (dataChannels.length && dataChannels[0]?.channel?.readyState === 'open') {
        dataChannels[0]?.channel?.send(message)
    } else {
        console.log('no channel to send on, state: ', dataChannels[0]?.channel || 'null channel')
    }
}

export async function closeAllPeers(peerConnection: RTCPeerConnection) {
    console.log('closing peers')
    peerConnection.close()
    clients = [] // todo replace this with actual logic
    dataChannels = []
}
