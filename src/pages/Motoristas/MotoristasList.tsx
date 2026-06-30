import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../auth/useAuth'
import { listMotoristas, deactivateMotorista } from '../../services/motoristas'
import type { Motorista } from '../../types/database'

export function MotoristasList() {
  const { isAdmin } = useAuth()
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const result = await listMotoristas(p)
      setMotoristas(result.data)
      setLastPage(result.lastPage)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar motoristas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDeactivate(id: number) {
    if (!window.confirm('Excluir este motorista?')) return
    try {
      await deactivateMotorista(id)
      loadPage(page)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <div className="page-content__toolbar">
          <h1>Motoristas</h1>
          <Link className="btn btn-primary" to="/motoristas/novo">
            + Novo Motorista
          </Link>
        </div>

        {error && <p className="login-form__error">{error}</p>}

        {loading ? (
          <p>Carregando...</p>
        ) : motoristas.length === 0 ? (
          <p className="empty-state">Nenhum motorista cadastrado.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Celular</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {motoristas.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link to={`/motoristas/${m.id}`}>{m.nome}</Link>
                  </td>
                  <td>{m.telefone}</td>
                  <td>{m.celular}</td>
                  <td>
                    {isAdmin && (
                      <button className="btn btn-danger" onClick={() => handleDeactivate(m.id)}>
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination page={page} lastPage={lastPage} onPageChange={loadPage} />
      </div>
    </div>
  )
}
