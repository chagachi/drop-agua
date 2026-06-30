import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { listEmpresasForSelect } from '../../services/empresas'
import { listMotoristasForSelect } from '../../services/motoristas'
import { listPedidosByRange } from '../../services/pedidos'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Empresa, Motorista, Pedido } from '../../types/database'
import './Relatorios.css'

type SortField = 'id' | 'created_at' | 'empresa_nome' | 'quantidade_carga' | 'total_liquido'
type SortDirection = 'asc' | 'desc'

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  {
    label: 'Hoje',
    range: () => {
      const today = toDateInput(new Date())
      return { startDate: today, finalDate: today }
    },
  },
  {
    label: 'Últimos 7 dias',
    range: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { startDate: toDateInput(start), finalDate: toDateInput(end) }
    },
  },
  {
    label: 'Este mês',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: toDateInput(start), finalDate: toDateInput(now) }
    },
  },
  {
    label: 'Mês passado',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: toDateInput(start), finalDate: toDateInput(end) }
    },
  },
]

export function Relatorios() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])

  const [startDate, setStartDate] = useState('')
  const [finalDate, setFinalDate] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [motoristaId, setMotoristaId] = useState('')
  const [somenteRetiradas, setSomenteRetiradas] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    Promise.all([listEmpresasForSelect(), listMotoristasForSelect()]).then(([e, m]) => {
      setEmpresas(e)
      setMotoristas(m)
    })
  }, [])

  function applyPreset(label: string, range: () => { startDate: string; finalDate: string }) {
    const { startDate: s, finalDate: f } = range()
    setStartDate(s)
    setFinalDate(f)
    setActivePreset(label)
  }

  async function runSearch() {
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

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    await runSearch()
  }

  function handleClear() {
    setStartDate('')
    setFinalDate('')
    setEmpresaId('')
    setMotoristaId('')
    setSomenteRetiradas(false)
    setActivePreset(null)
    setPedidos([])
    setSearched(false)
    setError(null)
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

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const resultadoFiltrado = useMemo(() => {
    const base = somenteRetiradas ? pedidos.filter((p) => p.retirada) : pedidos
    const sorted = [...base].sort((a, b) => {
      const va = a[sortField]
      const vb = b[sortField]
      const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : Number(va) - Number(vb)
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [pedidos, somenteRetiradas, sortField, sortDirection])

  const totalQuantidade = resultadoFiltrado.reduce((sum, p) => sum + p.quantidade_carga, 0)
  const totalValor = resultadoFiltrado.reduce((sum, p) => sum + p.total_liquido, 0)
  const totalEntregas = resultadoFiltrado.filter((p) => !p.retirada).length
  const totalRetiradas = resultadoFiltrado.filter((p) => p.retirada).length

  function handleExportCsv() {
    const header = ['Nº', 'Data', 'Cliente', 'CNPJ', 'Motorista', 'Placa', 'Tipo', 'Qtd (m³)', 'Total']
    const lines = resultadoFiltrado.map((p) =>
      [
        p.id,
        formatDate(p.created_at),
        p.empresa_nome,
        p.cnpj ?? '',
        p.motorista_nome,
        p.placa,
        p.retirada ? 'Retirada' : 'Entrega',
        p.quantidade_carga,
        p.total_liquido.toFixed(2).replace('.', ','),
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(';')
    )
    const csv = '﻿' + [header.join(';'), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-drop-agua-${startDate}-a-${finalDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function sortArrow(field: SortField) {
    if (field !== sortField) return null
    return <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <div className="page-content__toolbar">
          <h1>Relatórios</h1>
        </div>

        <div className="relatorios-filters">
          <div className="relatorios-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`relatorios-preset ${activePreset === preset.label ? 'active' : ''}`}
                onClick={() => applyPreset(preset.label, preset.range)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch}>
            <div className="relatorios-filters__row">
              <label>
                De
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setActivePreset(null)
                  }}
                  required
                />
              </label>
              <label>
                Até
                <input
                  type="date"
                  value={finalDate}
                  onChange={(e) => {
                    setFinalDate(e.target.value)
                    setActivePreset(null)
                  }}
                  required
                />
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
              <label className="relatorios-filters__checkbox">
                <input
                  type="checkbox"
                  checked={somenteRetiradas}
                  onChange={(e) => setSomenteRetiradas(e.target.checked)}
                />
                Somente Retiradas
              </label>

              <div className="relatorios-filters__actions">
                <button className="btn btn-secondary" type="button" onClick={handleClear}>
                  Limpar
                </button>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && <p className="login-form__error">{error}</p>}

        {!searched && !loading && (
          <p className="relatorios-hint">Escolha um período e clique em Buscar para gerar o relatório.</p>
        )}

        {searched && (
          <>
            {resultadoFiltrado.length === 0 ? (
              <p className="empty-state">Nenhum vale encontrado no período.</p>
            ) : (
              <>
                <div className="relatorios-summary">
                  <div className="relatorios-summary__card">
                    <span className="relatorios-summary__label">Total de vales</span>
                    <span className="relatorios-summary__value">{resultadoFiltrado.length}</span>
                  </div>
                  <div className="relatorios-summary__card">
                    <span className="relatorios-summary__label">Entrega / Retirada</span>
                    <span className="relatorios-summary__value relatorios-summary__value--split">
                      {totalEntregas} / {totalRetiradas}
                    </span>
                  </div>
                  <div className="relatorios-summary__card">
                    <span className="relatorios-summary__label">Volume total</span>
                    <span className="relatorios-summary__value">{totalQuantidade.toFixed(3)} m³</span>
                  </div>
                  <div className="relatorios-summary__card">
                    <span className="relatorios-summary__label">Valor total</span>
                    <span className="relatorios-summary__value">{formatCurrency(totalValor)}</span>
                  </div>
                </div>

                <div className="page-content__toolbar">
                  <span />
                  <div className="relatorios-filters__actions">
                    <button className="btn btn-secondary" type="button" onClick={handleExportCsv}>
                      Exportar CSV
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handlePrint}>
                      Imprimir
                    </button>
                  </div>
                </div>

                <div className="relatorios-table-wrap">
                  <table className="data-table relatorios-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => toggleSort('id')}>
                          Nº{sortArrow('id')}
                        </th>
                        <th className="sortable" onClick={() => toggleSort('created_at')}>
                          Data{sortArrow('created_at')}
                        </th>
                        <th className="sortable" onClick={() => toggleSort('empresa_nome')}>
                          Cliente{sortArrow('empresa_nome')}
                        </th>
                        <th>Motorista</th>
                        <th>Tipo</th>
                        <th className="num sortable" onClick={() => toggleSort('quantidade_carga')}>
                          Qtd (m³){sortArrow('quantidade_carga')}
                        </th>
                        <th className="num sortable" onClick={() => toggleSort('total_liquido')}>
                          Total{sortArrow('total_liquido')}
                        </th>
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
                          <td>
                            <span
                              className={`relatorios-badge ${p.retirada ? 'relatorios-badge--retirada' : 'relatorios-badge--entrega'}`}
                            >
                              {p.retirada ? 'Retirada' : 'Entrega'}
                            </span>
                          </td>
                          <td className="num">{p.quantidade_carga}</td>
                          <td className="num">{formatCurrency(p.total_liquido)}</td>
                          <td>{p.observacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
