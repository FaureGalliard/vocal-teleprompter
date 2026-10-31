import { useEffect } from 'react'
import { byRecent, saveScript, type SavedScript } from '../lib/library'
import { usePersistentState } from './usePersistentState'

// How long the text must hold still before it is saved, while typing
const SAVE_AFTER_MS = 400

// The saved scripts. The one on screen is always among them and is saved as
// it changes, so switching to another never loses anything. Pasting,
// importing or getting a script from an assistant starts a new one.
export function useLibrary(script: { content: string; load: (text: string) => void }) {
    const [scripts, setScripts] = usePersistentState<SavedScript[]>('scripts', [])
    const [currentId, setCurrentId] = usePersistentState<string | null>('currentScript', null)
    const { content } = script

    // Keep the one on screen saved (the first time, it becomes the first one)
    useEffect(() => {
        const id = currentId ?? crypto.randomUUID()
        if (!currentId) {
            setCurrentId(id)
            setScripts((list) => saveScript(list, id, content))
            return
        }
        const timer = setTimeout(
            () => setScripts((list) => saveScript(list, id, content)),
            SAVE_AFTER_MS,
        )
        return () => clearTimeout(timer)
        // The setters never change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, currentId])

    // A new script, on screen from the top
    const create = (text: string) => {
        const id = crypto.randomUUID()
        setScripts((list) => {
            // The one on screen, saved before leaving it
            const kept = currentId ? saveScript(list, currentId, content) : list
            return saveScript(kept, id, text)
        })
        setCurrentId(id)
        script.load(text)
        return id
    }

    const open = (id: string) => {
        const found = scripts.find((s) => s.id === id)
        if (!found || id === currentId) return false
        // The one on screen, saved before leaving it
        if (currentId) setScripts((list) => saveScript(list, currentId, content))
        setCurrentId(id)
        script.load(found.text)
        return true
    }

    // Deleting the one on screen moves to the latest of the rest, or a new one
    const remove = (id: string) => {
        const rest = scripts.filter((s) => s.id !== id)
        setScripts(rest)
        if (id !== currentId) return
        const next = byRecent(rest)[0]
        if (next) {
            setCurrentId(next.id)
            script.load(next.text)
        } else create('')
    }

    return { scripts: byRecent(scripts), currentId, create, open, remove }
}
