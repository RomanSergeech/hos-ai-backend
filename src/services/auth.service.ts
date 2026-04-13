import { ApiError } from '#shared/exceptions/api.error.js'
import { readJson } from '#shared/utils/json.utils.js'
import TokenService from './token.service.js'

import type { TUser } from '#shared/types/users.types.js'
import type { TCompany } from '#shared/types/company.types.js'
import type { TTokenData } from './token.service.js'


class Service {

  async login(login: string, password: string) {
    const [users, companies] = await Promise.all([
      readJson<TUser[]>('users.json'),
      readJson<TCompany[]>('companies.json'),
    ])
    const user = users.find(u => u.login === login)

    if (!user) {
      throw ApiError.UnauthorizedError('Неверные email или пароль')
    }

    const tokens  = await this.generateTokens(user)
    const company = companies.find(c => c.id === user.company_id) ?? null

    const { password: _, refresh_token: __, ...publicUser } = user

    return { ...tokens, user: publicUser, company }
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError('Unauthorized')
    }

    const tokenData    = TokenService.validateRefreshToken(refreshToken)
    const storedToken  = tokenData ? await TokenService.findToken(tokenData.login) : null

    if (!tokenData || !storedToken || storedToken !== refreshToken) {
      throw ApiError.UnauthorizedError('Unauthorized')
    }

    const [users, companies] = await Promise.all([
      readJson<TUser[]>('users.json'),
      readJson<TCompany[]>('companies.json'),
    ])
    const user = users.find(u => u.login === tokenData.login)

    if (!user) {
      throw ApiError.UnauthorizedError('Unauthorized')
    }

    const tokens  = await this.generateTokens(user)
    const company = companies.find(c => c.id === user.company_id) ?? null

    const { password: _, refresh_token: __, ...publicUser } = user

    return { ...tokens, user: publicUser, company }
  }

  private async generateTokens(user: TUser) {
    const payload: TTokenData = { id: user.id, login: user.login, role: user.role, name: user.name }
    const tokens = TokenService.generateTokens(payload)
    await TokenService.saveToken(user.login, tokens.refreshToken)
    return tokens
  }

}

const AuthService = new Service()

export default AuthService
