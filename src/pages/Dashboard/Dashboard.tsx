import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { countEmpresas } from '../../services/empresas'
import { countPedidos, listPedidosByRange } from '../../services/pedidos'
import { groupByMonth, topClientesPorVolume } from '../../utils/calc'
import type { Pedido } from '../../types/database'
import './Dashboard.css'

const MONTHS_BACK = 6

export function Dashboard() {
  const { session, isAdmin } = useAuth()
  const [totalClientes, setTotalClientes] = useState<number | null>(null)
  const [totalPedidos, setTotalPedidos] = useState<number | null>(null)
  const [recentPedidos, setRecentPedidos] = useState<Pedido[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    countEmpresas().then(setTotalClientes).catch(() => setTotalClientes(0))
    countPedidos().then(setTotalPedidos).catch(() => setTotalPedidos(0))

    const start = new Date()
    start.setMonth(start.getMonth() - (MONTHS_BACK - 1))
    start.setDate(1)

    listPedidosByRange(start.toISOString(), new Date().toISOString())
      .then(setRecentPedidos)
      .catch(() => setRecentPedidos([]))
      .finally(() => setChartLoading(false))
  }, [])

  const monthlyData = groupByMonth(recentPedidos, MONTHS_BACK)
  const topClientes = topClientesPorVolume(recentPedidos, 5)

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

        {!chartLoading && recentPedidos.length === 0 ? (
          <p className="dashboard-content__hint">
            Ainda não há vales nos últimos {MONTHS_BACK} meses para gerar os gráficos.
          </p>
        ) : (
          <div className="dashboard-charts">
            <div className="dashboard-chart-card">
              <h2>Vales por mês</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="vales" name="Vales" fill="#0b6e99" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-chart-card">
              <h2>Top 5 clientes por volume (m³)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topClientes} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="empresa_nome"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value) => `${value} m³`} />
                  <Bar dataKey="volume" name="Volume" fill="#1a7a4c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
