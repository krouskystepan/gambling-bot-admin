import axios, { AxiosRequestConfig } from 'axios'
import { Session } from 'next-auth'

import { redirect } from 'next/navigation'

export function redirectToLogin(): never {
  redirect('/login')
}

function redirectToReauth(): never {
  const callbackUrl = encodeURIComponent('/login')
  redirect(`/api/auth/clear-session?callbackUrl=${callbackUrl}`)
}

const DISCORD_API = 'https://discord.com/api/v10'

export async function discordApiRequest<T>(
  session: Session | null,
  config: AxiosRequestConfig
): Promise<T> {
  if (!session?.accessToken) {
    redirectToLogin()
  }

  try {
    const { data } = await axios.request<T>({
      baseURL: DISCORD_API,
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${session.accessToken}`
      }
    })

    return data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        redirectToReauth()
      }

      if (err.response?.status === 429) {
        throw new Error('DiscordRateLimited')
      }
    }

    throw err
  }
}

export async function discordBotRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN missing')
  }

  try {
    const { data } = await axios.request<T>({
      baseURL: DISCORD_API,
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bot ${token}`
      }
    })

    return data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        throw new Error('Invalid Discord bot token')
      }

      if (err.response?.status === 429) {
        throw new Error('DiscordRateLimited')
      }
    }

    throw err
  }
}
