import { validationResult } from 'express-validator'
import { ApiError } from '#shared/exceptions/api.error.js'
import AuthService from '#services/auth.service.js'

import type { NextFunction, Request } from 'express'
import type { TAuthRes, TLoginBody, TDeleteTaskRes } from '#shared/types/api.types.js'


const COOKIE_OPTIONS = { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true } as const


class Controller {

  async login(req: Request, res: TAuthRes, next: NextFunction) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.BadRequest('Ошибка валидации', errors.array())
      }

      const { login, password } = req.body as TLoginBody

      const { accessToken, refreshToken, user, company } = await AuthService.login(login, password)

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

      return res.json({ access_token: accessToken, user, company })
    } catch (err) {
      next(err)
    }
  }

  async refresh(req: Request, res: TAuthRes, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies as { refreshToken?: string }

      const { accessToken, refreshToken: newRefreshToken, user, company } = await AuthService.refresh(refreshToken)

      res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)

      return res.json({ access_token: accessToken, user, company })
    } catch (err) {
      next(err)
    }
  }

  logout(_: Request, res: TDeleteTaskRes, next: NextFunction) {
    try {
      res.clearCookie('refreshToken')
      return res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }

}

const AuthController = new Controller()

export default AuthController
