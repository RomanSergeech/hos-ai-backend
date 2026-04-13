import OpenAI from 'openai'
import dotenv from 'dotenv'
import { readJson, writeJson } from '#shared/utils/json.utils.js'
import type { NextFunction, Request, Response } from 'express'
import type { TUser, TScores, TManagerStatus, TChatMessage } from '#shared/types/users.types.js'
import type { TCompany } from '#shared/types/company.types.js'

dotenv.config()

type TGptMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const STATUS_LABEL: Record<TManagerStatus, string> = {
  strong:   'сильный',
  normally: 'норма',
  low:      'слабый',
  critical: 'критично',
}

const formatAdminContext = (managers: TUser[]): string => {
  if (!managers.length) return ''

  const rows = managers.map(m => {
    const s = m.scores as TScores
    const loss = (m.potential_loss ?? 0) < 0
      ? `−${Math.abs(m.potential_loss ?? 0).toLocaleString('ru-RU')} руб/мес`
      : 'нет потерь'
    const dynamic = (m.dynamic ?? 0) > 0 ? `+${m.dynamic}%` : `${m.dynamic}%`
    const problem = m.problem ? `проблема: ${m.problem}` : 'проблем нет'

    return [
      `▸ ${m.name} | балл: ${s.total}/100 | статус: ${STATUS_LABEL[m.status ?? 'normally']} | динамика: ${dynamic} | потери: ${loss} | ${problem}`,
      `  Показатели: конверсия ${s.conversion}/25, выручка ${s.revenue}/20, активность ${s.activity}/15, скорость ответа ${s.response_speed}/10, конверсия этапов ${s.stage_conversion}/10, средний чек ${s.avg_check}/5, длит. сделки ${s.deal_duration}/5, % отказов ${s.rejection_rate}/5, зависшие сделки ${s.stuck_deals}/5`,
    ].join('\n')
  })

  return `## Данные по менеджерам отдела (актуальные)\n${rows.join('\n\n')}\n\nИспользуй эти данные при анализе работы отдела, выявлении проблемных зон и формировании управленческих решений.`
}

const formatManagerContext = (user: TUser): string => {
  const s = user.scores as TScores
  const loss = user.potential_loss ?? 0
  const lossStr = loss < 0
    ? `~ ${Math.abs(loss).toLocaleString('ru-RU')} руб/месяц`
    : 'потерь нет'

  const metricsMap: [string, keyof TScores, number][] = [
    ['Конверсия',           'conversion',       25],
    ['Выручка',             'revenue',          20],
    ['Активность',          'activity',         15],
    ['Скорость ответа',     'response_speed',   10],
    ['Конверсия по этапам', 'stage_conversion', 10],
    ['Средний чек',         'avg_check',         5],
    ['Длительность сделки', 'deal_duration',     5],
    ['Процент отказов',     'rejection_rate',    5],
    ['Зависшие сделки',     'stuck_deals',       5],
  ]

  const metricsText = metricsMap
    .map(([title, key, max]) => `- ${title}: ${s[key]}/${max}`)
    .join('\n')

  return `## Данные менеджера (контекст для анализа)\nОценка: ${s.total}/100 | статус: ${STATUS_LABEL[user.status ?? 'normally']} | динамика: ${(user.dynamic ?? 0) > 0 ? '+' : ''}${user.dynamic ?? 0}%\nФинансовые потери: ${lossStr}\nПроблема: ${user.problem || 'не выявлена'}\n\nПоказатели:\n${metricsText}\n\nИспользуй эти данные как основу при анализе ситуации менеджера и формировании рекомендаций.`
}


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


class Controller {

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!
      const users = await readJson<TUser[]>('users.json')
      const user  = users.find(u => u.id === id)!
      return res.json({ history: user.chat_history })
    } catch (err) {
      next(err)
    }
  }

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message }: { message: string } = req.body
      const { id, role } = req.user!

      const [users, companies] = await Promise.all([
        readJson<TUser[]>('users.json'),
        readJson<TCompany[]>('companies.json'),
      ])
      const userIdx = users.findIndex(u => u.id === id)
      const user    = users[userIdx]
      const company = companies.find(c => c.id === user.company_id)!

      let systemContent: string

      const filesContext = (company.ai_files ?? []).length
        ? '## Дополнительные материалы компании\n' + (company.ai_files ?? []).map(f => `### ${f.name}\n${f.content}`).join('\n\n')
        : ''

      if (role === 'admin') {
        const managers = users.filter(u => u.role === 'manager' && u.company_id === user.company_id)
        systemContent = [
          company.ai_system_prompt,
          company.ai_admin_prompt,
          filesContext,
          formatAdminContext(managers),
        ].filter(Boolean).join('\n\n')
      } else {
        systemContent = [
          company.ai_system_prompt,
          company.ai_manager_prompt,
          filesContext,
          formatManagerContext(user),
        ].filter(Boolean).join('\n\n')
      }

      const history: TGptMessage[] = user.chat_history.map(m => ({
        role:    m.role,
        content: m.content,
      }))

      const systemMessage: TGptMessage = { role: 'system', content: systemContent }

      const completion = await client.chat.completions.create({
        model:                 'gpt-5.2',
        messages:              [systemMessage, ...history, { role: 'user', content: message }],
        temperature:           0.6,
        max_completion_tokens: 2000,
      })

      const text = completion.choices[0]?.message.content ?? ''
      const now  = new Date().toISOString()

      const userMsg: TChatMessage    = { id: `${Date.now()}`,     role: 'user',      content: message, createdAt: now }
      const aiMsg:   TChatMessage    = { id: `${Date.now() + 1}`, role: 'assistant', content: text,    createdAt: now }

      users[userIdx].chat_history = [...user.chat_history, userMsg, aiMsg]
      await writeJson('users.json', users)

      return res.json({ text })
    } catch (err) {
      next(err)
    }
  }

  async generateTaskMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { description }: { description: string } = req.body
      const { id, role } = req.user!

      const users = await readJson<TUser[]>('users.json')
      const user  = users.find(u => u.id === id)!

      const today = new Date().toISOString().slice(0, 10)

      let userContext = ''
      if (user?.scores && role !== 'admin') {
        const s = user.scores as TScores
        userContext = `\nПоказатели менеджера: балл ${s.total}/100, статус: ${STATUS_LABEL[user.status ?? 'normally']}, проблема: ${user.problem || 'не выявлена'}.`
      }

      let managersContext = ''
      let assigneeField   = ''
      if (role === 'admin') {
        const managers = users.filter(u => u.role === 'manager' && u.company_id === user.company_id)
        managersContext = `\nМенеджеры компании:\n${managers.map(m => `- id: ${m.id}, имя: ${m.name}`).join('\n')}`
        assigneeField   = `\n  "assignee_id": "id менеджера из списка выше или null если непонятно",`
      }

      const systemPrompt = `Ты помощник по управлению задачами. На основе текста определи метаданные задачи.
Сегодняшняя дата: ${today}.${userContext}${managersContext}

Ответь строго в формате JSON (без markdown-блока):
{${assigneeField}
  "title": "заголовок до 90 символов, без кавычек и точки в конце",
  "priority": "high" | "medium" | "low",
  "deadline": "YYYY-MM-DD" | null
}

Правила:
- priority=high если задача критична для исправления слабых показателей или есть срочная проблема
- priority=medium по умолчанию
- priority=low для задач мониторинга и поддержания хороших результатов
- deadline: установи реалистичный срок (через 3-14 дней) если задача конкретна и срочна, иначе null${role === 'admin' ? '\n- assignee_id: определи по имени менеджера, упомянутого в тексте; если упомянуто несколько — выбери наиболее релевантного; если никто не упомянут — null' : ''}`

      const completion = await client.chat.completions.create({
        model: 'gpt-5.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: description  },
        ],
        temperature:           0.3,
        max_completion_tokens: 150,
      })

      const raw = completion.choices[0]?.message.content?.trim() ?? '{}'

      let parsed: { title?: string; priority?: string; deadline?: string | null; assignee_id?: string | null } = {}
      try { parsed = JSON.parse(raw) } catch { /* fallback ниже */ }

      return res.json({
        title:       parsed.title       ?? 'Задача из ИИ',
        priority:    parsed.priority    ?? 'medium',
        deadline:    parsed.deadline    ?? null,
        assignee_id: parsed.assignee_id ?? null,
      })
    } catch (err) {
      next(err)
    }
  }

  async clearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!
      const users    = await readJson<TUser[]>('users.json')
      const userIdx  = users.findIndex(u => u.id === id)
      users[userIdx].chat_history = []
      await writeJson('users.json', users)
      return res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }

}

const AiController = new Controller()

export default AiController
