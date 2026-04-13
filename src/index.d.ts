import type { TTokenData } from './services/token.service.js'

declare global {
  namespace Express {
    interface Request {
      user?: TTokenData
    }
  }
}
