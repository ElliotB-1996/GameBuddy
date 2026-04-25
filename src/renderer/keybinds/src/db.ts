import type { Profile } from './data/types'

export function loadImportedProfiles(): Promise<Profile[]> {
  return new Promise((resolve) => {
    window.keybindsApi.onProfilesLoad(resolve)
  })
}

export async function saveProfile(profile: Profile): Promise<void> {
  return window.keybindsApi.saveProfile(profile)
}

export async function deleteProfile(id: string): Promise<void> {
  return window.keybindsApi.deleteProfile(id)
}
