import { invoke } from '@tauri-apps/api/core'
import { isTauriEnv } from './pathSettings'

type MatchFilePaths = {
    command: string
    stats: string
}

let cachedPaths: MatchFilePaths | null = null
let loggedPaths = false

async function ensurePaths(): Promise<MatchFilePaths | null> {
    if (!isTauriEnv()) {
        return null
    }
    if (!cachedPaths) {
        cachedPaths = {
            command: 'hyper_read_commands.txt',
            stats: 'hyper_track_match.txt',
        }
        if (import.meta.env.DEV) {
            console.log('[match-files] monitoring paths', cachedPaths)
        }
    }
    loggedPaths = true
    return cachedPaths
}

export async function readMatchCommandFile(): Promise<string | null> {
    const paths = await ensurePaths()
    if (!paths) return null
    try {
        if (import.meta.env.DEV) {
            console.log('[match-files] reading command', paths.command)
        }
        const contents = await invoke<string>('read_files_text', { relativePath: paths.command })
        console.log('contents', JSON.stringify(contents))
        return contents ?? null
    } catch (error) {
        console.error('Failed to read match command file', error)
        return null
    }
}

export async function clearMatchCommandFile(): Promise<void> {
    const paths = await ensurePaths()
    if (!paths) return
    try {
        await invoke('write_files_text', { relativePath: paths.command, contents: '' })
        if (import.meta.env.DEV) {
            console.log('[match-files] cleared command', paths.command)
        }
    } catch (error) {
        console.error('Failed to clear match command file', error)
    }
}

export async function readMatchStatsFile(): Promise<string | null> {
    const paths = await ensurePaths()
    if (!paths) return null
    try {
        if (import.meta.env.DEV) {
            console.log('[match-files] reading stats', paths.stats)
        }
        const contents = await invoke<string>('read_files_text', { relativePath: paths.stats })
        return contents ?? null
    } catch (error) {
        console.error('Failed to read match stats file', error)
        return null
    }
}

export async function clearMatchStatsFile(): Promise<void> {
    const paths = await ensurePaths()
    if (!paths) return
    try {
        await invoke('write_files_text', { relativePath: paths.stats, contents: '' })
        if (import.meta.env.DEV) {
            console.log('[match-files] cleared stats', paths.stats)
        }
    } catch (error) {
        console.error('Failed to clear match stats file', error)
    }
}
