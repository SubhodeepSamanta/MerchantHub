import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Overview from './pages/Overview'
import Payments from './pages/Payments'
import Ledger from './pages/Ledger'
import Advances from './pages/Advances'
import PaymentLink from './pages/PaymentLink'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pay/:slug" element={<Checkout />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/advances" element={<Advances />} />
              <Route path="/payment-link" element={<PaymentLink />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}