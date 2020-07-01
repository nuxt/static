import { promises as fs } from 'fs'
import { relative } from 'path'
import crc32 from 'crc/lib/crc32'
import globby, { GlobbyOptions } from 'globby'

export interface Snapshot {
  [path: string]: {
    checksum?: ''
    exists?: boolean
  }
}

export interface SnapshotOptions {
  rootDir: string
  globbyOptions: GlobbyOptions
  patterns: string[] | string
}

export function compareSnapshots (from: Snapshot, to: Snapshot): string | boolean | false {
  const fromKeys = Object.keys(from).sort()
  const toKeys = Object.keys(to).sort()

  if (fromKeys.length !== toKeys.length || JSON.stringify(fromKeys) !== JSON.stringify(toKeys)) {
    return true
  }
  for (const key of fromKeys) {
    if (JSON.stringify(from[key]) !== JSON.stringify(to[key])) {
      return key
    }
  }

  return false
}

export async function snapshot ({ globbyOptions, rootDir, patterns }: SnapshotOptions): Promise <Snapshot> {
  const snapshot: Snapshot = {}

  const files = await globby(patterns, {
    ...globbyOptions,
    cwd: rootDir,
    absolute: true
  })

  await Promise.all(files.map(async (p) => {
    const key = relative(rootDir, p)
    try {
      const fileContent = await fs.readFile(p)
      snapshot[key] = {
        checksum: await crc32(fileContent).toString(16)
      }
    } catch (e) {
      // TODO: Check for other errors like permission denied
      snapshot[key] = {
        exists: false
      }
    }
  }))

  return snapshot
}
