import { readFile, writeFile } from 'fs/promises'
import path from 'path'


const DATA_DIR = path.join(path.resolve(), 'data')

export const readJson = async <T>(filename: string): Promise<T> => {
  const raw = await readFile(path.join(DATA_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

export const writeJson = async <T>(filename: string, data: T): Promise<void> => {
  await writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8')
}
