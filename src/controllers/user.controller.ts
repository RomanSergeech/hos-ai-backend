import { ApiError } from '#shared/exceptions/api.error.js'
import { readJson, writeJson } from '#shared/utils/json.utils.js'

import type { TUser } from '#shared/types/users.types.js'
import type { NextFunction, Request, Response } from 'express'
import type { TSaveUserSettingsReq, TSaveUserSettingsRes } from '#shared/types/api.types.js'


type TUserPublic = Omit<TUser, 'password' | 'refresh_token'>


class Controller {

  async getById(req: Request<{ id: string }>, res: Response<TUserPublic>, next: NextFunction) {
    try {
      if (req.user!.role !== 'admin') throw ApiError.Forbidden('Доступ запрещён')

      const { id } = req.params
      const users  = await readJson<TUser[]>('users.json')
      const user   = users.find(u => u.id === id)

      if (!user) throw ApiError.NotFound('Пользователь не найден')

      const { password: _, refresh_token: __, ...publicUser } = user
      return res.json(publicUser)
    } catch (err) {
      next(err)
    }
  }

  async saveSettings(req: TSaveUserSettingsReq, res: TSaveUserSettingsRes, next: NextFunction) {
    try {
      const { login }    = req.user!
      const { settings } = req.body

      if (!settings || typeof settings !== 'object') {
        throw ApiError.BadRequest('Некорректные настройки')
      }

      const users    = await readJson<TUser[]>('users.json')
      const updated  = users.map(u => u.login === login ? { ...u, settings } : u)
      await writeJson('users.json', updated)

      return res.json({ settings })
    } catch (err) {
      next(err)
    }
  }

}

const UserController = new Controller()

export default UserController
