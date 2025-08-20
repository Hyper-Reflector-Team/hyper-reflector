import { Box, Button, Input, Stack } from '@chakra-ui/react'
import { onAuthStateChanged } from 'firebase/auth'
import { useCallback, useEffect, useState } from 'react'
import { auth, loginEmail, loginGoogle, callable } from '../utils/firebase'
import { Field } from '../components/chakra/ui/field'
import { PasswordInput } from '../components/chakra/ui/password-input'
// import api from '../../../external-api/requests'

// import { useLayoutStore, useLoginStore, useMessageStore } from '../../../state/deprecated_store'

// await loginEmail('test@test.com', 'passs')
// or

export default function HomePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [currentUser, setCurrentUser] = useState()
    const [loginObject, setLoginObject] = useState<{ email: string; password: string }>({
        email: '',
        password: '',
    })

    async function loginEmailHelper() {
        loginEmail(loginObject.email, loginObject.password)
    }

    async function loginGoogleHelper() {
        loginGoogle()
    }

    return (
        <Box>
            <Stack>
                <Field label="Email" required>
                    <Input
                        maxLength={50}
                        minLength={1}
                        placeholder="bobby@example.com"
                        // disabled={isLoading}
                        onChange={(e) =>
                            setLoginObject({
                                email: e.target.value,
                                password: loginObject.password,
                            })
                        }
                        type="text"
                        value={loginObject.email}
                        // onKeyDown={(e) => {
                        //     if (e.key === 'Enter' && login.email && login.pass) {
                        //         setIsLoading(true)
                        //         window.api.loginUser(login)
                        //     }
                        // }}
                    />
                </Field>
                <Field label="Password" required>
                    <PasswordInput
                        // bg={theme.colors.main.textSubdued}
                        // color={theme.colors.main.bg}
                        maxLength={160}
                        minLength={1}
                        placeholder="password"
                        // disabled={isLoading}
                        onChange={(e) =>
                            setLoginObject({
                                email: loginObject.email,
                                password: e.target.value,
                            })
                        }
                        type="password"
                        value={loginObject.password}
                        // onKeyDown={(e) => {
                        //     if (e.key === 'Enter' && login.email && login.pass) {
                        //         // setIsLoading(true)
                        //         window.api.loginUser(login)
                        //     }
                        // }}
                    />
                </Field>
                <Button onClick={loginEmailHelper}>Login</Button>
            </Stack>
            <Button onClick={loginGoogleHelper}>Google Login</Button>
            <div>Hey this is the home page we are rebuilding everything</div>
        </Box>
    )
}
