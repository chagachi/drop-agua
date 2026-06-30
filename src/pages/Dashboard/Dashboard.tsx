import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import './Dashboard.css'

export function Dashboard() {
  const { session, isAdmin } = useAuth()

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-content">
        <h1>Bem-vindo ao Drop Água</h1>
        <p>
          Logado como <strong>{session?.user.email}</strong>
          {isAdmin && ' (administrador)'}.
        </p>
        <p className="dashboard-content__hint">
          Os contadores de clientes e vales emitidos entram no próximo checkpoint.
        </p>
      </main>
    </div>
  )
}
