export default function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            role="switch"
            aria-checked={on}
            onClick={onToggle}
            className={`relative w-8 h-[18px] flex-shrink-0 rounded-full transition-colors ${
                on ? 'bg-[#445ade]' : 'bg-white/15'
            }`}>
            <span
                className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white transition-transform ${
                    on ? 'translate-x-[14px]' : ''
                }`}
            />
        </button>
    )
}
