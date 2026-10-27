import { createContext, useContext, type ReactNode } from 'react'
import { en, type Messages } from './en'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'
import { pt } from './pt'
import { ja } from './ja'
import { zh } from './zh'
import { ko } from './ko'

// Interface languages, listed by their own name in the settings
export const UI_LANGUAGES = [
    { name: 'English', value: 'en', messages: en },
    { name: 'Español', value: 'es', messages: es },
    { name: 'Français', value: 'fr', messages: fr },
    { name: 'Deutsch', value: 'de', messages: de },
    { name: 'Italiano', value: 'it', messages: it },
    { name: 'Português', value: 'pt', messages: pt },
    { name: '日本語', value: 'ja', messages: ja },
    { name: '中文', value: 'zh', messages: zh },
    { name: '한국어', value: 'ko', messages: ko },
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
