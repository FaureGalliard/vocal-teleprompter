import { readClipboard, readPickedFile } from '../lib/scriptFiles'
import { useLibrary } from './useLibrary'

// What can be done with the script from the script menu and by assistants:
// load one (a new one in the library, or the current one changed), paste
// or import one, start a new one, open a saved one, or clear it. Each stops
// listening and leaves editing, except a new script, which opens the editor.
export function useScriptActions({
    script,
    stopListening,
    setIsEditing,
    editAt,
    filesLabel,
}: {
    script: { content: string; load: (text: string) => void }
    stopListening: () => void
    setIsEditing: (editing: boolean) => void
    // Opens the editor, with the caret at an offset (null: at the end)
    editAt: (caret: number | null) => void
    // What the file picker calls text files
    filesLabel: string
}) {
    const library = useLibrary(script)

    const load = (text: string, asNew = true) => {
        stopListening()
        setIsEditing(false)
        if (asNew) library.create(text)
        else script.load(text)
    }

    const readFrom = async (read: () => Promise<string | null>) => {
        try {
            const text = await read()
            if (text) load(text)
        } catch (e) {
            console.error(e)
        }
    }

    return {
        library,
        load,
        paste: () => readFrom(readClipboard),
        importFile: () => readFrom(() => readPickedFile(filesLabel)),
        newScript: () => {
            stopListening()
            library.create('')
            editAt(null)
        },
        openScript: (id: string) => {
            stopListening()
            setIsEditing(false)
            library.open(id)
        },
        clear: () => load('', false),
    }
}
