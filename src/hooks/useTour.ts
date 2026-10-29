import { useEffect, useRef, useState } from 'react'
import type { Messages } from '../i18n/en'
import { startTour } from '../lib/tour'
import type { Settings } from './useSettings'

// The guided tour, shown once on first launch and replayed on demand.
// It points at toolbar controls, so `prepare` opens the toolbar, and the
// window gets time to grow for it and the toolbar to slide in first.
export function useTour(t: Messages, settings: Settings, prepare: () => void) {
    const [active, setActive] = useState(false)

    const show = () => {
        prepare()
        setActive(true)
        setTimeout(
            () =>
                startTour(t, () => {
                    setActive(false)
                    settings.setTourSeen(true)
                }),
            700,
        )
    }

    // First launch only (the ref keeps StrictMode from starting two)
    const autoStartedRef = useRef(false)
    useEffect(() => {
        if (settings.tourSeen || autoStartedRef.current) return
        autoStartedRef.current = true
        show()
        // Once, on launch
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { active, show }
}
