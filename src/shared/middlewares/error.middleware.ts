import { ApiError } from '#shared/exceptions/api.error.js'

import type { Errback, NextFunction, Request, Response } from 'express'


export const errorMiddleware = (err: Errback, _: Request, res: Response, __: NextFunction) => {
  console.error(err)

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      errors:  err.errors,
    })
  }

  return res.status(500).json({ message: 'Что-то пошло не так' })
}
