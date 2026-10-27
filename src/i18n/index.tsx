import { createContext, useContext, type ReactNode } from 'react'
import { en, type Messages } from './en'
import { es } from './es'

// Interface languages, in the order the toolbar cycles through them
export const UI_LANGUAGES = [
    { label: 'EN', value: 'en', messages: en },
    { label: 'ES', value: 'es', messages: es },
] as const

export type UiLanguage = (typeof UI_LANGUAGES)[number]['value']

export const DEFAULT_UI_LANGUAGE: UiLanguage = 'en'

export function getMessages(language: string): Messages {
    return UI_LANGUAGES.find((l) => l.value === language)?.messages ?? en
}

const I18nContext = createContext<Messages>(en)

export function I18nProvider({
    language,
    children,
}: {
    language: string
    children: ReactNode
}) {
    return (
        <I18nContext.Provider value={getMessages(language)}>{children}</I18nContext.Provider>
    )
}

export function useT(): Messages {
    return useContext(I18nContext)
}
