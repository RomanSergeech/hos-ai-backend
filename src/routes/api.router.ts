import Router from 'express'
import multer from 'multer'
import { body } from 'express-validator'
import AuthController    from '#controllers/auth.controller.js'
import AdminController   from '#controllers/admin.controller.js'
import ManagerController from '#controllers/manager.controller.js'
import TasksController   from '#controllers/tasks.controller.js'
import UserController    from '#controllers/user.controller.js'
import AiController      from '#controllers/ai.controller.js'
import CompanyController from '#controllers/company.controller.js'
import authMiddleware    from '#shared/middlewares/auth.middleware.js'

import type { IRouter } from 'express'

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
})


const router: IRouter = Router()

router.post('/auth/login',
  body('login'),
  body('password').isLength({ min: 1 }),
  AuthController.login
)
router.get('/auth/refresh', AuthController.refresh)
router.post('/auth/logout', AuthController.logout)

router.get('/admin/data',
  authMiddleware,
  AdminController.getData
)

router.get('/manager/data',
  authMiddleware,
  ManagerController.getData
)

router.get('/user/:id',
  authMiddleware,
  UserController.getById
)
router.post('/user/settings/save',
  authMiddleware,
  UserController.saveSettings
)

router.post('/company/settings/save',
  authMiddleware,
  CompanyController.saveSettings
)
router.post('/company/settings/file/upload',
  authMiddleware,
  upload.single('file'),
  CompanyController.uploadFile
)
router.post('/company/settings/file/delete',
  authMiddleware,
  CompanyController.deleteFile
)

router.post('/task/create',
  authMiddleware,
  TasksController.createTask
)
router.post('/task/update',
  authMiddleware,
  TasksController.updateTask
)
router.post('/task/delete',
  authMiddleware,
  TasksController.deleteTask
)

router.get('/ai/history',
  authMiddleware,
  AiController.getHistory
)
router.post('/ai',
  authMiddleware,
  AiController.chat
)
router.post('/ai/task-meta',
  authMiddleware,
  AiController.generateTaskMeta
)
router.post('/ai/clear',
  authMiddleware,
  AiController.clearHistory
)

export default router