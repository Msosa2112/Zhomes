import { useEffect } from 'react'
import { IonApp } from '@ionic/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { PropertiesProvider } from './context/PropertyContext'
import AppRoutes from './AppRoutes'
import './App.css'
/* Spotlight-enabled selectors — single document listener for perf */
const SPOTLIGHT_SEL = [
  '.stat-card', '.featured-card', '.mortgage-card', '.mortgage-summary-card',
  '.mortgage-total-card', '.realtor-card', '.property-card', '.detail-feature-card',
  '.deal-card', '.msg-thread', '.doc-card', '.analytics-card',
  '.team-card', '.commission-card', '.transaction-card', '.card-spotlight',
].join(',')

function App() {
  /* Global spotlight mouse tracker */
  useEffect(() => {
    const handler = (e) => {
      const card = e.target.closest(SPOTLIGHT_SEL)
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <IonApp>
      <PropertiesProvider>
        <Router>
          <AppRoutes />
        </Router>
      </PropertiesProvider>
    </IonApp>
  )
}

export default App
