import { useCallback, useRef, useState } from 'react'
import { Check, CircleHelp, ClipboardPaste, FileText, FileUp, Pencil, Trash2 } from 'lucide-react'
import { useT } from '../i18n'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { ghost, ICON, iconBtn, primary } from './BarButton'
import { BarTooltip, Popover } from './Popover'

const menuItem =
    'flex items-center gap-2.5 px-4 py-2 text-[11px] text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors'

// The script actions, used before reading rather than during it, with their
// names spelled out; while editing the button finishes the edit in one click
export default function ScriptMenu({
    isEditing,
    onToggleEdit,
    onPasteText,
    onImport,
    onClear,
    onShowTutorial,
}: {
    isEditing: boolean
    onToggleEdit: () => void
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    onShowTutorial: () => void
}) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const close = useCallback(() => setOpen(false), [])
    useOutsideClick([ref, panelRef], open, close)

    // A menu item does its thing and closes the menu
    const pick = (action: () => void) => () => {
        setOpen(false)
        action()
    }
    const label = isEditing ? t.toolbar.finishEditing : t.toolbar.more

    return (
        <div
            ref={ref}
            data-tour="script"
            className="relative group">
            <button
                onClick={isEditing ? onToggleEdit : () => setOpen((v) => !v)}
                aria-label={label}
                className={`${iconBtn} ${open || isEditing ? primary : ghost}`}>
                {isEditing ? <Check size={ICON} /> : <FileText size={ICON} />}
            </button>
            <BarTooltip
                label={label}
                hidden={open}
            />
            <Popover
                anchor={ref}
                panelRef={panelRef}
                open={open}
                width={220}
                className="flex flex-col py-1">
                <button
                    onClick={pick(onToggleEdit)}
                    className={menuItem}>
                    <Pencil size={ICON} />
                    {t.toolbar.editScript}
                </button>
                <button
                    onClick={pick(onPasteText)}
                    className={menuItem}>
                    <ClipboardPaste size={ICON} />
                    {t.toolbar.pasteScript}
                </button>
                <button
                    onClick={pick(onImport)}
                    className={menuItem}>
                    <FileUp size={ICON} />
                    {t.toolbar.importScript}
                </button>
                <button
                    onClick={pick(onClear)}
                    className={`${menuItem} hover:!bg-red-500/80`}>
                    <Trash2 size={ICON} />
                    {t.toolbar.clearScript}
                </button>
                <div className="h-px my-1 bg-white/10" />
                <button
                    onClick={pick(onShowTutorial)}
                    className={menuItem}>
                    <CircleHelp size={ICON} />
                    {t.settings.tutorial}
                </button>
            </Popover>
        </div>
    )
}
