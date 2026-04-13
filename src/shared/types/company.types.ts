
export type TAiFile = {
  name:    string
  content: string
}

export type TCompany = {
  id:                string
  name:              string
  ai_system_prompt:  string
  ai_admin_prompt:   string
  ai_manager_prompt: string
  ai_files:          TAiFile[]
}