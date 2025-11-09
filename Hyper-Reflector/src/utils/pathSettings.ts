import { resolveResource, dirname, join, normalize, resolve } from '@tauri-apps/api/path'
import { useSettingsStore } from '../state/store'

const hasValue = (value?: string | null): value is string =>
    typeof value === 'string' && value.trim().length > 0

const isTauriEnv = () => typeof window !== 'undefined' && '__TAURI__' in window

const isAbsolutePath = (path: string) => /^[a-zA-Z]:\\|^\\\\|^\//.test(path)

async function normalizeEmulatorPath(path: string) {
    let resolved = path
    try {
        resolved = await normalize(path)
    } catch {
        // no-op: fall back to original path
    }

    if (!isAbsolutePath(resolved)) {
        try {
            resolved = await normalize(await resolve(path))
        } catch {
            // still relative: return best effort
        }
    }

    return resolved
}

export async function ensureDefaultEmulatorPath() {
    try {
        const { emulatorPath, setEmulatorPath } = useSettingsStore.getState()
        if (hasValue(emulatorPath)) {
            return
        }

        const candidatePaths: string[] = []

        if (isTauriEnv()) {
            try {
                const resourcePath = await resolveResource('emu/hyper-screw-fbneo/fs-fbneo.exe')
                if (hasValue(resourcePath)) {
                    candidatePaths.push(resourcePath)
                }
            } catch (error) {
                console.warn('Failed to resolve bundled emulator path:', error)
            }

            candidatePaths.push('_up_/emu/hyper-screw-fbneo/fs-fbneo.exe')
            candidatePaths.push('../Resources/emu/hyper-screw-fbneo/fs-fbneo.exe')
        }

        candidatePaths.push('../emu/hyper-screw-fbneo/fs-fbneo.exe')
        candidatePaths.push('emu/hyper-screw-fbneo/fs-fbneo.exe')

        const fallbackPath = candidatePaths.find(hasValue)

        if (fallbackPath) {
            setEmulatorPath(fallbackPath)
        }
    } catch (error) {
        console.error('Failed to ensure default emulator path:', error)
    }
}

export async function ensureDefaultTrainingPath(emulatorPathSetting?: string | null) {
    try {
        const { trainingPath, setTrainingPath } = useSettingsStore.getState()
        if (hasValue(trainingPath)) {
            return
        }

        if (hasValue(emulatorPathSetting)) {
            try {
                const resolvedEmuPath = await normalizeEmulatorPath(emulatorPathSetting)
                const emuDir = await dirname(resolvedEmuPath)
                const derived = await normalize(
                    await join(emuDir, '..', '..', 'lua', '3rd_training_lua', '3rd_training.lua')
                )
                setTrainingPath(derived)
                return
            } catch (error) {
                console.warn('Failed to derive training lua from emulator path:', error)
            }
        }

        if (isTauriEnv()) {
            try {
                const resourcePath = await resolveResource('lua/3rd_training_lua/3rd_training.lua')
                if (hasValue(resourcePath)) {
                    setTrainingPath(resourcePath)
                    return
                }
            } catch (error) {
                console.warn('Failed to resolve bundled training lua path:', error)
            }
        }
    } catch (error) {
        console.error('Failed to ensure default training lua path:', error)
    }
}

type SettingsState = ReturnType<typeof useSettingsStore.getState>

async function ensureSoundPath(
    emulatorPathSetting: string | null | undefined,
    options: {
        selector: (state: SettingsState) => string | null | undefined
        setter: (state: SettingsState, path: string) => void
        soundFileName: string
        defaultPath: string
    }
) {
    const state = useSettingsStore.getState()
    const currentValue = options.selector(state)
    if (hasValue(currentValue)) {
        return
    }

    if (hasValue(emulatorPathSetting)) {
        try {
            const emuDir = await dirname(emulatorPathSetting)
            const derived = await normalize(
                await join(emuDir, '..', '..', 'sounds', options.soundFileName)
            )
            options.setter(state, derived)
            return
        } catch (error) {
            console.warn(
                `Failed to derive ${options.soundFileName} path from emulator path:`,
                error
            )
        }
    }

    if (isTauriEnv()) {
        try {
            const resourcePath = await resolveResource(`sounds/${options.soundFileName}`)
            if (hasValue(resourcePath)) {
                options.setter(state, resourcePath)
                return
            }
        } catch (error) {
            console.warn(
                `Failed to resolve bundled ${options.soundFileName} sound path:`,
                error
            )
        }
    }

    options.setter(state, options.defaultPath)
}

export async function ensureDefaultChallengeSound(emulatorPathSetting?: string | null) {
    try {
        await ensureSoundPath(emulatorPathSetting, {
            selector: (state) => state.notifChallengeSoundPath,
            setter: (state, path) => state.setNotifChallengeSoundPath(path),
            soundFileName: 'challenge.mp3',
            defaultPath: 'sounds/challenge.mp3',
        })
    } catch (error) {
        console.error('Failed to ensure default challenge sound path:', error)
    }
}

export async function ensureDefaultMentionSound(emulatorPathSetting?: string | null) {
    try {
        await ensureSoundPath(emulatorPathSetting, {
            selector: (state) => state.notifAtSoundPath,
            setter: (state, path) => state.setNotifAtSoundPath(path),
            soundFileName: 'message.wav',
            defaultPath: 'sounds/message.wav',
        })
    } catch (error) {
        console.error('Failed to ensure default mention sound path:', error)
    }
}
