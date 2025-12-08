import { AuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { JWT } from 'next-auth/jwt'

interface DiscordProfile {
  id: string
  username: string
  avatar: string
  discriminator: string
  public_flags: number
}

// Discord does NOT provide refresh tokens unless the app is VERIFIED.
// → So refresh will never work for unverified apps.
// → We apply a stable fallback "fake refresh" that simply extends the lifetime.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log('⚠️ Discord does not provide refresh tokens for unverified apps.')

  // Extend token expiration by one additional hour so the session stays valid
  return {
    ...token,
    accessTokenExpires: Date.now() + 3600 * 1000, // +1 hour
    error: undefined,
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env variable: ${name}`)
  return value
}

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: requiredEnv('DISCORD_CLIENT_ID'),
      clientSecret: requiredEnv('DISCORD_CLIENT_SECRET'),
      authorization: {
        params: { scope: 'identify guilds' },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // FIRST LOGIN: save access token and user ID
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: (account.expires_at as number) * 1000,
          refreshToken: account.refresh_token ?? null, // → always null for unverified apps
          userId: (profile as DiscordProfile).id,
        }
      }

      // TOKEN STILL VALID?
      if (Date.now() < (token.accessTokenExpires as number) - 1000) {
        return token
      }

      // TOKEN EXPIRED → attempt a fallback refresh
      return await refreshAccessToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken ?? null
      session.userId = token.userId
      session.error = token.error ?? null
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}
