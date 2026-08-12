import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { CallbackHandler } from '../components/CallbackHandler'
import { IdentityProvider } from '../lib/identity-context'
import '../styles.css'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#07120f' },
      { title: 'Vitality — Your Health. One Intelligent Timeline.' },
      { name: 'description', content: 'A secure personal health tracking and medication companion.' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body><IdentityProvider><CallbackHandler>{children}</CallbackHandler></IdentityProvider><Scripts /></body></html>
}
