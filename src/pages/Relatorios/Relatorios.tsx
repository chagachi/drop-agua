import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { listEmpresasForSelect } from '../../services/empresas'
import { listMotoristasForSelect } from '../../services/motoristas'
import { listPedidosByRange } from '../../services/pedidos'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Empresa, Motorista, Pedido } from '../../types/database'

export function Relatorios() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])

  const [startDate, setStartDate] = useState('')
  const [finalDate, setFinalDate] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [motoristaId, setMotoristaId] = useState('')
  const [somenteRetiradas, setSomenteRetiradas] = useState(false)

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    Promise.all([listEmpresasForSelect(), listMotoristasForSelect()]).then(([e, m]) => {
      setEmpresas(e)
      setMotoristas(m)
    })
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!startDate || !finalDate) {
      setError('Selecione o período.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resultado = await listPedidosByRange(
        new Date(startDate).toISOString(),
        new Date(`${finalDate}T23:59:59`).toISOString(),
        empresaId ? Number(empresaId) : undefined,
        motoristaId ? Number(motoristaId) : undefined
      )
      setPedidos(resultado)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    const params = new URLSearchParams({
      startDate,
      finalDate,
      ...(empresaId ? { empresaId } : {}),
      ...(motoristaId ? { motoristaId } : {}),
      ...(somenteRetiradas ? { retirada: '1' } : {}),
    })
    navigate(`/relatorios/imprimir?${params.toString()}`)
  }

  const resultadoFiltrado = somenteRetiradas ? pedidos.filter((p) => p.retirada) : pedidos
  const totalQuantidade = resultadoFiltrado.reduce((sum, p) => sum + p.quantidade_carga, 0)
  const totalValor = resultadoFiltrado.reduce((sum, p) => sum + p.total_liquido, 0)

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>Relatórios</h1>
        {error && <p className="login-form__error">{error}</p>}

        <form className="record-form" onSubmit={handleSearch}>
          <label>
            De
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Até
            <input type="date" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} required />
          </label>
          <label>
            Cliente
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="">Todos</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome_fantasia}
                </option>
              ))}
            </select>
          </label>
          <label>
            Motorista
            <select value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)}>
              <option value="">Todos</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={somenteRetiradas}
              onChange={(e) => setSomenteRetiradas(e.target.checked)}
            />
            {' '}Somente Retiradas
          </label>
          <div className="record-form__actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            {searched && (
              <button className="btn btn-secondary" type="button" onClick={handlePrint}>
                Imprimir
              </button>
            )}
          </div>
        </form>

        {searched && (
          <>
            {resultadoFiltrado.length === 0 ? (
              <p className="empty-state">Nenhum vale encontrado no período.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Motorista</th>
                    <th>Qtd (m³)</th>
                    <th>Total</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoFiltrado.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{formatDate(p.created_at)}</td>
                      <td>{p.empresa_nome}</td>
                      <td>{p.motorista_nome}</td>
                      <td>{p.quantidade_carga}</td>
                      <td>{formatCurrency(p.total_liquido)}</td>
                      <td>{p.observacao}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>
                      <strong>Total ({resultadoFiltrado.length} vales)</strong>
                    </td>
                    <td>
                      <strong>{totalQuantidade.toFixed(3)}</strong>
                    </td>
                    <td colSpan={2}>
                      <strong>{formatCurrency(totalValor)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
