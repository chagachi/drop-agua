import { Routes, Route } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { Login } from './pages/Login/Login'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Logout } from './pages/Logout/Logout'
import { ClientesList } from './pages/Clientes/ClientesList'
import { ClienteDetail } from './pages/Clientes/ClienteDetail'
import { ClienteCreate } from './pages/Clientes/ClienteCreate'
import { MotoristasList } from './pages/Motoristas/MotoristasList'
import { MotoristaDetail } from './pages/Motoristas/MotoristaDetail'
import { MotoristaCreate } from './pages/Motoristas/MotoristaCreate'
import { PlacasList } from './pages/Placas/PlacasList'
import { PlacaCreate } from './pages/Placas/PlacaCreate'
import { PedidosList } from './pages/Pedidos/PedidosList'
import { PedidoForm } from './pages/Pedidos/PedidoForm'
import { Relatorios } from './pages/Relatorios/Relatorios'
import { RelatorioPrint } from './pages/Relatorios/RelatorioPrint'
import { ImpressaoTicket } from './pages/Impressao/ImpressaoTicket'
import { UsuariosList } from './pages/Usuarios/UsuariosList'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminRoute } from './auth/AdminRoute'

export function App() {
  if (!isSupabaseConfigured) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Configuração pendente</h1>
        <p>
          Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> em{' '}
          <code>.env.local</code> (veja <code>.env.example</code>) para usar o Drop Água.
        </p>
      </div>
    )
  }

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
      <Route
        path="/motoristas"
        element={
          <ProtectedRoute>
            <MotoristasList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/motoristas/novo"
        element={
          <ProtectedRoute>
            <MotoristaCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/motoristas/:id"
        element={
          <ProtectedRoute>
            <MotoristaDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/placas"
        element={
          <ProtectedRoute>
            <PlacasList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/placas/novo"
        element={
          <ProtectedRoute>
            <PlacaCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vales"
        element={
          <ProtectedRoute>
            <PedidosList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vales/novo"
        element={
          <ProtectedRoute>
            <PedidoForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vales/:id"
        element={
          <ProtectedRoute>
            <PedidoForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <AdminRoute>
            <Relatorios />
          </AdminRoute>
        }
      />
      <Route
        path="/relatorios/imprimir"
        element={
          <AdminRoute>
            <RelatorioPrint />
          </AdminRoute>
        }
      />
      <Route
        path="/impressao/:id"
        element={
          <ProtectedRoute>
            <ImpressaoTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <AdminRoute>
            <UsuariosList />
          </AdminRoute>
        }
      />
    </Routes>
  )
}
