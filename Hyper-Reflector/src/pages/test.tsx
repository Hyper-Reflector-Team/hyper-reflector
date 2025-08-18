import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import App from '../App'

const theme = extendTheme({
    fonts: { heading: 'InterVariable, system-ui', body: 'InterVariable, system-ui' },
    config: { initialColorMode: 'system', useSystemColorMode: true },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <App />
        </ChakraProvider>
    </React.StrictMode>
)
