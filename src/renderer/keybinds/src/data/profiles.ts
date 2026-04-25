import type { Profile } from './types'

const modules = import.meta.glob('./profiles/*.json', { eager: true }) as Record<string, { default: Profile }>

export const profiles: Profile[] = Object.values(modules).map(m => m.default)

export function getProfile(id: string): Profile | undefined {
  return profiles.find(p => p.id === id)
}

export function getProfilesForDevice(device: Profile['device']): Profile[] {
  return profiles.filter(p => p.device === device)
}
