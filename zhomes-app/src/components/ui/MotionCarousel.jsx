import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MotionCarousel.css';

export function MotionCarousel({ children, options }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'center',
        loop: true,
        skipSnaps: false,
        ...options
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onInit = useCallback((emblaApi) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on('reInit', onInit);
        emblaApi.on('reInit', onSelect);
        emblaApi.on('select', onSelect);
    }, [emblaApi, onInit, onSelect]);

    const childrenArray = React.Children.toArray(children);

    return (
        <div className="mc-wrapper">
            <div className="mc-viewport" ref={emblaRef}>
                <div className="mc-container">
                    {childrenArray.map((child, index) => {
                        const isActive = index === selectedIndex;
                        return (
                            <motion.div 
                                className="mc-slide"
                                key={index}
                                animate={{ 
                                    scale: isActive ? 1 : 0.85,
                                    opacity: isActive ? 1 : 0.4,
                                    filter: isActive ? 'blur(0px)' : 'blur(2px)'
                                }}
                                transition={{ 
                                    duration: 0.4, 
                                    ease: [0.32, 0.72, 0, 1] 
                                }}
                            >
                                <div className="mc-slide-inner">
                                    {child}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="mc-controls">
                <div className="mc-indicators">
                    {scrollSnaps.map((_, index) => (
                        <div 
                            key={index}
                            className={`mc-dot ${index === selectedIndex ? 'is-active' : ''}`}
                            onClick={() => emblaApi && emblaApi.scrollTo(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
