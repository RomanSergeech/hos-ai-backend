import jwt from 'jsonwebtoken'
import { readJson, writeJson } from '#shared/utils/json.utils.js'

import type { TUser, TUserRole } from '#shared/types/users.types.js'


export type TTokenData = {
  id:   string
  login: string
  role:  TUserRole
  name:  string
}


class Service {

  generateTokens(payload: TTokenData) {
    const accessToken  = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!,  { expiresIn: '2d'  })
    const refreshToken = jwt.sign(payload, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '30d' })
    return { accessToken, refreshToken }
  }

  validateAccessToken(token: string): TTokenData | null {
    try {
      return jwt.verify(token, process.env['JWT_ACCESS_SECRET']!) as TTokenData
    } catch {
      return null
    }
  }

  validateRefreshToken(token: string): TTokenData | null {
    try {
      return jwt.verify(token, process.env['JWT_REFRESH_SECRET']!) as TTokenData
    } catch {
      return null
    }
  }

  async saveToken(login: string, refreshToken: string): Promise<void> {
    const users = await readJson<TUser[]>('users.json')
    const updated = users.map(u => u.login === login ? { ...u, refresh_token: refreshToken } : u)
    await writeJson('users.json', updated)
  }

  async findToken(login: string): Promise<string | null> {
    const users = await readJson<TUser[]>('users.json')
    return users.find(u => u.login === login)?.refresh_token ?? null
  }

}

const TokenService = new Service()

export default TokenService
