import keys from '../private/keys' // for stun server
// init webrtc
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: `stun:${keys.COTURN_IP}:${keys.COTURN_PORT}` },
    {
        urls: [`turn:${keys.COTURN_IP}:${keys.COTURN_PORT}`],
        username: 'turn',
        credential: 'turn',
    },
]

var clients = []
var dataChannels: { to: string; from: string; channel: RTCDataChannel }[] = []

export async function initWebRTC(
    myUID: string,
    toUID: string,
    signalingSocket: WebSocket
): Promise<RTCPeerConnection> {
    let dataChannel
    const peer = new RTCPeerConnection({
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

    peer.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => console.log('Data Channel Open!')
        dataChannel.onmessage = (event) => console.log('Received:', event.data)
    }

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

    dataChannels.push({ to: toUID, from: myUID, channel: dataChannel }) // need some checks later
    return peer
}

export async function startCall(
    peerConnection: RTCPeerConnection,
    signalingSocket: WebSocket,
    to: string,
    from: string
) {
    createDataChannel(peerConnection, to, from)
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    signalingSocket.send(
        JSON.stringify(
            JSON.stringify({
                type: 'webrtc-ping-offer',
                to,
                from,
                offer,
            })
        )
    )
}

export async function answerCall(
    peerConnection: RTCPeerConnection,
    signalingSocket: WebSocket,
    to: string,
    from: string
) {
    createDataChannel(peerConnection, to, from)
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    signalingSocket.send(
        JSON.stringify(
            JSON.stringify({
                type: 'webrtc-ping-answer',
                to,
                from,
                offer,
            })
        )
    )
}

function createDataChannel(peerConnection: RTCPeerConnection, to: string, from: string) {
    console.log('skipping data channel')
    dataChannels[0].channel = peerConnection.createDataChannel('game', { reliable: true })
    dataChannels[0].channel.onopen = () => console.log('Data Channel Open!')
    dataChannels[0].channel.onmessage = (event) => console.log('Received:', event.data)
}
