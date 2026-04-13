
export type TUserRole = 'admin' | 'manager'

export type TChatMessage = {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  createdAt: string
}

export type TUserSettings = {
  avg_check:  string
  leads:      string
  conversion: string
  response:   string
  deal_cycle: string
}

export const DEFAULT_USER_SETTINGS: TUserSettings = {
  avg_check:  '',
  leads:      '',
  conversion: '',
  response:   '',
  deal_cycle: '',
}

export type TUser = {
  id:            string
  login:         string
  password:      string
  role:          TUserRole
  name:          string
  image:         string | null
  company_id:    string
  refresh_token: string
  chat_history:  TChatMessage[]
  settings:      TUserSettings
  // manager-only performance fields
  dynamic?:            number
  status?:             TManagerStatus
  potential_loss?:     number
  problem?:            string
  scores?:             TScores
  score_label?:        string
  loss_reason?:        string
  score_delta?:        string
  score_dynamic_data?: Record<TScoreFilter, TScorePoint[]>
  metrics?:            TMetric[]
}

export type TManagerStatus = 'strong' | 'normally' | 'low' | 'critical'

export type TMetricStatus = 'good' | 'normal' | 'bad'

export type TMetric = {
  title:   string
  score:   number | null
  status:  TMetricStatus
  comment: string
}

export type TScoreFilter = 'day' | 'week' | 'month'

export type TScorePoint = { label: string; value: number }

export type TScores = {
  conversion:       number
  revenue:          number
  activity:         number
  response_speed:   number
  stage_conversion: number
  avg_check:        number
  deal_duration:    number
  rejection_rate:   number
  stuck_deals:      number
  total:            number
}

export type TManager = {
  id:             string
  name:           string
  dynamic:        number
  status:         TManagerStatus
  potential_loss: number
  problem:        string
  scores:         TScores
}

export type TTaskStatus   = 'overdue' | 'today' | 'this_week' | 'no_deadline'
export type TTaskPriority = 'low'     | 'medium' | 'high'

export type TTask = {
  id:          string
  title:       string
  description: string
  status:      TTaskStatus
  priority:    TTaskPriority
  assignee:    string
  deadline:    string | null
  createdAt:   string
}
