import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'

// Text on the clipboard, if any
export const readClipboard = () => readText()

// A .txt file the user picks, or null when they cancel
export async function readPickedFile(filterName: string) {
    const file = await open({
        multiple: false,
        filters: [{ name: filterName, extensions: ['txt'] }],
    })
    return file ? readTextFile(file) : null
}
