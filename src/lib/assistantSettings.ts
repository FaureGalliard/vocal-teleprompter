import { LANGUAGES } from '../constants/languages'
import type { Settings } from '../hooks/useSettings'
import { FONTS, type Typography } from './typography'

const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isInt = (v: unknown, min: number, max: number): v is number =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const isNumber = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && v >= min && v <= max
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
const oneOf = <T>(v: unknown, options: readonly T[]): v is T => options.includes(v as T)

// The settings as an assistant sees them, under the names its tools use
export function describeSettings(settings: Settings) {
    const { typography, scrolling } = settings
    return {
        hideFromScreenSharing: settings.hiddenFromCapture,
        fontSize: settings.fontSize,
        textColor: settings.textColor,
        backgroundColor: settings.bgColor,
        backgroundOpacity: Math.round(settings.bgOpacity * 100),
        softenBehind: settings.backdropSoften,
        autoContrast: settings.autoContrast,
        font: typography.font,
        fontWeight: typography.weight,
        lineSpacing: typography.lineHeight,
        textWidth: typography.width,
        textAlign: typography.align,
        scrolling: scrolling.mode,
        linesBelow: scrolling.linesBelow,
        readingLine: settings.readingLine,
        countdownSeconds: settings.countdownSeconds,
        targetMinutes: settings.targetMinutes,
        titleBar: settings.titleBarVisible,
        clickThrough: settings.clickThrough,
        speechLanguage: settings.language,
    }
}

// Applies the changes an assistant asked for that are valid, and says which
// were applied and which were left out (unknown or out of range)
export function applySettings(settings: Settings, changes: Record<string, unknown>) {
    const applied: string[] = []
    const take = (key: string, ok: boolean, set: () => void) => {
        if (!(key in changes) || !ok) return
        set()
        applied.push(key)
    }
    const c = changes
    const typography = (patch: Partial<Typography>) =>
        settings.setTypography((t) => ({ ...t, ...patch }))

    take('hideFromScreenSharing', isBool(c.hideFromScreenSharing), () =>
        settings.setHiddenFromCapture(c.hideFromScreenSharing as boolean),
    )
    take('fontSize', isInt(c.fontSize, 6, 200), () => settings.setFontSize(c.fontSize as number))
    take('textColor', isColor(c.textColor), () => settings.setTextColor(c.textColor as string))
    take('backgroundColor', isColor(c.backgroundColor), () =>
        settings.setBgColor(c.backgroundColor as string),
    )
    take('backgroundOpacity', isInt(c.backgroundOpacity, 0, 100), () =>
        settings.setBgOpacity((c.backgroundOpacity as number) / 100),
    )
    take('softenBehind', isInt(c.softenBehind, 0, 100), () =>
        settings.setBackdropSoften(c.softenBehind as number),
    )
    take('autoContrast', isBool(c.autoContrast), () =>
        settings.setAutoContrast(c.autoContrast as boolean),
    )
    take('font', oneOf(c.font, Object.keys(FONTS)), () =>
        typography({ font: c.font as Typography['font'] }),
    )
    take('fontWeight', oneOf(c.fontWeight, [400, 600, 700] as const), () =>
        typography({ weight: c.fontWeight as Typography['weight'] }),
    )
    take('lineSpacing', isNumber(c.lineSpacing, 1.1, 2.6), () =>
        typography({ lineHeight: c.lineSpacing as number }),
    )
    take('textWidth', isInt(c.textWidth, 40, 100), () =>
        typography({ width: c.textWidth as number }),
    )
    take('textAlign', oneOf(c.textAlign, ['center', 'left'] as const), () =>
        typography({ align: c.textAlign as Typography['align'] }),
    )
    take('scrolling', oneOf(c.scrolling, ['ahead', 'fixed'] as const), () =>
        settings.setScrolling((s) => ({ ...s, mode: c.scrolling as 'ahead' | 'fixed' })),
    )
    take('linesBelow', isInt(c.linesBelow, 1, 6), () =>
        settings.setScrolling((s) => ({ ...s, linesBelow: c.linesBelow as number })),
    )
    take('readingLine', isBool(c.readingLine), () =>
        settings.setReadingLine(c.readingLine as boolean),
    )
    take('countdownSeconds', oneOf(c.countdownSeconds, [0, 3, 5, 10]), () =>
        settings.setCountdownSeconds(c.countdownSeconds as number),
    )
    take('targetMinutes', isInt(c.targetMinutes, 0, 180), () =>
        settings.setTargetMinutes(c.targetMinutes as number),
    )
    take('titleBar', isBool(c.titleBar), () => settings.setTitleBarVisible(c.titleBar as boolean))
    take('clickThrough', isBool(c.clickThrough), () =>
        settings.setClickThrough(c.clickThrough as boolean),
    )
    take(
        'speechLanguage',
        LANGUAGES.some((l) => l.value === c.speechLanguage),
        () => settings.setLanguage(c.speechLanguage as string),
    )
    const ignored = Object.keys(changes).filter((k) => !applied.includes(k))
    return { applied, ignored }
}
