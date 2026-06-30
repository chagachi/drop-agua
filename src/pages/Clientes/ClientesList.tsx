import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Pagination } from '../../components/Pagination'
import { useAuth } from '../../auth/useAuth'
import {
  listEmpresas,
  searchEmpresaByCnpj,
  searchEmpresasByNome,
  deleteEmpresa,
} from '../../services/empresas'
import { formatCNPJ } from '../../utils/format'
import type { Empresa } from '../../types/database'

export function ClientesList() {
  const { isAdmin } = useAuth()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const result = await listEmpresas(p)
      setEmpresas(result.data)
      setLastPage(result.lastPage)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes.')
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
    if (!termo) {
      loadPage(1)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const apenasDigitos = /^[\d./-]+$/.test(termo)
      const resultado = apenasDigitos
        ? await searchEmpresaByCnpj(formatCNPJ(termo))
        : await searchEmpresasByNome(termo)
      setEmpresas(resultado)
      setLastPage(1)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este cliente?')) return
    try {
      await deleteEmpresa(id)
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
          <h1>Clientes</h1>
          {isAdmin && (
            <Link className="btn btn-primary" to="/clientes/novo">
              + Novo Cliente
            </Link>
          )}
        </div>

        <form className="page-content__toolbar" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Buscar por nome ou CNPJ..."
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
        ) : empresas.length === 0 ? (
          <p className="empty-state">Nenhum cliente encontrado.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome Fantasia</th>
                <th>CNPJ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>
                    <Link to={`/clientes/${empresa.id}`}>{empresa.nome_fantasia}</Link>
                  </td>
                  <td>{empresa.cnpj}</td>
                  <td>
                    {isAdmin && (
                      <button className="btn btn-danger" onClick={() => handleDelete(empresa.id)}>
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
