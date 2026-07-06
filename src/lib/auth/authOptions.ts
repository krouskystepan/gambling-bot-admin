import { HOUR_MS } from 'gambling-bot-shared/common'
import { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import DiscordProvider from 'next-auth/providers/discord'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env variable: ${name}`)
  return value
}

// Discord does not issue refresh tokens for unverified apps.
// We extend expiry instead of pretending to refresh.
async function extendAccessToken(token: JWT): Promise<JWT> {
  return {
    ...token,
    accessTokenExpires: Date.now() + HOUR_MS // +1 hour
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: requiredEnv('DISCORD_CLIENT_ID'),
      clientSecret: requiredEnv('DISCORD_CLIENT_SECRET'),
      authorization: {
        params: { scope: 'identify guilds' }
      }
    })
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + HOUR_MS,
          userId: account.providerAccountId,
          name: profile?.name ?? token.name,
          picture: profile?.image ?? token.picture
        }
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      return extendAccessToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken ?? null
      session.userId = token.userId ?? null
      session.error = token.error ?? null

      if (session.user) {
        session.user.name = token.name ?? session.user.name ?? null
        session.user.image =
          (typeof token.picture === 'string' ? token.picture : null) ??
          session.user.image ??
          null
      }

      return session
    }
  },

  secret: requiredEnv('NEXTAUTH_SECRET')
}
