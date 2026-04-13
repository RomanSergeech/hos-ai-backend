import { ApiError } from '#shared/exceptions/api.error.js'
import TokenService from '#services/token.service.js'

import type { NextFunction, Request, Response } from 'express'


export default function authMiddleware(req: Request, _: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return next(ApiError.UnauthorizedError('Unauthorized'))
    }

    const accessToken = authHeader.split(' ')[1]

    if (!accessToken) {
      return next(ApiError.UnauthorizedError('Unauthorized'))
    }

    const userData = TokenService.validateAccessToken(accessToken)

    if (!userData) {
      return next(ApiError.UnauthorizedError('Unauthorized'))
    }

    req.user = userData
    next()
  } catch {
    return next(ApiError.UnauthorizedError('Unauthorized'))
  }
}
