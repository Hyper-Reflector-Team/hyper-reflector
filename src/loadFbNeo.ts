const { spawn } = require('child_process')
import { Config } from './config'

export function launchGGPOSpawn(command: string, callBack: (isOnOpen?: boolean) => any) {
    try {
        const [cmd, ...args] = command.split(' ')
        let child
        child = spawn(cmd, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })

        // Capture stdout (logs from emulator)
        child.stdout.on('data', (data) => {
            console.log(`[FBNeo]: ${data.toString()}`)
        })

        // Capture stderr (errors)
        child.stderr.on('data', (data) => {
            console.error(`[FBNeo Error]: ${data.toString()}`)
            return 'test error'
        })

        // Listen for process exit
        child.on('exit', (code, signal) => {
            // call the kill code
            if (callBack) {
                console.log('emulator callback', callBack, code, signal)
                callBack()
            }

            if (code !== null) {
                console.log(`FBNeo exited with code ${code}`)
                if (code === 1 && callBack) {
                    callBack(true) // failed to open
                }
            } else {
                console.log(`FBNeo terminated by signal ${signal}`)
            }
        })

        // Listen for errors
        child.on('error', (error) => {
            console.error(`Failed to start FBNeo: ${error.message}`)
        })

        return child // Return process reference
    } catch (error) {
        console.error(`Launch error: ${error}`)
    }
}

function fightcadeCmd(config: Config) {
    const { fightcadePath } = config.emulator
    console.log({ platform: process.platform })
    switch (process.platform) {
        case 'darwin':
            return `wine "${fightcadePath}"`
        case 'linux':
            return `wine "${fightcadePath}"`
        default:
            return `"${fightcadePath}"`
    }
}

/**
 * for these file paths like fightcade path and lua path, we need some way to access this directly through electron so we do no need to update all of the time.
 */
export function startPlayingOnline({
    config,
    localPort,
    remoteIp,
    remotePort,
    player,
    delay,
    isTraining = false,
    callBack,
}: {
    config: Config
    localPort: number
    remoteIp: string
    remotePort: number
    player: number
    delay: number
    isTraining: boolean
    callBack: (isOnOpen?: boolean) => any
}) {
    let luaPath = config.emulator.luaPath
    if (isTraining) {
        luaPath = config.emulator.trainingLuaPath
    }
    console.log("starting game on ", `${"127.0.0.1" + ':' + localPort}`, 'sending to: ', `${remoteIp + ':' + remotePort}`)
    // const directCommand = `${fightcadeCmd(config)} quark:direct,sfiii3nr1,${localPort},${remoteIp},${remotePort},${player},${delay},0 --lua ${luaPath}`
    const directCommand = `${fightcadeCmd(config)} --rom sfiii3nr1 direct --player ${player} -n ${player}-p -r ${remoteIp + ':' + remotePort} -d ${delay}`
    switch (process.platform) {
        case 'darwin':
            return launchGGPOSpawn(directCommand, callBack)
        case 'linux':
            return launchGGPOSpawn(directCommand, callBack)
        default:
            return launchGGPOSpawn(directCommand, callBack)
    }
}

export function startSoloMode({
    config,
    callBack,
}: {
    config: Config
    callBack: (isOnOpen?: boolean) => any
}) {
    // const directCommand = `${fightcadeCmd(config)} -game sfiii3nr1 ${config.emulator.trainingLuaPath}`
    const directCommand = `${fightcadeCmd(config)} --rom sfiii3nr1 --lua ${config.emulator.trainingLuaPath}`
    return launchGGPOSpawn(directCommand, callBack)
}

module.exports = {
    startPlayingOnline,
}
