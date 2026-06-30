import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../auth/useAuth'
import { listPedidos, searchPedidoById, deletePedido } from '../../services/pedidos'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Pedido } from '../../types/database'

export function PedidosList() {
  const { isAdmin } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const result = await listPedidos(p)
      setPedidos(result.data)
      setLastPage(result.lastPage)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vales.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const termo = busca.trim()
    if (!termo || isNaN(Number(termo))) {
      loadPage(1)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resultado = await searchPedidoById(Number(termo))
      setPedidos(resultado)
      setLastPage(1)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este vale?')) return
    try {
      await deletePedido(id)
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
          <h1>Vales</h1>
          <Link className="btn btn-primary" to="/vales/novo">
            + Novo Vale
          </Link>
        </div>

        <form className="page-content__toolbar" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Buscar por número do vale..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="btn btn-secondary" type="submit">
            Buscar
          </button>
        </form>

        {error && <p className="login-form__error">{error}</p>}

        {loading ? (
          <p>Carregando...</p>
        ) : pedidos.length === 0 ? (
          <p className="empty-state">Nenhum vale encontrado.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/vales/${p.id}`}>#{p.id}</Link>
                  </td>
                  <td>{p.empresa_nome}</td>
                  <td>{formatDate(p.created_at)}</td>
                  <td>{p.retirada ? 'Retirada' : 'Entrega'}</td>
                  <td>{formatCurrency(p.total_liquido)}</td>
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
