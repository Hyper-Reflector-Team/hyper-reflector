import { Bleed, Box, Heading, Stack, Text, Flex } from '@chakra-ui/react'
import BlogPost from '../components/BlogPost'
import { useLayoutStore } from '../state/store'

const blogsArray = [
    {
        title: 'Update Version 0.3.0a',
        date: '4/29/2025',
        content: `
        qweqwe
         'This is the first major update for hyper reflector, unfortunately not touching on this news page =().',
            "test"
        `,
    },
    {
        title: 'Update Version 0.2.2a',
        date: '3/25/2025',
        content: 'hot fixes lua sorry + Small bug fixes from 0.2.0 -- edit: more hotfixes...',
    },
    {
        title: 'Update Version 0.1.9a',
        date: '3/23/2025',
        content:
            'Thanks again for another successful week testing, in this update I add some quality of life improvements for the chat and player profiles, as well as some match bug fixes, please check the release notes on discord. =)',
    },
    {
        title: 'Update Version 0.1.8a',
        date: '3/18/2025',
        content:
            'Took me a minute but, here we are with update 0.1.8 alpha! This adds the precurser to match stat tracking and many features, some updated ui, like profile an chat. As well as changes to our stat tracking lua, enjoy. Full release notes on discord.',
    },
    {
        title: 'Update Version 0.1.7a',
        date: '3/10/2025',
        content:
            'Update v0.1.7a is here, no longer are we reliant on UPNP to manage connections you can see the full changelog on discord, sorry I will eventually fix up the news page!!',
    },
    {
        title: 'Hyper Reflector Alpha!',
        date: '3/4/2025',
        content: 'Welcome to the alpha, hop in the discord',
    },
]

export default function NewsPage() {
    const theme = useLayoutStore((state) => state.appTheme)
    return (
        <Stack gap="2">
            <Heading size="md" color={theme.colors.main.textSubdued}>
                Updates
            </Heading>
            <Stack>
                {blogsArray.map((blog, index) => (
                    <BlogPost blog={blog} key={`blog-post-${index}`} />
                ))}
            </Stack>
        </Stack>
    )
}
