export const SETTINGS_KEY = 'mt_user_settings_v1'

export type UserSettings = {
  debugUI?: boolean
  showLoadMockButton?: boolean
}

export function loadSettings(): UserSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as UserSettings
  } catch (err) {
    console.warn('Failed to load settings', err)
    return {}
  }
}

export function saveSettings(s: UserSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch (err) {
    console.warn('Failed to save settings', err)
  }
}
