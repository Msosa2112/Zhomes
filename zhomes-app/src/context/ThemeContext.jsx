import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('zhomes-theme')
            return saved || 'light'
        } catch(e) {
            return 'light'
        }
    })

    useEffect(() => {
        const root = document.documentElement
        root.setAttribute('data-theme', theme)
        try {
            localStorage.setItem('zhomes-theme', theme)
        } catch(e) {}
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
