import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Box, Button, Input, Stack } from '@chakra-ui/react'
import { Field } from '../components/chakra/ui/field'
import { PasswordInput } from '../components/chakra/ui/password-input'
import { onAuthStateChanged } from 'firebase/auth'
import type { FirebaseError } from 'firebase/app'
import { auth, loginEmail, loginGoogle } from '../utils/firebase'
// External API facing the server
import api from '../external-api/requests'
import { TUser } from '../types/user'
import { useUserStore } from '../state/store'

export default function LoginPage() {
    const navigate = useNavigate()
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const setGlobalUser = useUserStore((s) => s.setGlobalUser)
    const setGlobalLoggedIn = useUserStore((s) => s.setGlobalLoggedIn)
    const [isLoading, setIsLoading] = useState(false)
    const [loggedInUser, setLoggedInUser] = useState<TUser | undefined>(undefined)
    const [loginObject, setLoginObject] = useState<{ email: string; password: string }>({
        email: '',
        password: '',
    })

    const handleFailUser = () => {
        setLoggedInUser(undefined)
        setIsLoading(false)
        setGlobalLoggedIn(false)
    }

    // This checking if authstate has changed, IE signing in or out.
    useEffect(() => {
        setIsLoading(true)
        // set as any because the types from firebase could change randomly
        const unsub = onAuthStateChanged(auth, async (login: any) => {
            console.log('auth state changed')
            if (!login) {
                handleFailUser()
                return
            }

            try {
                const loginObject = await api.getLoggedInUser(login.email).catch(() => {
                    handleFailUser()
                })
                if (loginObject?.loggedIn) console.log('user was already logged in', loginObject)

                const user = await api.getUserByAuth(auth).catch(() => {
                    handleFailUser()
                })
                if (user) {
                    setLoggedInUser(user)
                    setGlobalUser(user)
                    setGlobalLoggedIn(true)
                    changeRoute('/lobby')
                }
            } catch {
                handleFailUser()
            } finally {
                setIsLoading(false)
            }
        })
        return unsub
    }, [])

    async function loginEmailHelper() {
        setIsLoading(true)
        try {
            await loginEmail(loginObject.email, loginObject.password)
        } catch (e) {
            const err = e as FirebaseError
            console.warn('failed to log in', err.code, err.message)
            handleFailUser()
        }
    }

    async function loginGoogleHelper() {
        setIsLoading(true)
        try {
            // Doesnt cause auth state to change, so we need to write code to handle logging in with google
            const test = await loginGoogle()
            console.log(test)
        } catch (e) {
            handleFailUser()
        }
    }

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    return (
        <Box>
            <Stack>
                <div>{isLoading ? <div>Loadin</div> : null}</div>
                <div>{loggedInUser ? <div>{loggedInUser.userName}</div> : null}</div>
                {!globalLoggedIn ? (
                    <Stack>
                        <Field label="Email" required>
                            <Input
                                disabled={!!loggedInUser || isLoading}
                                maxLength={50}
                                minLength={1}
                                placeholder="hyper@reflector.com"
                                onChange={(e) =>
                                    setLoginObject({
                                        email: e.target.value,
                                        password: loginObject.password,
                                    })
                                }
                                type="text"
                                value={loginObject.email}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        loginObject.email &&
                                        loginObject.password
                                    ) {
                                        setIsLoading(true)
                                        loginEmailHelper()
                                    }
                                }}
                            />
                        </Field>
                        <Field label="Password" required>
                            <PasswordInput
                                disabled={!!loggedInUser || isLoading}
                                maxLength={160}
                                minLength={1}
                                placeholder="password"
                                onChange={(e) =>
                                    setLoginObject({
                                        email: loginObject.email,
                                        password: e.target.value,
                                    })
                                }
                                type="password"
                                value={loginObject.password}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        loginObject.email &&
                                        loginObject.password
                                    ) {
                                        setIsLoading(true)
                                        loginEmailHelper()
                                    }
                                }}
                            />
                        </Field>
                        <Button
                            disabled={
                                !!loggedInUser ||
                                !loginObject.email ||
                                !loginObject.password ||
                                isLoading
                            }
                            onClick={loginEmailHelper}
                        >
                            Login
                        </Button>
                        <Button disabled={!!loggedInUser || isLoading} onClick={loginGoogleHelper}>
                            Login with Google
                        </Button>
                    </Stack>
                ) : null}
            </Stack>
        </Box>
    )
}
