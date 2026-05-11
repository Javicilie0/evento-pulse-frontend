import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { AuthUser } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) return null

          const data = await res.json() as { token: string; user: AuthUser }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.userName,
            image: data.user.profileImageUrl ?? null,
            accessToken: data.token,
            roles: data.user.roles,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.roles = (user as any).roles
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.roles = token.roles as string[]
      session.user.firstName = token.firstName as string | undefined
      session.user.lastName = token.lastName as string | undefined
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
})

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      roles: string[]
      firstName?: string
      lastName?: string
    }
  }
}
