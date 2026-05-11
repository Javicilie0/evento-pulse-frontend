import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { AuthUser } from '@/types/api'

interface EventoAuthUser {
  id: string
  email: string
  name: string
  image: string | null
  accessToken: string
  roles: string[]
  firstName?: string
  lastName?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7180'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email or username', type: 'text' },
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
      const eventoToken = token as typeof token & {
        userId?: string
        accessToken?: string
        roles?: string[]
        firstName?: string
        lastName?: string
      }
      if (user) {
        const eventoUser = user as EventoAuthUser
        eventoToken.userId = eventoUser.id
        eventoToken.accessToken = eventoUser.accessToken
        eventoToken.roles = eventoUser.roles
        eventoToken.firstName = eventoUser.firstName
        eventoToken.lastName = eventoUser.lastName
      }
      return eventoToken
    },
    async session({ session, token }) {
      const eventoToken = token as typeof token & {
        userId?: string
        accessToken?: string
        roles?: string[]
        firstName?: string
        lastName?: string
      }
      session.accessToken = eventoToken.accessToken as string
      session.user.id = eventoToken.userId as string
      session.user.roles = eventoToken.roles as string[]
      session.user.firstName = eventoToken.firstName
      session.user.lastName = eventoToken.lastName
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
