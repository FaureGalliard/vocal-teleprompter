import type { CSSProperties, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Square } from 'lucide-react'
import { useT } from '../i18n'
import type { Microphone } from '../hooks/useMicrophones'
import type { useListeningSession } from '../hooks/useListeningSession'
import type { Settings } from '../hooks/useSettings'
import BarButton, { ghost, ICON, primary } from './BarButton'
import LanguageMenu from './LanguageMenu'
import MicrophoneMenu from './MicrophoneMenu'
import { useOpenTowards } from './Popover'
import ScriptMenu from './ScriptMenu'

interface ToolbarProps {
    visible: boolean
    isAdjusting: boolean
    // Where the toolbar sits: in the room the window made for it, or over
    // the bottom of the teleprompter when the window could not grow
    placement: CSSProperties
    session: ReturnType<typeof useListeningSession>
    isRecognizing: boolean
    // Start waits for the speech model of the chosen language
    isDownloadingModel: boolean
    content: string
    isEditing: boolean
    settings: Settings
    microphones: Microphone[]
    // The chosen microphone, or null for the system default
    activeMic: string | null
    onRefreshMicrophones: () => void
    onToggleListen: () => void
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    onToggleEdit: () => void
    onShowTutorial: () => void
    // Panels built by App, which owns their state
    appearance: ReactNode
    settingsPanel: ReactNode
}

const divider = <div className="h-5 w-px mx-0.5 bg-white/15" />

export default function Toolbar(props: ToolbarProps) {
    return <AnimatePresence>{props.visible && <ToolbarBar {...props} />}</AnimatePresence>
}

// What is used while reading stays on the bar; the script actions, used
// before, live in the script menu with their names spelled out
function ToolbarBar({
    isAdjusting,
    placement,
    session,
    isRecognizing,
    isDownloadingModel,
    content,
    isEditing,
    settings,
    microphones,
    activeMic,
    onRefreshMicrophones,
    onToggleListen,
    onPasteText,
    onImport,
    onClear,
    onToggleEdit,
    onShowTutorial,
    appearance,
    settingsPanel,
}: ToolbarProps) {
    const t = useT()
    const towards = useOpenTowards()
    const { isSpeechActive, isPaused } = session
    const running = isSpeechActive || session.countdown !== null

    const shift = towards === 'down' ? -8 : 8
    return (
        <motion.div
            initial={{ opacity: 0, y: shift }}
            animate={{ opacity: isAdjusting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: shift }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            // Centered on the point it is placed at
            style={{ ...placement, x: '-50%', height: 40 }}
            className="fixed z-40 flex items-center gap-1 px-1.5 rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg">
            <BarButton
                tour="start"
                label={
                    isDownloadingModel
                        ? t.speechModel.waiting
                        : running
                          ? t.toolbar.stop
                          : t.toolbar.start
                }
                onClick={onToggleListen}
                disabled={!content || isDownloadingModel}
                className={`${running ? 'bg-red-500 text-white hover:bg-red-600' : primary} ${
                    // Session on but the recognizer is (re)connecting
                    isSpeechActive && !isPaused && !isRecognizing ? 'animate-pulse' : ''
                }`}>
                {running ? <Square size={ICON} /> : <Play size={ICON} />}
            </BarButton>

            {isSpeechActive && (
                <BarButton
                    label={isPaused ? t.toolbar.resume : t.toolbar.pause}
                    onClick={() => session.setIsPaused((v) => !v)}
                    className={isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}>
                    {isPaused ? <Play size={ICON} /> : <Pause size={ICON} />}
                </BarButton>
            )}

            {divider}

            <LanguageMenu
                language={settings.language}
                onChange={settings.setLanguage}
            />

            <MicrophoneMenu
                microphones={microphones}
                onRefresh={onRefreshMicrophones}
                selected={activeMic}
                listening={isRecognizing}
                onChange={settings.setSelectedMic}
            />

            {divider}

            <div data-tour="look">{appearance}</div>

            {settingsPanel}

            {divider}

            <ScriptMenu
                isEditing={isEditing}
                onToggleEdit={onToggleEdit}
                onPasteText={onPasteText}
                onImport={onImport}
                onClear={onClear}
                onShowTutorial={onShowTutorial}
            />
        </motion.div>
    )
}
