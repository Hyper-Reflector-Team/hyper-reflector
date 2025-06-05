import keys from './private/keys'
import './index.css'
// Load the react application
import './front-end/app'
import {
    answerCall,
    closeAllPeers,
    initWebRTC,
    pingUser,
    sendDataChannelMessage,
    startCall,
    webCheckData,
} from './webRTC/WebPeer'

let signalServerSocket: WebSocket = null // socket reference
let candidateList = []
let callerIdState = null
let userName: string | null = null
let myUserData: any | null = null
let myUID: string | null = null
let opponentUID: string | null = null
let playerNum: number | null = null

let peerConnection: RTCPeerConnection = null
let currentUsers: any[] = [] // we use this to map through all users in a room

const SOCKET_ADDRESS = `ws://127.0.0.1:3003` // debug
// const SOCKET_ADDRESS = `ws://${keys.COTURN_IP}:3003`

function resetState() {
    candidateList = []
    callerIdState = null
    userName = null
    opponentUID = null
}

window.api.on('loginSuccess', (user) => {
    if (user) {
        myUID = user.uid
        userName = user.email
        myUserData = user
        connectWebSocket(user)
    } else {
        if (signalServerSocket) {
            signalServerSocket.close()
            signalServerSocket = null
        }
    }
})

window.api.on('login-failed', () => {
    // kill the socket connection
    if (signalServerSocket) {
        signalServerSocket.close()
        signalServerSocket = null
    }
})

window.api.on('loggedOutSuccess', async (user) => {
    // kill the socket connection
    if (signalServerSocket) {
        await signalServerSocket.send(JSON.stringify({ type: 'userDisconnect', user }))
        signalServerSocket.close()
        signalServerSocket = null
    }
})

// below code causes some app hanging
window.api.on('closingApp', async (user) => {
    closeAllPeers(peerConnection)
    peerConnection = null
    // kill the socket connection
    // if (signalServerSocket) {
    //     console.log('we are killing the socket user')
    //     await signalServerSocket.send(JSON.stringify({ type: 'userDisconnect', user }))
    //     signalServerSocket.close()
    //     signalServerSocket = null
    // }
})

window.api.on(
    'callUser',
    async ({ callerId, calleeId }: { callerId: string; calleeId: string }) => {
        startCall(peerConnection, signalServerSocket, calleeId, callerId, true)
    }
)

// handle send answer to specific user
window.api.on(
    'answerCall',
    async ({ callerId, answererId }: { callerId: string; answererId: string }) => {
        console.log('is this actually firing off?', callerId, answererId)
        // let answer = await peerConnections[callerId]?.createAnswer()
        // await peerConnections[callerId].setLocalDescription(answer)

        // signalServerSocket.send(
        //     JSON.stringify({
        //         type: 'answerCall',
        //         data: {
        //             callerId,
        //             answer,
        //             answererId,
        //         },
        //     })
        // )
        callerIdState = callerId
        opponentUID = callerId
        playerNum = 1 // if we answer a call we are always player 1
        window.api.startGameOnline(opponentUID, playerNum)
    }
)

// window.api.on(
//     'declineCall',
//     async ({ callerId, answererId }: { callerId: string; answererId: string }) => {
//         await signalServerSocket.send(
//             JSON.stringify({
//                 type: 'declineCall',
//                 data: {
//                     callerId,
//                     answererId,
//                 },
//             })
//         )
//         await closePeerConnection(callerId) // close the peer connection when we decline
//     }
// )

function connectWebSocket(user) {
    if (signalServerSocket) return // Prevent duplicate ws connections from same client
    // signalServerSocket = new WebSocket(`ws://127.0.0.1:3000`) // for testing server
    signalServerSocket = new WebSocket(SOCKET_ADDRESS)
    signalServerSocket.onopen = () => {
        signalServerSocket.send(JSON.stringify({ type: 'join', user }))
    }

    signalServerSocket.onclose = async (user) => {
        if (signalServerSocket) {
            await signalServerSocket.send(JSON.stringify({ type: 'userDisconnect', user }))
        }
        signalServerSocket = null
    }

    signalServerSocket.onerror = (error) => {
        console.error('WebSocket Error:', error)
    }

    // allow users to chat
    window.api.on('sendMessage', async (messageObject: { text: string; user: any }) => {
        // Send message to all
        // probably need more validation
        if (messageObject.text.length) {
            // Below is debug code for starting web rtc stuff
            if (messageObject.text === 'close' && peerConnection) {
                await closeAllPeers(peerConnection) // TODO fix this we will have an array
                peerConnection = null
            }
            if (messageObject.text === 'ping' && peerConnection) {
                pingUser(user.uid)
            }
            if (messageObject.text === 'vid') {
                try {
                } catch (error) {
                    console.log(error)
                }
            }
            signalServerSocket.send(
                JSON.stringify({
                    type: 'sendMessage',
                    message: `${messageObject.text}`,
                    sender: {
                        name: messageObject.user.name,
                        uid: myUID,
                        lobbyId: messageObject.user.currentLobbyId || 'Hyper Reflector',
                    },
                })
            )
        }
        sendDataChannelMessage('Hey transmitting on data channel whats up')
    })

    window.api.on('createNewLobby', (lobbyInfo) => {
        console.log('sending lobby data', lobbyInfo)
        signalServerSocket.send(
            JSON.stringify({
                type: 'createLobby',
                lobbyId: lobbyInfo.name,
                pass: lobbyInfo.pass,
                private: lobbyInfo.private,
                user: lobbyInfo.user, // this is our full user object
            })
        )
    })

    window.api.on('userChangeLobby', (lobbyInfo) => {
        console.log('hey we changed lobbies', lobbyInfo)
        signalServerSocket.send(
            JSON.stringify({
                type: 'changeLobby',
                newLobbyId: lobbyInfo.newLobbyId,
                pass: lobbyInfo.pass,
                private: lobbyInfo.private,
                user: lobbyInfo.user, // this is our full user object
            })
        )
    })

    // This is a function for handling messages from the websocket server
    async function convertBlob(event: any) {
        try {
            // check if event is not JSON but is blob
            if (event.data instanceof Blob) {
                const text = await event.data.text()
                const data = JSON.parse(text)
                return data
            } else {
                const data = JSON.parse(event.data)
                return data
            }
        } catch (error) {
            console.error('could not convert data:', event.data, error)
        }
    }

    function checkConnectionStability() {
        const connection =
            navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (connection) {
            const isUnstable =
                connection.effectiveType === '4g' &&
                connection.rtt < 100 &&
                connection.downlink > 10
            return isUnstable
        }
        return false
    }

    signalServerSocket.onmessage = async (message) => {
        const data = await convertBlob(message).then((res) => res)
        if (data.type === 'connected-users') {
            if (data.users.length) {
                currentUsers = data.users
                // PingManager.addPeers(data.users)
                // The timing issue is here.
                data.users.forEach(async (user) => {
                    if (user.uid !== myUID) {
                        console.log(data.users)
                        signalServerSocket.send(
                            JSON.stringify({
                                type: 'estimate-ping-users',
                                data: {
                                    userA: {
                                        id: myUserData.uid,
                                        stability: checkConnectionStability(),
                                    },
                                    userB: {
                                        id: user.uid,
                                    },
                                },
                            })
                        )
                        peerConnection = await initWebRTC(myUID, user.uid, signalServerSocket)
                    }
                })
                window.api.addUserGroupToRoom(data.users)
            }
        }

        if (data.type === 'update-user-pinged') {
            console.log('hey the user has a ping, lets update all that data----------------', data)
            window.api.updateUserData(data?.data)
        }

        if (data.type === 'userDisconnect') {
            // TODO this isn't actually being used anymore?
            // Here we want to close the Peer connection if a user leaves if the connection already exists.
            console.log('user DCed from socket server')
        }

        if (data.type === 'lobby-user-counts') {
            console.log('lobby update', data.updates)
            window.api.updateLobbyStats(data.updates)
        }

        if (data.type === 'matchEndedClose') {
            //user the userUID and close all matches.
            if (opponentUID === data.userUID) {
                window.api.killEmulator()
                resetState()
            }
            if (!opponentUID) {
                resetState()
            }
        }

        if (data.type === 'getRoomMessage') {
            window.api.sendRoomMessage(data)
            webCheckData(peerConnection)
        }

        if (data.type === 'callDeclined') {
            // closePeerConnection(data.data.answererId)
            window.api.callDeclined(data.data.answererId)
        }

        // new web rtc
        if (data.type === 'webrtc-ping-offer') {
            // im pretty sure we need a local description for both off and answer before we set remote.
            // there is a timing issue here that nees to be fixed.
            console.log('hey we got offer from ', data.from)
            // call init with answer params

            // push challenge message that can be accepted
            peerConnection = await initWebRTC(
                myUID,
                data.from,
                signalServerSocket,
                true,
                data.offer
            )
            // this may or may not fire
            window.api.receivedCall(data)
        } else if (data.type === 'webrtc-ping-answer') {
            console.log('hey we got answer')
            try {
                // there is a timing issue here that nees to be fixed.
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
            } catch (error) {
                console.warn(error)
            }
        } else if (data.type === 'webrtc-ping-candidate') {
            const candidate = new RTCIceCandidate(data.candidate)
            //console.log('Received ICE candidate:', candidate)
            try {
                await peerConnection.addIceCandidate(candidate)
                console.log('ICE candidate added immediately.')
            } catch (error) {
                console.warn('Failed to add ICE candidate:', error)
            }
        }
    }
}

//ends match with any player who has an active connection with you, this should also close the rtc connection
window.api.on('endMatch', (userUID: string) => {
    if (userUID) {
        signalServerSocket.send(
            JSON.stringify({
                type: 'matchEnd',
                userUID,
            })
        )
    }
})
