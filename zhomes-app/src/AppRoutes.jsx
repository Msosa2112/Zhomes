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
import RegisterPageMobile from './pages/mobile/auth/RegisterPageMobile'
import CompleteProfileMobile from './pages/mobile/auth/CompleteProfileMobile'
import RecoverPasswordMobile from './pages/mobile/auth/RecoverPasswordMobile'
import UpdatePasswordMobile from './pages/mobile/auth/UpdatePasswordMobile'
import VibeFeedMobile from './pages/mobile/public/VibeFeedMobile'
import UserProfileMobile from './pages/mobile/public/UserProfileMobile'
import SwipeModePageMobile from './pages/mobile/public/SwipeModePageMobile'
import SharedCollectionPageMobile from './pages/mobile/public/SharedCollectionPageMobile'
import CoShoppingMobile from './pages/mobile/public/CoShoppingMobile'

import DashboardPageMobile from './pages/mobile/dashboard/DashboardPageMobile'
import TransactionsPageMobile from './pages/mobile/dashboard/TransactionsPageMobile'
import BrokerDocumentsMobile from './pages/mobile/dashboard/BrokerDocumentsMobile'
import TeamPageMobile from './pages/mobile/dashboard/TeamPageMobile'
import DealRoomMobile from './pages/mobile/dashboard/DealRoomMobile'
import BrokerMessagesMobile from './pages/mobile/dashboard/BrokerMessagesMobile'
import BrokerTerminal from './pages/dashboard/BrokerTerminal'
import CRMPageMobile from './pages/mobile/dashboard/CRMPageMobile'
import ShowingScheduleMobile from './pages/mobile/dashboard/ShowingScheduleMobile'
import ESignaturesMobile from './pages/mobile/dashboard/ESignaturesMobile'
import CMAPageMobile from './pages/mobile/dashboard/CMAPageMobile'
import MarketReportsMobile from './pages/mobile/dashboard/MarketReportsMobile'
import BrokerProfile from './pages/broker/BrokerProfile'

import SuperAdminKeysMobile from './pages/admin/SuperAdminKeysMobile'

import RealtorDashboardMobile from './pages/mobile/dashboard/RealtorDashboardMobile'
import RealtorTransactionsMobile from './pages/mobile/dashboard/RealtorTransactionsMobile'
import RealtorMessagesMobile from './pages/mobile/dashboard/RealtorMessagesMobile'
import RealtorDocumentsMobile from './pages/mobile/dashboard/RealtorDocumentsMobile'
import RealtorShowingsMobile from './pages/mobile/dashboard/RealtorShowingsMobile'
import RealtorLeadsMobile from './pages/mobile/dashboard/RealtorLeadsMobile'
import RealtorOpenHousesMobile from './pages/mobile/dashboard/RealtorOpenHousesMobile'
import RealtorTasksMobile from './pages/mobile/dashboard/RealtorTasksMobile'
import RealtorClientsMobile from './pages/mobile/dashboard/RealtorClientsMobile'
import RealtorProfile from './pages/realtor/RealtorProfile'
import CreatePropertyPage from './pages/realtor/CreatePropertyPage'
import UploadVibeMobile from './pages/mobile/dashboard/UploadVibeMobile'

import PageTransition from './components/layout/PageTransition'
import ProtectedRoute from './components/auth/ProtectedRoute'

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
                <Route path="/vibe" element={<VibeFeedMobile />} />
                <Route path="/login" element={<LoginPageMobile />} />
                <Route path="/registro" element={<RegisterPageMobile />} />
                <Route path="/completar-perfil" element={<CompleteProfileMobile />} />
                <Route path="/recuperar" element={<RecoverPasswordMobile />} />
                <Route path="/actualizar-password" element={<UpdatePasswordMobile />} />
                <Route path="/coleccion/:userId" element={<SharedCollectionPageMobile />} />
            </Route>

            {/* RUTAS PROTEGIDAS PARA EL CLIENTE/USUARIO REGULAR */}
            <Route element={<ProtectedRoute />}>
                <Route element={<PublicLayoutMobile />}>
                    <Route path="/perfil" element={<UserProfileMobile />} />
                    <Route path="/swipe" element={<SwipeModePageMobile />} />
                    <Route path="/pareja" element={<CoShoppingMobile />} />
                </Route>
                {/* Client Deal Room without any specific layout wrapper, or inside Public layout if we want nav, but DealRoom covers the screen */}
                <Route path="/mi-transaccion/:id" element={<DealRoomMobile />} />
            </Route>

            {/* RUTAS PROTEGIDAS PARA EL STAFF */}
            <Route element={<ProtectedRoute />}>
                {/* Dashboard interno (Broker) */}
                <Route element={<DashboardLayoutMobile />}>
                    <Route path="/dashboard" element={<DashboardPageMobile />} />
                    <Route path="/transacciones" element={<TransactionsPageMobile />} />
                    <Route path="/documentos" element={<BrokerDocumentsMobile />} />
                    <Route path="/equipo" element={<TeamPageMobile />} />
                    <Route path="/dashboard/deal" element={<DealRoomMobile />} />
                    <Route path="/deal/:id" element={<DealRoomMobile />} />
                    <Route path="/mensajes" element={<BrokerMessagesMobile />} />
                    <Route path="/terminal" element={<BrokerTerminal />} />
                    <Route path="/crm" element={<CRMPageMobile />} />
                    <Route path="/visitas" element={<ShowingScheduleMobile />} />

                    <Route path="/cma" element={<CMAPageMobile />} />
                    <Route path="/mercado" element={<MarketReportsMobile />} />
                    <Route path="/dashboard/perfil" element={<BrokerProfile />} />
                </Route>
                
                {/* Admin Configurations */}
                <Route path="/admin/config" element={<SuperAdminKeysMobile />} />

                {/* Portal Realtor */}
                <Route element={<RealtorLayoutMobile />}>
                    <Route path="/realtor" element={<RealtorDashboardMobile />} />
                    <Route path="/realtor/transacciones" element={<RealtorTransactionsMobile />} />
                    <Route path="/realtor/documentos" element={<RealtorDocumentsMobile />} />
                    <Route path="/realtor/firmas" element={<ESignaturesMobile />} />
                    <Route path="/realtor/mensajes" element={<RealtorMessagesMobile />} />
                    <Route path="/realtor/perfil" element={<RealtorProfile />} />
                    <Route path="/realtor/crear-propiedad" element={<CreatePropertyPage />} />
                    <Route path="/realtor/citas" element={<RealtorShowingsMobile />} />
                    <Route path="/realtor/leads" element={<RealtorLeadsMobile />} />
                    <Route path="/realtor/open-houses" element={<RealtorOpenHousesMobile />} />
                    <Route path="/realtor/tareas" element={<RealtorTasksMobile />} />
                    <Route path="/realtor/clientes" element={<RealtorClientsMobile />} />
                    <Route path="/realtor/subir-vibe" element={<UploadVibeMobile />} />
                </Route>
            </Route>
        </Routes>
    )
}
