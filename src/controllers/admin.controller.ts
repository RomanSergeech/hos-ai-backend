import { readJson } from '#shared/utils/json.utils.js'

import type { TManager, TTask, TUser } from '#shared/types/users.types.js'
import type { NextFunction, Request } from 'express'
import type { TAdminDataRes } from '#shared/types/api.types.js'


class Controller {

  async getData(_: Request, res: TAdminDataRes, next: NextFunction) {
    try {
      const [users, tasks] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TTask[]>('tasks.json'),
      ])
      const managers: TManager[] = users
        .filter(u => u.role === 'manager')
        .map(({ id, name, dynamic, status, potential_loss, problem, scores }) => ({
          id,
          name,
          dynamic:        dynamic        ?? 0,
          status:         status         ?? 'normally',
          potential_loss: potential_loss ?? 0,
          problem:        problem        ?? '',
          scores:         scores         ?? { conversion: 0, revenue: 0, activity: 0, response_speed: 0, stage_conversion: 0, avg_check: 0, deal_duration: 0, rejection_rate: 0, stuck_deals: 0, total: 0 },
        }))
      return res.json({ managers, tasks })
    } catch (err) {
      next(err)
    }
  }

}

const AdminController = new Controller()

export default AdminController
