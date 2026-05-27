import { useState, useEffect } from 'react'

export function useLocationImage(location: string | undefined): string | null {
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
        if (!location) { setSrc(null); return }
        setSrc(null)
        const found: string[] = []
        let done = 0
        const total = 5
        for (let i = 1; i <= total; i++) {
            const s = `/locations/${location}/${location}_${String(i).padStart(2, '0')}.png`
            const img = new Image()
            const finish = () => {
                if (++done === total) {
                    const f = found.filter(Boolean)
                    setSrc(f[Math.floor(Math.random() * f.length)] ?? null)
                }
            }
            img.onload  = () => { found[i - 1] = s; finish() }
            img.onerror = finish
            img.src = s
        }
    }, [location])

    return src
}
