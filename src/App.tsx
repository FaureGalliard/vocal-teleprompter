import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import TitleBar, { TITLE_BAR_HEIGHT } from './components/TitleBar'
import Toolbar from './components/Toolbar'
import ToolbarToggle from './components/ToolbarToggle'
import { OpenTowardsContext } from './components/Popover'
import AppearancePanel from './components/AppearancePanel'
import SettingsPanel from './components/SettingsPanel'
import Canvas from './components/Canvas'
import Frame from './components/Frame'
import ModelDownloadCard from './components/ModelDownloadCard'
import StatusBar from './components/StatusBar'
import UpdateBanner from './components/UpdateBanner'
import { BAR_ROOM, useWindowExpansion } from './hooks/useWindowExpansion'
import { useWindowPlacement } from './hooks/useWindowPlacement'
import { usePassThroughGaps } from './hooks/usePassThroughGaps'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useUpdater } from './hooks/useUpdater'
import { useSettings } from './hooks/useSettings'
import { useScript } from './hooks/useScript'
import { useSpeech } from './hooks/useSpeech'
import { useAssistantBridge } from './hooks/useAssistantBridge'
import { useWindowKeys } from './hooks/useWindowKeys'
import { useWindowBehavior } from './hooks/useWindowBehavior'
import { useTour } from './hooks/useTour'
import { clearPersistentState } from './hooks/usePersistentState'
import { LANGUAGES } from './constants/languages'
import { I18nProvider, UI_LANGUAGES, getMessages } from './i18n'
import { bestOutline, ensureContrast } from './lib/contrast'
import { readClipboard, readPickedFile } from './lib/scriptFiles'

// Below this background opacity the backdrop shows through enough to need a halo
const HALO_BELOW_OPACITY = 0.85

function App() {
    const settings = useSettings()
    const { language, titleBarVisible, titleBarPosition, bgColor, bgOpacity } = settings
    const t = getMessages(settings.uiLanguage)
    const script = useScript(language, t.sampleScript)
    const { content, currentWordIndex, currentCard } = script
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [isAdjusting, setIsAdjusting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editCaret, setEditCaret] = useState<number | null>(null)
    const [recordingShortcut, setRecordingShortcut] = useState(false)
    const titleBarRef = useRef<HTMLDivElement>(null)
    const updater = useUpdater(settings.autoUpdate)
    useWindowBehavior(settings, t)

    const speech = useSpeech({ settings, script, onStart: () => setIsEditing(false) })
    const { session, pace, activeMic, model: speechModel } = speech
    const { isSpeechActive, isPaused, countdown } = session
    const { listening: isRecognizing, error, heard: heardText } = speech.recognition

    // Replaces the script, out of editing and back at its start
    const loadScript = (text: string) => {
        setIsEditing(false)
        script.load(text)
    }

    const { failed: failedShortcuts } = useGlobalShortcuts({
        enabled: settings.shortcutsEnabled && !recordingShortcut,
        bindings: settings.shortcutBindings,
        handlers: {
            toggleListening: () => content && !isEditing && session.toggleListening(),
            nextCard: () => script.page(1),
            previousCard: () => script.page(-1),
            toggleClickThrough: () => settings.setClickThrough((v) => !v),
            toggleWindow: async () => {
                const win = getCurrentWindow()
                if (await win.isVisible()) await win.hide()
                else {
                    await win.show()
                    await win.setFocus()
                }
            },
        },
    })

    useAssistantBridge({
        settings,
        session,
        content,
        loadScript,
        currentCard,
        currentWordIndex,
        pace,
        goToCard: script.goToCard,
    })

    const tour = useTour(t, settings, () => {
        setIsEditing(false)
        session.stopListening()
        setToolbarVisible(true)
    })

    useWindowKeys({
        disabled: isEditing || tour.active,
        onToggleListening: () => content && session.toggleListening(),
        onStop: () => {
            if (countdown === null && !isSpeechActive) return false
            session.stopListening()
            return true
        },
        onMove: (words) => script.jumpTo(currentWordIndex + words),
        onPage: script.page,
        onTextSize: (change) => settings.setFontSize((v) => Math.max(6, Math.min(200, v + change))),
    })

    useLayoutEffect(() => {
        if (titleBarRef.current) setTitleBarHeight(titleBarRef.current.offsetHeight)
    }, [titleBarVisible, titleBarPosition])

    // Nothing in the toolbar can be clicked while clicks go through the window
    useEffect(() => {
        if (settings.clickThrough) setToolbarVisible(false)
    }, [settings.clickThrough])

    const readFrom = async (read: () => Promise<string | null>) => {
        try {
            const text = await read()
            if (text) loadScript(text)
        } catch (e) {
            console.error(e)
        }
    }
    // Listening and editing exclude each other: the script must hold still
    const editAt = (caret: number | null) => {
        session.stopListening()
        setEditCaret(caret)
        setIsEditing(true)
    }

    const handleToggleListen = () => {
        if (countdown !== null) session.cancelCountdown()
        else if (isSpeechActive) {
            session.stopListening()
            script.reset()
        } else session.startListening()
    }

    const handleAdjustStart = () => {
        setIsAdjusting(true)
        const onUp = () => {
            setIsAdjusting(false)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchend', onUp)
        }
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchend', onUp)
    }

    // With auto contrast the chosen color is nudged until it reads well on the
    // background, and once the background turns see-through (so whatever is
    // behind the window shows) the text gets a halo to stay legible on it
    const displayTextColor = settings.autoContrast
        ? ensureContrast(settings.textColor, bgColor)
        : settings.textColor
    const textHalo =
        settings.autoContrast && bgOpacity < HALO_BELOW_OPACITY
            ? bestOutline(displayTextColor)
            : undefined

    const titleBarRoom = titleBarVisible ? titleBarHeight : 0
    const toolbarTopOffset = titleBarPosition === 'top' ? titleBarRoom : 0
    // Distance from the bottom of the frame to the status row
    const statusBottom = (titleBarPosition === 'bottom' ? titleBarRoom : 0) + 6

    // While the toolbar is open the window grows below the teleprompter, so
    // the toolbar and its panels never cover the text or get cut off. When it
    // cannot grow (maximized) the toolbar sits over the bottom of the text
    // instead, which then makes room for it.
    const { expansion, ready: toolbarReady, resizeFrame } = useWindowExpansion(toolbarVisible)
    useWindowPlacement(toolbarVisible || expansion !== null)
    usePassThroughGaps(expansion !== null)
    const toolbarPlacement: React.CSSProperties = expansion
        ? { left: expansion.frame.width / 2, top: expansion.frame.height + (BAR_ROOM - 40) / 2 }
        : { left: '50%', bottom: statusBottom + 30 }
    const bottomInset = toolbarVisible && toolbarReady && !expansion ? BAR_ROOM : 0

    return (
        <I18nProvider language={settings.uiLanguage}>
            <div
                // Layout only: clicks on it go through to the apps behind
                data-pass-through
                className="font-sans"
                style={{ height: '100vh', overflow: 'hidden' }}>
                <Frame
                    expansion={expansion}
                    background={bgColor}
                    opacity={bgOpacity}
                    outline={displayTextColor}>
                    {titleBarVisible && (
                        <TitleBar
                            ref={titleBarRef}
                            position={titleBarPosition}
                            onPositionChange={settings.setTitleBarPosition}
                        />
                    )}

                    <ToolbarToggle
                        open={toolbarVisible}
                        onToggle={() => setToolbarVisible((v) => !v)}
                        bottom={statusBottom - 2}
                    />

                    <Canvas
                        cards={script.cards}
                        currentCard={currentCard}
                        currentWordIndex={currentWordIndex}
                        heard={script.heard}
                        // The clicked word becomes the next one to read
                        onContinueFrom={(index) => script.jumpTo(index - 1)}
                        onEditAt={editAt}
                        isListening={isSpeechActive}
                        editCaret={editCaret}
                        content={content}
                        isEditing={isEditing}
                        onContentChange={script.setContent}
                        onEditStart={() => editAt(null)}
                        onEditEnd={() => setIsEditing(false)}
                        fontSize={settings.fontSize}
                        textColor={displayTextColor}
                        textHalo={textHalo}
                        readingLine={settings.readingLine}
                        scrolling={settings.scrolling}
                        typography={settings.typography}
                        titleBarHeight={titleBarRoom}
                        bottomInset={bottomInset}
                        titleBarPosition={titleBarPosition}
                    />

                    <ModelDownloadCard
                        language={LANGUAGES.find((l) => l.value === language)?.name ?? language}
                        downloading={speechModel.downloading}
                        failed={speechModel.failed}
                        received={speechModel.received}
                        total={speechModel.total}
                        onRetry={() => speechModel.download()}
                    />

                    <UpdateBanner
                        // Out of the way while the toolbar is open; Settings can install too
                        visible={updater.showBanner && !toolbarVisible}
                        top={toolbarTopOffset + 8}
                        version={updater.newVersion}
                        downloading={updater.status === 'downloading'}
                        progress={updater.progress}
                        onInstall={updater.install}
                        onDismiss={updater.dismiss}
                    />

                    {!isEditing && (
                        <StatusBar
                            bottom={statusBottom}
                            cardCount={script.cards.length}
                            currentCard={currentCard}
                            onPreviousCard={() => script.goToCard(currentCard - 1)}
                            onNextCard={() => script.goToCard(currentCard + 1)}
                            sessionActive={isSpeechActive}
                            targetMinutes={settings.targetMinutes}
                            {...pace}
                            clickThrough={settings.clickThrough}
                            heard={isSpeechActive && !isPaused ? heardText : ''}
                            error={error ? (t.errors[error] ?? error) : null}
                            countdown={countdown}
                        />
                    )}
                </Frame>

                <OpenTowardsContext.Provider value={expansion ? 'down' : 'up'}>
                    <Toolbar
                        // Shown once the window has made room, so it does not
                        // flash over the text first
                        visible={toolbarVisible && toolbarReady}
                        isAdjusting={isAdjusting}
                        placement={toolbarPlacement}
                        session={session}
                        isRecognizing={isRecognizing}
                        isDownloadingModel={speechModel.downloading}
                        content={content}
                        isEditing={isEditing}
                        settings={settings}
                        microphones={speech.microphones}
                        activeMic={activeMic}
                        onRefreshMicrophones={speech.refreshMicrophones}
                        onToggleListen={handleToggleListen}
                        onPasteText={() => readFrom(readClipboard)}
                        onImport={() => readFrom(() => readPickedFile(t.textFiles))}
                        onClear={() => {
                            session.stopListening()
                            script.load('')
                        }}
                        onToggleEdit={() => (isEditing ? setIsEditing(false) : editAt(null))}
                        onShowTutorial={tour.show}
                        appearance={
                            <AppearancePanel
                                settings={settings}
                                onAdjustStart={handleAdjustStart}
                            />
                        }
                        settingsPanel={
                            <SettingsPanel
                                settings={settings}
                                updater={updater}
                                failedShortcuts={failedShortcuts}
                                onRecordingShortcut={setRecordingShortcut}
                                onUiLanguageChange={(val) => {
                                    // Swap the welcome script along with the language, unless it was edited
                                    if (
                                        UI_LANGUAGES.some(
                                            (l) => l.messages.sampleScript === content,
                                        )
                                    )
                                        loadScript(getMessages(val).sampleScript)
                                    settings.setUiLanguage(val)
                                }}
                                // The window gives up (or takes back) just the title bar's
                                // height, so the text stays where it is on screen
                                onToggleTitleBar={() => {
                                    const delta = titleBarVisible
                                        ? -TITLE_BAR_HEIGHT
                                        : TITLE_BAR_HEIGHT
                                    resizeFrame(delta, titleBarPosition).catch((e) =>
                                        console.error(e),
                                    )
                                    settings.setTitleBarVisible((v) => !v)
                                }}
                                onShowTutorial={tour.show}
                                onReset={() => {
                                    clearPersistentState()
                                    window.location.reload()
                                }}
                            />
                        }
                    />
                </OpenTowardsContext.Provider>
            </div>
        </I18nProvider>
    )
}

export default App
