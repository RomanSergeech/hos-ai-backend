import { ApiError } from '#shared/exceptions/api.error.js'
import { readJson, writeJson } from '#shared/utils/json.utils.js'

import type { TTask, TTaskStatus, TTaskPriority } from '#shared/types/users.types.js'
import type { NextFunction, Request, Response } from 'express'


const TASKS_FILE = 'tasks.json'


class Controller {

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, id } = req.user!
      const all = await readJson<TTask[]>(TASKS_FILE)
      const tasks = role === 'manager' ? all.filter(t => t.assignee === id) : all
      return res.json({ tasks })
    } catch (err) {
      next(err)
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, id } = req.user!

      const { title, description, status, priority, assignee, deadline } =
        req.body as Omit<TTask, 'id' | 'createdAt'>

      if (!title?.trim()) {
        throw ApiError.BadRequest('Название обязательно')
      }

      const tasks = await readJson<TTask[]>(TASKS_FILE)

      const newTask: TTask = {
        id:          Date.now().toString(),
        title:       title.trim(),
        description: description ?? '',
        status:      status      ?? 'no_deadline',
        priority:    priority    ?? 'medium',
        assignee:    role === 'admin' ? (assignee ?? '') : id,
        deadline:    deadline    ?? null,
        createdAt:   new Date().toISOString().slice(0, 10),
      }

      await writeJson(TASKS_FILE, [...tasks, newTask])

      return res.status(201).json(newTask)
    } catch (err) {
      next(err)
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, ...updates } = req.body as { id: string } & Partial<Pick<TTask, 'title' | 'description' | 'status' | 'priority' | 'assignee' | 'deadline'>>
      const { role, id: userId } = req.user!
      const tasks     = await readJson<TTask[]>(TASKS_FILE)
      const taskIndex = tasks.findIndex(t => t.id === id)

      if (taskIndex === -1) {
        throw ApiError.NotFound('Задача не найдена')
      }

      if (role === 'manager' && tasks[taskIndex]!.assignee !== userId) {
        throw ApiError.Forbidden('Доступ запрещён')
      }

      const allowedFields: (keyof typeof updates)[] = ['title', 'description', 'status', 'priority', 'assignee', 'deadline']
      const sanitized: Partial<TTask> = {}

      for (const key of allowedFields) {
        if (key in updates) {
          (sanitized as Record<string, unknown>)[key] = updates[key]
        }
      }

      tasks[taskIndex] = { ...tasks[taskIndex]!, ...sanitized }

      await writeJson(TASKS_FILE, tasks)

      return res.json(tasks[taskIndex])
    } catch (err) {
      next(err)
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== 'admin') {
        throw ApiError.Forbidden('Доступ запрещён')
      }

      const { id }   = req.body as { id: string }
      const tasks    = await readJson<TTask[]>(TASKS_FILE)
      const filtered = tasks.filter(t => t.id !== id)

      if (filtered.length === tasks.length) {
        throw ApiError.NotFound('Задача не найдена')
      }

      await writeJson(TASKS_FILE, filtered)

      return res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }

}

const TasksController = new Controller()

export default TasksController
