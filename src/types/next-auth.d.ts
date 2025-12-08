/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string | null
    accessTokenExpires?: number
    refreshToken?: string | null
    tokenType?: string | null
    userId?: string | null
    error?: string | null
  }
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string | null
    userId?: string | null
    error?: string | null
    user?: DefaultSession['user']
  }
}
