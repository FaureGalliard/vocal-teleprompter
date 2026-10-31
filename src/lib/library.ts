// The saved scripts, each kept as it was last left

export interface SavedScript {
    id: string
    text: string
    // When it was last changed (ms), to list the latest first
    updatedAt: number
}

// Longest title shown for a script, in characters
const TITLE_LENGTH = 48

// A script's title: its first line with words in it, cut short
export function scriptTitle(text: string) {
    const line = text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l && l !== '---')
    if (!line) return null
    return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : line
}

// The list with `id` holding `text`, added if it isn't there yet
export function saveScript(list: SavedScript[], id: string, text: string, now = Date.now()) {
    const found = list.some((s) => s.id === id)
    if (found && list.find((s) => s.id === id)!.text === text) return list
    const saved = { id, text, updatedAt: now }
    return found ? list.map((s) => (s.id === id ? saved : s)) : [saved, ...list]
}

// Latest first
export function byRecent(list: SavedScript[]) {
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}
