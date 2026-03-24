import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import './PhotoViewerMobile.css'

export default function PhotoViewerMobile({ photos, isOpen, onClose, initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [progress, setProgress] = useState(0)
    const timerRef = useRef(null)

    const STORY_DURATION = 5000 // 5 seconds per photo

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
            setProgress(0)
        }
    }, [isOpen, initialIndex])

    useEffect(() => {
        if (!isOpen) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        setProgress(0)
        const interval = 50 // Update every 50ms
        const step = (interval / STORY_DURATION) * 100

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    // Go to next photo automatically
                    if (currentIndex < photos.length - 1) {
                        setCurrentIndex(c => c + 1)
                        return 0
                    } else {
                        // Close when finished
                        clearInterval(timerRef.current)
                        setTimeout(onClose, 300)
                        return 100
                    }
                }
                return prev + step
            })
        }, interval)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isOpen, currentIndex, photos.length, onClose])

    const handleTap = (e) => {
        const x = e.clientX
        const width = window.innerWidth
        
        if (x < width / 3) {
            // Tap left (go back)
            if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1)
                setProgress(0)
            }
        } else {
            // Tap right (go forward)
            if (currentIndex < photos.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setProgress(0)
            } else {
                onClose()
            }
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div 
                className="pv-overlay"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                {/* Progress Bars */}
                <div className="pv-progress-container">
                    {photos.map((_, idx) => {
                        let width = '0%'
                        if (idx < currentIndex) width = '100%'
                        else if (idx === currentIndex) width = `${progress}%`

                        return (
                            <div key={idx} className="pv-progress-slot">
                                <div className="pv-progress-fill" style={{ width }} />
                            </div>
                        )
                    })}
                </div>

                <button className="pv-close-btn" onClick={onClose}>
                    <X size={24} color="white" />
                </button>

                <div className="pv-content" onClick={handleTap}>
                    <motion.img 
                        key={currentIndex}
                        src={photos[currentIndex]} 
                        alt={`Photo ${currentIndex + 1}`} 
                        className="pv-image"
                        initial={{ opacity: 0.8, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
