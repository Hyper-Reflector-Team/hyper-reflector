import { invoke } from '@tauri-apps/api/core'
import { isTauriEnv, resolveFilesPath } from './pathSettings'

type MatchFilePaths = {
    command: string
    stats: string
}

let cachedPaths: MatchFilePaths | null = null

async function ensurePaths(): Promise<MatchFilePaths | null> {
    if (!isTauriEnv()) {
        return null
    }
    if (!cachedPaths) {
        const [command, stats] = await Promise.all([
            resolveFilesPath('hyper_read_commands.txt'),
            resolveFilesPath('hyper_track_match.txt'),
        ])
        cachedPaths = { command, stats }
    }
    return cachedPaths
}

export async function readMatchCommandFile(): Promise<string | null> {
    const paths = await ensurePaths()
    if (!paths) return null
    try {
        return await invoke<string>('plugin:fs|read_text_file', {
            path: paths.command,
        })
    } catch (error) {
        console.error('Failed to read match command file', error)
        return null
    }
}

export async function clearMatchCommandFile(): Promise<void> {
    const paths = await ensurePaths()
    if (!paths) return
    try {
        await invoke('plugin:fs|write_text_file', {
            path: paths.command,
            contents: '',
        })
    } catch (error) {
        console.error('Failed to clear match command file', error)
    }
}

export async function readMatchStatsFile(): Promise<string | null> {
    const paths = await ensurePaths()
    if (!paths) return null
    try {
        return await invoke<string>('plugin:fs|read_text_file', {
            path: paths.stats,
        })
    } catch (error) {
        console.error('Failed to read match stats file', error)
        return null
    }
}

export async function clearMatchStatsFile(): Promise<void> {
    const paths = await ensurePaths()
    if (!paths) return
    try {
        await invoke('plugin:fs|write_text_file', {
            path: paths.stats,
            contents: '',
        })
    } catch (error) {
        console.error('Failed to clear match stats file', error)
    }
}
