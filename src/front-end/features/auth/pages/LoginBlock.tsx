import { Box, Button, Center, Flex, Heading, Input, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Hammer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Field } from '@features/common/ui/field'
import { PasswordInput } from '@features/common/ui/password-input'
import { useLoginStore, useMessageStore, useLayoutStore } from '@features/common/state'

export default function LoginBlock() {
    const [login, setLogin] = useState({ email: '', pass: '' })
    const [isLoading, setIsLoading] = useState(false)
    const theme = useLayoutStore((state) => state.appTheme)
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const failedLogin = useLoginStore((state) => state.failedLogin)
    const successLogin = useLoginStore((state) => state.successLogin)
    const setUserState = useLoginStore((state) => state.setUserState)
    const addUser = useMessageStore((state) => state.pushUser)
    const clearUserList = useMessageStore((state) => state.clearUserList)

    const navigate = useNavigate()

    const handleLoginClick = () => {
        setIsLoading(true)
        window.api.loginUser(login)
    }

    const handleLogIn = (loginInfo: any) => {
        setUserState(loginInfo)
        addUser(loginInfo)
        successLogin()
        setIsLoading(false)
        navigate({ to: '/chat' })
    }

    const handleLoginFail = (event: any) => {
        setIsLoading(false)
        clearUserList()
        failedLogin()
        navigate({ to: '/' })
    }

    useEffect(() => {
        window.api.removeExtraListeners('loginSuccess', handleLogIn)
        window.api.on('loginSuccess', handleLogIn)

        window.api.removeExtraListeners('login-failed', handleLoginFail)
        window.api.on('login-failed', handleLoginFail)

        return () => {
            window.api.removeListener('loginSuccess', handleLogIn)
            window.api.removeListener('login-failed', handleLoginFail)
        }
    }, [])

    return (
        <>
            {isLoading && (
                <Box pos="absolute" inset="0" bg={theme.colors.main.bg} opacity="50%">
                    <Center h="full">
                        <Spinner color={theme.colors.main.action} />
                    </Center>
                </Box>
            )}

            {!isLoggedIn && (
                <Heading size="md" color={theme.colors.main.textMedium}>
                    Sign In
                </Heading>
            )}

            <form onSubmit={handleLoginClick} autoComplete="on">
                <Stack gap={2} maxW={{ base: '100%', md: '50%', xl: '40%' }} mx="auto">
                    <Box>
                        {!isLoggedIn && (
                            <Stack gap={6}>
                                <Field label="Email" required color={theme.colors.main.textMedium}>
                                    <Input
                                        autoComplete="email"
                                        bg={theme.colors.main.textSubdued}
                                        color={theme.colors.main.bg}
                                        maxLength={50}
                                        placeholder="bobby@example.com"
                                        disabled={isLoading}
                                        onChange={(e) =>
                                            setLogin({
                                                ...login,
                                                email: e.target.value,
                                            })
                                        }
                                        type="text"
                                        value={login.email}
                                    />
                                </Field>

                                <Field
                                    label="Password"
                                    required
                                    color={theme.colors.main.textMedium}
                                >
                                    <PasswordInput
                                        autoComplete="current-password"
                                        type="password"
                                        bg={theme.colors.main.textSubdued}
                                        color={theme.colors.main.bg}
                                        maxLength={160}
                                        placeholder="password"
                                        disabled={isLoading}
                                        onChange={(e) =>
                                            setLogin({ ...login, pass: e.target.value })
                                        }
                                        value={login.pass}
                                    />
                                </Field>

                                <Stack>
                                    <Button
                                        type="submit"
                                        bg={theme.colors.main.actionSecondary}
                                        disabled={isLoading}
                                        id="login-btn"
                                    >
                                        Log In
                                    </Button>
                                    <Text textStyle="sm" color={theme.colors.main.textMedium}>
                                        <Link to="/create" className="[&.active]:font-bold">
                                            <Flex gap="1">
                                                <div> Create New Account </div>
                                                <Hammer size={18} />
                                            </Flex>
                                        </Link>
                                    </Text>
                                </Stack>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </form>
        </>
    )
}
