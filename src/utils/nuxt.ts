import { NuxtOptions } from '@nuxt/types'

export interface Nuxt {
  options: NuxtOptions
  [key: string]: any,
}

export function requireMaybeEdge (pkg) {
  return tryRequire(pkg + '-edge') || tryRequire(pkg)
}

export function tryRequire (pkg) {
  try {
    return require(pkg)
  } catch (_e) {
  }
}
