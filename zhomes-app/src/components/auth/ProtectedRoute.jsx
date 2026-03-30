import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
        // Check demo user (localStorage bypass)
        const demoUser = localStorage.getItem('zhomes_demo_user')
        if (demoUser) {
            setUser(JSON.parse(demoUser))
            setLoading(false)
            return
        }

        // Check real Supabase session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user || null)
            } catch (e) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        
        checkUser()

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Don't override demo user
                if (!localStorage.getItem('zhomes_demo_user')) {
                    setUser(session?.user || null)
                    setLoading(false)
                }
            }
        )

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="custom-spinner" style={{ width: 40, height: 40, border: '4px solid #E31E24', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
