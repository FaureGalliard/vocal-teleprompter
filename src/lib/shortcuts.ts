const IS_MAC = navigator.userAgent.includes('Mac')

// "CommandOrControl+Alt+Right" -> "Ctrl+Alt+→" (or ⌘⌥→ on macOS)
export function displayShortcut(accelerator: string): string {
    return accelerator
        .split('+')
        .map((part) => {
            switch (part) {
                case 'CommandOrControl':
                    return IS_MAC ? '⌘' : 'Ctrl'
                case 'Alt':
                    return IS_MAC ? '⌥' : 'Alt'
                case 'Shift':
                    return IS_MAC ? '⇧' : 'Shift'
                case 'Super':
                    return IS_MAC ? '⌃' : 'Win'
                case 'Right':
                    return '→'
                case 'Left':
                    return '←'
                case 'Up':
                    return '↑'
                case 'Down':
                    return '↓'
                default:
                    return part
            }
        })
        .join('+')
}

// Turns a key press into an accelerator string, or null while only modifiers
// are held or for a combination without a modifier (except F-keys), which
// would steal ordinary typing system-wide
export function acceleratorFromEvent(e: KeyboardEvent): string | null {
    const code = e.code
    let key: string | null = null
    if (/^Key[A-Z]$/.test(code)) key = code.slice(3)
    else if (/^Digit[0-9]$/.test(code)) key = code.slice(5)
    else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) key = code
    else if (code.startsWith('Arrow')) key = code.slice(5)
    else if (['Space', 'Enter', 'Tab', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete'].includes(code))
        key = code
    if (!key) return null

    const modifiers: string[] = []
    if (IS_MAC ? e.metaKey : e.ctrlKey) modifiers.push('CommandOrControl')
    if (e.altKey) modifiers.push('Alt')
    if (e.shiftKey) modifiers.push('Shift')
    if (IS_MAC ? e.ctrlKey : e.metaKey) modifiers.push('Super')
    if (modifiers.length === 0 && !key.startsWith('F')) return null

    return [...modifiers, key].join('+')
}
