import { Fragment, type CSSProperties, type RefObject } from 'react'

// The script as an editable field. The field draws only the caret and the
// selection; a copy of the text right under it, laid out the same way,
// carries the colors, so every letter keeps the color it had while reading
// and gets a new one once typing pauses. Letters of the same color share a
// piece, marked with its offset like the words when reading.
export default function ScriptEditor({
    editorRef,
    content,
    onChange,
    onDone,
    placeholder,
    textStyle,
    color,
    colorAt,
}: {
    editorRef: RefObject<HTMLTextAreaElement | null>
    content: string
    onChange: (text: string) => void
    onDone: () => void
    placeholder: string
    textStyle: CSSProperties
    color: string
    // The color of the letter at an offset
    colorAt: (at: number) => string
}) {
    // Runs of letters that share a color; line breaks stand on their own
    const runs: { text: string; at: number; color: string | null }[] = []
    for (let i = 0; i < content.length; i++) {
        const ch = content[i]
        const c = ch === '\n' ? null : colorAt(i)
        const last = runs[runs.length - 1]
        if (last && last.color === c && c !== null) last.text += ch
        else runs.push({ text: ch, at: i, color: c })
    }
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
                {runs.map((run) =>
                    run.color === null ? (
                        <Fragment key={run.at}>{run.text}</Fragment>
                    ) : (
                        <span
                            key={run.at}
                            data-at={run.at}
                            style={{ color: run.color }}>
                            {run.text}
                        </span>
                    ),
                )}
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
