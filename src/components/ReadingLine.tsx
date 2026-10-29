// The band where fixed scrolling holds the current line, `at` a share of the
// way down between the canvas' `top` and `bottom` edges
export default function ReadingLine({
    top,
    bottom,
    at,
    height,
    color,
}: {
    top: number
    bottom: number
    at: number
    height: number
    color: string
}) {
    return (
        <div
            className="fixed pointer-events-none rounded-md"
            style={{
                left: 12,
                right: 12,
                top: `calc(${top}px + (var(--frame-h) - ${top + bottom}px) * ${at})`,
                height,
                transform: 'translateY(-50%)',
                backgroundColor: `${color}14`,
                borderTop: `1px solid ${color}30`,
                borderBottom: `1px solid ${color}30`,
            }}
        />
    )
}
