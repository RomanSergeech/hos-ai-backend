import { readJson } from '#shared/utils/json.utils.js'

import type { TTask, TUser } from '#shared/types/users.types.js'
import type { NextFunction, Request } from 'express'
import type { TManagerDataRes } from '#shared/types/api.types.js'


class Controller {

  async getData(req: Request, res: TManagerDataRes, next: NextFunction) {
    try {
      const { id } = req.user!
      const [, allTasks] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TTask[]>('tasks.json'),
      ])
      const tasks = allTasks.filter(t => t.assignee === id)
      return res.json({ tasks })
    } catch (err) {
      next(err)
    }
  }

}

const ManagerController = new Controller()

export default ManagerController
