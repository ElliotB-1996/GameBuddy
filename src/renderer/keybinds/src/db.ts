import type { Profile } from './data/types'

export async function loadImportedProfiles(): Promise<Profile[]> { return [] }
export async function saveProfile(_profile: Profile): Promise<void> {}
export async function deleteProfile(_id: string): Promise<void> {}
