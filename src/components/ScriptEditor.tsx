import { Fragment, type CSSProperties, type RefObject } from 'react'

// The script as an editable field. The field draws only the caret and the
// selection; a copy of the text right under it, laid out the same way,
// carries the colors, so the text is painted letter by letter while editing
// too. Each line of the copy is a piece with its offset, like the words when
// reading.
export default function ScriptEditor({
    editorRef,
    content,
    onChange,
    onDone,
    placeholder,
    textStyle,
    color,
    look,
}: {
    editorRef: RefObject<HTMLTextAreaElement | null>
    content: string
    onChange: (text: string) => void
    onDone: () => void
    placeholder: string
    textStyle: CSSProperties
    color: string
    // How a piece of text at an offset is painted
    look: (at: number, fade: number) => CSSProperties
}) {
    let at = 0
    const lines = content.split('\n').map((text) => {
        const line = { text, at }
        at += text.length + 1
        return line
    })
    // Same wrapping as the field, so every letter lands in the same place
    const layout: CSSProperties = {
        ...textStyle,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
    }

    return (
        <div className="relative min-h-[80%]">
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none select-none"
                style={layout}>
                {lines.map((line) => (
                    <Fragment key={line.at}>
                        <span
                            data-at={line.at}
                            style={look(line.at, 1)}>
                            {line.text}
                        </span>
                        {'\n'}
                    </Fragment>
                ))}
                {/* Keeps a trailing empty line as tall as in the field */}
                {'​'}
            </div>
            <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onDone()
                }}
                placeholder={placeholder}
                spellCheck={false}
                className="relative block w-full bg-transparent resize-none outline-none placeholder:[color:var(--placeholder)] placeholder:opacity-40"
                style={
                    {
                        ...layout,
                        color: 'transparent',
                        caretColor: '#facc15',
                        '--placeholder': color,
                        // Grow with the text so the canvas scrolls, not the field
                        fieldSizing: 'content',
                    } as CSSProperties
                }
            />
        </div>
    )
}
