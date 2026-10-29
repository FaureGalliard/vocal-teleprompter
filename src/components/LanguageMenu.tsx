import { useRef } from 'react'
import { LANGUAGES } from '../constants/languages'
import { useT } from '../i18n'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { ghost, iconBtn, primary } from './BarButton'
import { BarTooltip, Popover } from './Popover'

const speechLanguageLabel = (code: string) => LANGUAGES.find((l) => l.value === code)?.label ?? code

// The language the speaker talks in, shown by its short code
export default function LanguageMenu({
    language,
    open,
    onToggle,
    onChange,
}: {
    language: string
    open: boolean
    onToggle: () => void
    onChange: (language: string) => void
}) {
    const t = useT()
    const ref = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    useOutsideClick([ref, panelRef], open, onToggle)

    return (
        <div
            ref={ref}
            data-tour="speech-language"
            className="relative group">
            <button
                onClick={onToggle}
                aria-label={t.toolbar.speechLanguage}
                className={`${iconBtn} ${open ? primary : ghost} text-[10px] font-semibold`}>
                {speechLanguageLabel(language)}
            </button>
            <BarTooltip
                label={t.toolbar.speechLanguage}
                hidden={open}
            />
            <Popover
                anchor={ref}
                panelRef={panelRef}
                open={open}
                width={96}
                className="flex flex-col py-1">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.value}
                        onClick={() => onChange(lang.value)}
                        className={`px-4 py-1.5 text-[11px] font-medium text-left transition-colors ${
                            language === lang.value
                                ? 'bg-[#445ade] text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}>
                        {lang.label}
                    </button>
                ))}
            </Popover>
        </div>
    )
}
