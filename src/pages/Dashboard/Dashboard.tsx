import { useEffect, useState } from 'react'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { countEmpresas } from '../../services/empresas'
import { countPedidos } from '../../services/pedidos'
import './Dashboard.css'

export function Dashboard() {
  const { session, isAdmin } = useAuth()
  const [totalClientes, setTotalClientes] = useState<number | null>(null)
  const [totalPedidos, setTotalPedidos] = useState<number | null>(null)

  useEffect(() => {
    countEmpresas().then(setTotalClientes).catch(() => setTotalClientes(0))
    countPedidos().then(setTotalPedidos).catch(() => setTotalPedidos(0))
  }, [])

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-content">
        <h1>Bem-vindo ao Drop Água</h1>
        <p>
          Logado como <strong>{session?.user.email}</strong>
          {isAdmin && ' (administrador)'}.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <span className="dashboard-card__value">{totalClientes ?? '...'}</span>
            <span className="dashboard-card__label">Clientes</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card__value">{totalPedidos ?? '...'}</span>
            <span className="dashboard-card__label">Vales Emitidos</span>
          </div>
        </div>
      </main>
    </div>
  )
}
