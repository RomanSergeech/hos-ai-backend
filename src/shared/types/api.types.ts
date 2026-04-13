import type { Request, Response } from 'express'
import type { TUser, TUserSettings, TTask, TManager, TChatMessage } from './users.types.js'
import type { TCompany, TAiFile } from './company.types.js'


// ── Request bodies ────────────────────────────────────────────────────────────

export type TLoginBody = {
  login:    string
  password: string
}

export type TSaveUserSettingsBody = { settings: TUserSettings }
export type TSaveUserSettingsReq  = Request<{}, {}, TSaveUserSettingsBody>

export type TCompanyAiSettings = Pick<TCompany, 'ai_system_prompt' | 'ai_admin_prompt' | 'ai_manager_prompt'>
export type TSaveCompanySettingsBody = { settings: Partial<TCompanyAiSettings> }
export type TSaveCompanySettingsReq  = Request<{}, {}, TSaveCompanySettingsBody>
export type TSaveCompanySettingsRes  = Response<{ settings: TCompany }>

export type TUploadFileBody = TAiFile
export type TUploadFileReq  = Request<{}, {}, TUploadFileBody>
export type TDeleteFileBody = { name: string }
export type TDeleteFileReq  = Request<{}, {}, TDeleteFileBody>

export type TCreateTaskBody = Omit<TTask, 'id' | 'createdAt'>
export type TUpdateTaskBody = { id: string } & Partial<Pick<TTask, 'title' | 'description' | 'status' | 'priority' | 'assignee' | 'deadline'>>
export type TDeleteTaskBody = { id: string }

export type TAiChatBody = { message: string }


// ── Responses ─────────────────────────────────────────────────────────────────

export type TAuthRes             = Response<{ access_token: string; user: Omit<TUser, 'password' | 'refresh_token'>; company: TCompany | null }>
export type TAdminDataRes        = Response<{ managers: TManager[]; tasks: TTask[] }>
export type TManagerDataRes      = Response<{ tasks: TTask[] }>
export type TSaveUserSettingsRes = Response<{ settings: TUserSettings }>
export type TCreateTaskRes       = Response<TTask>
export type TUpdateTaskRes       = Response<TTask>
export type TDeleteTaskRes       = Response<{ ok: boolean }>
export type TAiHistoryRes        = Response<{ history: TChatMessage[] }>
export type TAiChatRes           = Response<{ text: string }>
export type TAiClearRes          = Response<{ ok: boolean }>
