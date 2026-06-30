import { Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login/Login'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Logout } from './pages/Logout/Logout'
import { ClientesList } from './pages/Clientes/ClientesList'
import { ClienteDetail } from './pages/Clientes/ClienteDetail'
import { ClienteCreate } from './pages/Clientes/ClienteCreate'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminRoute } from './auth/AdminRoute'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/novo"
        element={
          <AdminRoute>
            <ClienteCreate />
          </AdminRoute>
        }
      />
      <Route
        path="/clientes/:id"
        element={
          <ProtectedRoute>
            <ClienteDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
