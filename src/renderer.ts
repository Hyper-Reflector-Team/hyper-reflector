import keys from './private/keys'
import './index.css'
// Load the react application
import './front-end/app'
import { PeerManager } from './webRTC/peerManager'

let signalServerSocket: WebSocket = null // socket reference
let candidateList = []
let callerIdState = null
let userName: string | null = null
let myUID: string | null = null
let opponentUID: string | null = null
let playerNum: number | null = null

// const SOCKET_ADDRESS = `ws://127.0.0.1:3001` // debug
const SOCKET_ADDRESS = `ws://${keys.COTURN_IP}:3002`

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
// window.api.on('closingApp', async (user) => {
//     // kill the socket connection
//     if (signalServerSocket) {
//         console.log('we are killing the socket user')
//         await signalServerSocket.send(JSON.stringify({ type: 'userDisconnect', user }))
//         signalServerSocket.close()
//         signalServerSocket = null
//     }
// })

function connectWebSocket(user) {
    if (signalServerSocket) return // Prevent duplicate ws connections from same client
    // signalServerSocket = new WebSocket(`ws://127.0.0.1:3000`) // for testing server
    signalServerSocket = new WebSocket(SOCKET_ADDRESS)
    signalServerSocket.onopen = () => {
        signalServerSocket.send(JSON.stringify({ type: 'join', user }))
        signalServerSocket.send(JSON.stringify({ type: 'user-connect', user }))
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

    /// testing peer manager

    const manager = new PeerManager(myUID, signalServerSocket, {
        onData: (from, data) => {
            console.log(`Received from ${from}:`, data)
        },
        onPing: (from, latency) => {
            console.log(`Ping from ${from}: ${latency}ms`)
        },
        onDisconnect: (uid) => {
            console.log(`${uid} disconnected`)
        },
    })
    ///

    // allow users to chat
    window.api.on('sendMessage', (messageObject: { text: string; user: any }) => {
        // Send message to all
        manager.broadcast({ type: 'chat', text: 'Hello everyone!' })

        // Ping everyone
        manager.pingAll()
        // sends a message over to another user
        // probably need more validation
        if (messageObject.text.length) {
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

    signalServerSocket.onmessage = async (message) => {
        const data = await convertBlob(message).then((res) => res)
        if (data.type === 'connected-users') {
            if (data.users.length) {
                console.log(data.users)
                data.users.forEach((user) => {
                    if (user.uid !== myUID) {
                        manager.connectTo(user.uid)
                    }
                })
                window.api.addUserGroupToRoom(data.users)
            }
        }

        if (data.type === 'user-connect') {
            console.log('user-connect')
            signalServerSocket.send(JSON.stringify({ type: 'join', user }))
        }

        if (data.type === 'userDisconnect') {
            // Here we want to close the Peer connection if a user leaves if the connection already exists.
            // closePeerConnection(data.userUID)
            console.log('user DCed from socket server')
            manager.closeByID(data.userUID)
        }

        if (data.type === 'lobby-user-counts') {
            console.log('lobby update', data.updates)
            window.api.updateLobbyStats(data.updates)
        }

        if (data.type === 'matchEndedClose') {
            //user the userUID and close all matches.
            if (opponentUID === data.userUID) {
                // closePeerConnection(data.userUID)
                window.api.killEmulator()
                resetState()
            }
            if (!opponentUID) {
                resetState()
            }
        }

        if (data.type === 'getRoomMessage') {
            window.api.sendRoomMessage(data)
        }

        // if (data.type === 'incomingCall') {
        //     // await createNewPeerConnection(data.callerId, false)
        //     // await peerConnections[data.callerId]
        //     //     .setRemoteDescription(new RTCSessionDescription(data.offer))
        //     //     .catch((err) => console.warn(err))
        //     // console.log(data)
        //     // window.api.receivedCall(data)
        // }

        // if (data.type === 'callAnswered') {
        //     // await peerConnections[data.data.answererId].setRemoteDescription(
        //     //     new RTCSessionDescription(data.data.answer)
        //     // )
        //     opponentUID = data.data.answererId // set the current opponent so we can get them from the peer list.
        //     signalServerSocket.send(
        //         JSON.stringify({
        //             type: 'iceCandidate',
        //             data: { targetId: data.data.answererId, candidate: candidateList[0] },
        //         })
        //     )
        //     playerNum = 0 // if our call is answered we are always player 0
        //     // window.api.startGameOnline(opponentUID, playerNum)
        // }

        if (data.type === 'callDeclined') {
            // closePeerConnection(data.data.answererId)
            window.api.callDeclined(data.data.answererId)
        }

        if (data.type === 'iceCandidate') {
            console.info(
                'made a connection with someone, probably need to initialize some data channel stuff'
            )
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
