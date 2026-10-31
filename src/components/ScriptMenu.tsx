import { useCallback, useRef, useState } from 'react'
import {
    Check,
    CircleHelp,
    ClipboardPaste,
    FilePlus,
    FileText,
    FileUp,
    Pencil,
    Trash2,
    X,
} from 'lucide-react'
import type { useLibrary } from '../hooks/useLibrary'
import { scriptTitle } from '../lib/library'
import { useT } from '../i18n'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { ghost, ICON, iconBtn, primary } from './BarButton'
import { BarTooltip, Popover } from './Popover'

const menuItem =
    'flex items-center gap-2.5 px-4 py-2 text-[11px] text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors'

// The script actions, used before reading rather than during it, with their
// names spelled out, and the saved scripts to switch between; while editing
// the button finishes the edit in one click
export default function ScriptMenu({
    isEditing,
    onToggleEdit,
    onPasteText,
    onImport,
    onClear,
    library,
    onNewScript,
    onOpenScript,
    onShowTutorial,
}: {
    isEditing: boolean
    onToggleEdit: () => void
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    library: ReturnType<typeof useLibrary>
    onNewScript: () => void
    onOpenScript: (id: string) => void
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
                    onClick={pick(onNewScript)}
                    className={menuItem}>
                    <FilePlus size={ICON} />
                    {t.toolbar.newScript}
                </button>
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
                <span className="px-4 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                    {t.toolbar.myScripts}
                </span>
                <div className="max-h-48 overflow-y-auto flex flex-col">
                    {library.scripts.map((saved) => {
                        const current = saved.id === library.currentId
                        return (
                            <div
                                key={saved.id}
                                className="group/script relative flex items-center">
                                <button
                                    onClick={pick(() => onOpenScript(saved.id))}
                                    title={scriptTitle(saved.text) ?? t.toolbar.untitled}
                                    className={`${menuItem} flex-1 min-w-0 pr-9 ${current ? 'text-white' : ''}`}>
                                    <Check
                                        size={12}
                                        className={`flex-shrink-0 ${current ? 'text-[#7698fe]' : 'invisible'}`}
                                    />
                                    <span
                                        className={`truncate ${scriptTitle(saved.text) ? '' : 'italic text-white/40'}`}>
                                        {scriptTitle(saved.text) ?? t.toolbar.untitled}
                                    </span>
                                </button>
                                <button
                                    onClick={() => library.remove(saved.id)}
                                    aria-label={t.toolbar.deleteScript}
                                    title={t.toolbar.deleteScript}
                                    className="absolute right-2 p-1 rounded text-white/40 hover:text-white hover:bg-red-500/80 opacity-0 group-hover/script:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                            </div>
                        )
                    })}
                </div>
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
