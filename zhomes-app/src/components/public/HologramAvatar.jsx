import { useRef, useEffect, useState } from 'react'
import './HologramAvatar.css'

/**
 * HologramAvatar — Muestra el video del realtor con fondo transparente.
 * El video debe tener canal alpha (WebM VP9 o MOV ProRes 4444).
 * Si el video no carga, muestra la foto con un sutil recorte circular.
 *
 * Props:
 * - video: string | null (ruta al video sin fondo)
 * - photo: string (ruta a la foto de fallback)
 * - name: string (nombre del realtor)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - active: boolean (si el avatar está visible)
 */
export default function HologramAvatar({ video, photo, name, size = 'md', active = true }) {
    const videoRef = useRef(null)
    const [videoFailed, setVideoFailed] = useState(false)
    const [videoReady, setVideoReady] = useState(false)
    const [fadeIn, setFadeIn] = useState(false)

    // Fade-in after mount
    useEffect(() => {
        if (active) {
            const timer = setTimeout(() => setFadeIn(true), 100)
            return () => clearTimeout(timer)
        } else {
            setFadeIn(false)
        }
    }, [active])

    // Auto-play video
    useEffect(() => {
        const vid = videoRef.current
        if (vid && video && !videoFailed) {
            vid.play().catch((err) => {
                console.warn('HologramAvatar: video play failed', err)
                setVideoFailed(true)
            })
        }
    }, [video, videoFailed, videoReady])

    const handleVideoCanPlay = () => {
        setVideoReady(true)
    }

    const handleVideoError = (e) => {
        console.warn('HologramAvatar: video error', e)
        setVideoFailed(true)
    }

    const useVideo = video && !videoFailed
    const sizeClass = `holo-${size}`

    // Derive WebM path from .mov path for Chrome/Firefox fallback
    const webmPath = video ? video.replace(/\.mov$/i, '.webm') : null

    return (
        <div className={`hologram-avatar ${sizeClass} ${fadeIn ? 'visible' : ''} ${active ? 'active' : ''}`}>
            <div className="holo-figure">
                {useVideo ? (
                    <video
                        ref={videoRef}
                        loop
                        muted
                        playsInline
                        className="holo-video"
                        onCanPlay={handleVideoCanPlay}
                        onError={handleVideoError}
                    >
                        {/* WebM for Chrome/Firefox (VP9 alpha) */}
                        {webmPath && <source src={webmPath} type="video/webm" />}
                        {/* MOV for Safari (ProRes 4444 alpha) */}
                        <source src={video} type="video/quicktime" />
                    </video>
                ) : (
                    <img
                        src={photo}
                        alt={name}
                        className="holo-photo"
                    />
                )}
            </div>

            {/* Subtle name badge */}
            <div className="holo-name">
                <span className="holo-name-text">{name}</span>
            </div>
        </div>
    )
}
