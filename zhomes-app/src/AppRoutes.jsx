import { Routes, Route, useLocation } from 'react-router-dom'

/* Mobile Components */
import PublicLayoutMobile from './components/layout/mobile/PublicLayoutMobile'
import DashboardLayoutMobile from './components/layout/mobile/DashboardLayoutMobile'
import RealtorLayoutMobile from './components/layout/mobile/RealtorLayoutMobile'

import LandingPageMobile from './pages/mobile/public/LandingPageMobile'
import PropertiesPageMobile from './pages/mobile/public/PropertiesPageMobile'
import PropertyDetailPageMobile from './pages/mobile/public/PropertyDetailPageMobile'
import RealtorsPageMobile from './pages/mobile/public/RealtorsPageMobile'
import MapPageMobile from './pages/mobile/public/MapPageMobile'
import MortgageCalculatorPageMobile from './pages/mobile/public/MortgageCalculatorPageMobile'
import LoginPageMobile from './pages/mobile/auth/LoginPageMobile'
import VibeSearchPage from './pages/public/VibeSearchPage'

import DashboardPageMobile from './pages/mobile/dashboard/DashboardPageMobile'
import TransactionsPageMobile from './pages/mobile/dashboard/TransactionsPageMobile'
import CommissionsPageMobile from './pages/mobile/dashboard/CommissionsPageMobile'
import BrokerDocumentsMobile from './pages/mobile/dashboard/BrokerDocumentsMobile'
import TeamPageMobile from './pages/mobile/dashboard/TeamPageMobile'
import DealRoomMobile from './pages/mobile/dashboard/DealRoomMobile'
import BrokerMessagesMobile from './pages/mobile/dashboard/BrokerMessagesMobile'
import AnalyticsPageMobile from './pages/mobile/dashboard/AnalyticsPageMobile'
import BrokerTerminal from './pages/dashboard/BrokerTerminal'

import RealtorDashboardMobile from './pages/mobile/dashboard/RealtorDashboardMobile'
import RealtorTransactionsMobile from './pages/mobile/dashboard/RealtorTransactionsMobile'
import RealtorCommissionsMobile from './pages/mobile/dashboard/RealtorCommissionsMobile'
import RealtorMessagesMobile from './pages/mobile/dashboard/RealtorMessagesMobile'
import RealtorDocumentsMobile from './pages/mobile/dashboard/RealtorDocumentsMobile'
import RealtorProfile from './pages/realtor/RealtorProfile'
import CreatePropertyPage from './pages/realtor/CreatePropertyPage'

import PageTransition from './components/layout/PageTransition'

export default function AppRoutes() {
    const location = useLocation()

    return (
        <Routes>
            {/* Rutas públicas */}
            <Route element={<PublicLayoutMobile />}>
                <Route path="/" element={<LandingPageMobile />} />
                <Route path="/propiedades" element={<PropertiesPageMobile />} />
                <Route path="/propiedades/:id" element={<PropertyDetailPageMobile />} />
                <Route path="/mapa" element={<MapPageMobile />} />
                <Route path="/realtors" element={<RealtorsPageMobile />} />
                <Route path="/calculadora" element={<MortgageCalculatorPageMobile />} />
                <Route path="/vibe" element={<VibeSearchPage />} />
                <Route path="/login" element={<LoginPageMobile />} />
            </Route>

            {/* Dashboard interno (Broker) */}
            <Route element={<DashboardLayoutMobile />}>
                <Route path="/dashboard" element={<DashboardPageMobile />} />
                <Route path="/transacciones" element={<TransactionsPageMobile />} />
                <Route path="/documentos" element={<BrokerDocumentsMobile />} />
                <Route path="/comisiones" element={<CommissionsPageMobile />} />
                <Route path="/equipo" element={<TeamPageMobile />} />
                <Route path="/dashboard/deal" element={<DealRoomMobile />} />
                <Route path="/deal/:id" element={<DealRoomMobile />} />
                <Route path="/mensajes" element={<BrokerMessagesMobile />} />
                <Route path="/analytics" element={<AnalyticsPageMobile />} />
                <Route path="/terminal" element={<BrokerTerminal />} />
            </Route>

            {/* Portal Realtor */}
            <Route element={<RealtorLayoutMobile />}>
                <Route path="/realtor" element={<RealtorDashboardMobile />} />
                <Route path="/realtor/transacciones" element={<RealtorTransactionsMobile />} />
                <Route path="/realtor/documentos" element={<RealtorDocumentsMobile />} />
                <Route path="/realtor/comisiones" element={<RealtorCommissionsMobile />} />
                <Route path="/realtor/mensajes" element={<RealtorMessagesMobile />} />
                <Route path="/realtor/perfil" element={<RealtorProfile />} />
                <Route path="/realtor/crear-propiedad" element={<CreatePropertyPage />} />
            </Route>
        </Routes>
    )
}
