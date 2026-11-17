import { ref, watch } from 'vue'

type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'miragon-color-scheme'
const START_FLAG = import.meta.env.VITE_MIRAGON_COLOR_SCHEME as ColorScheme | undefined

function readStoredScheme(): ColorScheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function storeScheme(scheme: ColorScheme) {
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch {}
}

function initialScheme(): ColorScheme {
  const configuredDark = document.documentElement.classList.contains('dark')
  return START_FLAG ?? readStoredScheme() ?? (configuredDark ? 'dark' : 'light')
}

export const colorScheme = ref<ColorScheme>('light')
export const isDarkScheme = ref(false)
let isApplied = false

export function toggleColorScheme() {
  colorScheme.value = colorScheme.value === 'dark' ? 'light' : 'dark'
  storeScheme(colorScheme.value)
}

export function applyColorScheme(isPrintMode: () => boolean) {
  if (isApplied) return
  isApplied = true
  colorScheme.value = initialScheme()
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) colorScheme.value = readStoredScheme() ?? colorScheme.value
  })
  watch([colorScheme, isPrintMode], ([scheme, printing]) => {
    const isDark = scheme === 'dark' && !printing
    isDarkScheme.value = isDark
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, { immediate: true })
}
