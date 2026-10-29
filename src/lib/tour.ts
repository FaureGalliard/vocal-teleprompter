import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { Messages } from '../i18n/en'

const at = (id: string) => `[data-tour="${id}"]`

// Walks through the toolbar and canvas. The toolbar must be open before
// calling this, since most steps point at its controls.
export function startTour(t: Messages, onDone: () => void) {
    const steps: DriveStep[] = [
        { popover: { title: t.tour.welcomeTitle, description: t.tour.welcome } },
        {
            element: at('title-bar'),
            popover: { title: t.tour.titleBarTitle, description: t.tour.titleBar, side: 'bottom' },
        },
        {
            element: at('script'),
            popover: { title: t.tour.scriptTitle, description: t.tour.script },
        },
        {
            element: at('start'),
            popover: { title: t.tour.startTitle, description: t.tour.start },
        },
        {
            element: at('speech-language'),
            popover: { title: t.tour.languageTitle, description: t.tour.language },
        },
        {
            element: at('microphone'),
            popover: { title: t.tour.micTitle, description: t.tour.mic },
        },
        {
            element: at('look'),
            popover: { title: t.tour.lookTitle, description: t.tour.look },
        },
        {
            element: at('settings'),
            popover: { title: t.tour.settingsTitle, description: t.tour.settings },
        },
        {
            element: at('canvas'),
            popover: {
                title: t.tour.canvasTitle,
                description: t.tour.canvas,
                side: 'top',
                align: 'center',
            },
        },
        {
            element: at('menu'),
            popover: { title: t.tour.menuTitle, description: t.tour.menu, side: 'top' },
        },
    ]

    const tour = driver({
        steps,
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: t.tour.next,
        prevBtnText: t.tour.prev,
        doneBtnText: t.tour.done,
        popoverClass: 'vt-tour',
        overlayColor: '#000',
        overlayOpacity: 0.6,
        stagePadding: 6,
        stageRadius: 10,
        onDestroyed: onDone,
    })
    tour.drive()
}
