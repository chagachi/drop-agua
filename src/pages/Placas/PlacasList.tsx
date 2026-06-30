import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../auth/useAuth'
import { listPlacas, deletePlaca } from '../../services/placas'
import type { Placa } from '../../types/database'

export function PlacasList() {
  const { isAdmin } = useAuth()
  const [placas, setPlacas] = useState<Placa[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const result = await listPlacas(p)
      setPlacas(result.data)
      setLastPage(result.lastPage)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar placas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta placa?')) return
    try {
      await deletePlaca(id)
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
          <h1>Placas</h1>
          <Link className="btn btn-primary" to="/placas/novo">
            + Nova Placa
          </Link>
        </div>

        {error && <p className="login-form__error">{error}</p>}

        {loading ? (
          <p>Carregando...</p>
        ) : placas.length === 0 ? (
          <p className="empty-state">Nenhuma placa cadastrada.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {placas.map((p) => (
                <tr key={p.id}>
                  <td>{p.placa}</td>
                  <td>
                    {isAdmin && (
                      <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>
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
