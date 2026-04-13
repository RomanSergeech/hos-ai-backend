import { createRequire } from 'module'
import mammoth from 'mammoth'
import { readJson, writeJson } from '#shared/utils/json.utils.js'
import type { TCompany } from '#shared/types/company.types.js'
import type { TUser } from '#shared/types/users.types.js'
import type { NextFunction, Request, Response } from 'express'
import type { TSaveCompanySettingsReq, TSaveCompanySettingsRes, TDeleteFileReq } from '#shared/types/api.types.js'

const require  = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

async function extractText(buffer: Buffer, originalName: string): Promise<string> {
  const ext = originalName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    const data = await pdfParse(buffer)
    return data.text.trim()
  }

  if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  return buffer.toString('utf-8').trim()
}


class Controller {

  async saveSettings(req: TSaveCompanySettingsReq, res: TSaveCompanySettingsRes, next: NextFunction) {
    try {
      const { id } = req.user!
      const { settings } = req.body

      const [users, companies] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TCompany[]>('companies.json'),
      ])

      const user       = users.find(u => u.id === id)!
      const companyIdx = companies.findIndex(c => c.id === user.company_id)

      companies[companyIdx] = { ...companies[companyIdx], ...settings }
      await writeJson('companies.json', companies)

      return res.json({ settings: companies[companyIdx] })
    } catch (err) {
      next(err)
    }
  }

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!
      const file = (req as any).file as Express.Multer.File | undefined

      if (!file) return res.status(400).json({ error: 'Файл не передан' })

      const content = await extractText(file.buffer, file.originalname)

      const [users, companies] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TCompany[]>('companies.json'),
      ])

      const user       = users.find(u => u.id === id)!
      const companyIdx = companies.findIndex(c => c.id === user.company_id)
      const company    = companies[companyIdx]

      const files = (company.ai_files ?? []).filter(f => f.name !== file.originalname)
      companies[companyIdx] = { ...company, ai_files: [...files, { name: file.originalname, content }] }
      await writeJson('companies.json', companies)

      return res.json({ files: companies[companyIdx].ai_files })
    } catch (err) {
      next(err)
    }
  }

  async deleteFile(req: TDeleteFileReq, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!
      const { name } = req.body

      const [users, companies] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TCompany[]>('companies.json'),
      ])

      const user       = users.find(u => u.id === id)!
      const companyIdx = companies.findIndex(c => c.id === user.company_id)
      const company    = companies[companyIdx]

      companies[companyIdx] = { ...company, ai_files: (company.ai_files ?? []).filter(f => f.name !== name) }
      await writeJson('companies.json', companies)

      return res.json({ files: companies[companyIdx].ai_files })
    } catch (err) {
      next(err)
    }
  }

}

const CompanyController = new Controller()

export default CompanyController
