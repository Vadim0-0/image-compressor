export type AppLocale = 'ru' | 'en'

const DEFAULT_LOCALE: AppLocale = 'ru'
const SUPPORTED_LOCALES: AppLocale[] = ['ru', 'en']

const normalizeLocale = (locale: string) => locale.toLowerCase().split('-')[0] as AppLocale

const resolveSupportedLocale = (locales: readonly string[]): AppLocale => {
  for (const locale of locales) {
    const normalizedLocale = normalizeLocale(locale)

    if (SUPPORTED_LOCALES.includes(normalizedLocale)) {
      return normalizedLocale
    }
  }

  return DEFAULT_LOCALE
}

const resolveRequestLocale = (): AppLocale => {
  const acceptLanguage = useRequestHeaders(['accept-language'])['accept-language']

  if (!acceptLanguage) {
    return DEFAULT_LOCALE
  }

  const requestedLocales = acceptLanguage
    .split(',')
    .map((locale) => locale.split(';')[0]?.trim())
    .filter(Boolean) as string[]

  return resolveSupportedLocale(requestedLocales)
}

const resolveBrowserLocale = (): AppLocale => {
  if (!import.meta.client) {
    return DEFAULT_LOCALE
  }

  const browserLocales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]

  return resolveSupportedLocale(browserLocales)
}

export const useLocale = () =>
  useState<AppLocale>('locale', () => (
    import.meta.server ? resolveRequestLocale() : resolveBrowserLocale()
  ))
