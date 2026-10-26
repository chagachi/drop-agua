import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { searchEmpresasByNome } from '../../services/empresas'
import { listMotoristasForSelect } from '../../services/motoristas'
import { listPedidosByRange, updatePedido } from '../../services/pedidos'
import { formatCurrency, formatDate } from '../../utils/format'
import { calcTotalLiquido, sumQuantidade, sumTotalLiquido } from '../../utils/calc'
import type { Empresa, Motorista, Pedido } from '../../types/database'
import './Relatorios.css'

type SortField = 'id' | 'created_at' | 'empresa_nome' | 'quantidade_carga' | 'total_liquido'
type SortDirection = 'asc' | 'desc'

interface EdicaoVale {
  id: number
  quantidadeStr: string
  totalStr: string
}

function parseValor(value: string): number {
  return Math.round((parseFloat(value.replace(',', '.')) || 0) * 100) / 100
}

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
  const { isAdmin } = useAuth()
  const [motoristas, setMotoristas] = useState<Motorista[]>([])

  const [startDate, setStartDate] = useState('')
  const [finalDate, setFinalDate] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [motoristaId, setMotoristaId] = useState('')
  const [somenteRetiradas, setSomenteRetiradas] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Empresa combobox
  const [empresaQuery, setEmpresaQuery] = useState('')
  const [empresaSuggestions, setEmpresaSuggestions] = useState<Empresa[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingEmpresas, setSearchingEmpresas] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Edição rápida de vale (somente admin): quantidade e total, com confirmação
  const [edicao, setEdicao] = useState<EdicaoVale | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  useEffect(() => {
    listMotoristasForSelect().then(setMotoristas).catch(() => setMotoristas([]))
  }, [])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Busca debounced de empresas ao digitar
  useEffect(() => {
    if (!empresaQuery.trim()) {
      setEmpresaSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchingEmpresas(true)
      try {
        const results = await searchEmpresasByNome(empresaQuery)
        setEmpresaSuggestions(results)
        setShowSuggestions(true)
      } catch {
        setEmpresaSuggestions([])
      } finally {
        setSearchingEmpresas(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [empresaQuery])

  function handleEmpresaQueryChange(value: string) {
    setEmpresaQuery(value)
    if (empresaId) {
      setEmpresaId('')
    }
  }

  function handleEmpresaSelect(empresa: Empresa) {
    setEmpresaId(String(empresa.id))
    setEmpresaQuery(empresa.nome_fantasia)
    setShowSuggestions(false)
  }

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
    cancelarEdicao()
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
    setEmpresaQuery('')
    setMotoristaId('')
    setSomenteRetiradas(false)
    setActivePreset(null)
    setPedidos([])
    setSearched(false)
    setError(null)
    cancelarEdicao()
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

  const totalQuantidade = sumQuantidade(resultadoFiltrado)
  const totalValor = sumTotalLiquido(resultadoFiltrado)
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

  const valeEmEdicao = edicao ? pedidos.find((p) => p.id === edicao.id) : undefined
  const novaQuantidade = edicao ? Number(edicao.quantidadeStr.replace(',', '.')) || 0 : 0
  const novoTotal = edicao ? parseValor(edicao.totalStr) : 0

  function iniciarEdicao(p: Pedido) {
    setEdicao({ id: p.id, quantidadeStr: String(p.quantidade_carga), totalStr: p.total_liquido.toFixed(2) })
    setErroEdicao(null)
  }

  function cancelarEdicao() {
    setEdicao(null)
    setConfirmando(false)
    setErroEdicao(null)
  }

  // Alterar a carga sempre recalcula o total; alterar o total não mexe na carga
  function handleEdicaoQuantidade(value: string) {
    if (!edicao || !valeEmEdicao) return
    const quantidade = Number(value.replace(',', '.')) || 0
    setEdicao({
      ...edicao,
      quantidadeStr: value,
      totalStr: calcTotalLiquido(quantidade, valeEmEdicao.valor_unitario).toFixed(2),
    })
  }

  function pedirConfirmacao() {
    if (!edicao || !valeEmEdicao) return
    if (novaQuantidade <= 0) {
      setErroEdicao('Informe uma quantidade maior que zero.')
      return
    }
    if (novaQuantidade === valeEmEdicao.quantidade_carga && novoTotal === valeEmEdicao.total_liquido) {
      cancelarEdicao()
      return
    }
    setErroEdicao(null)
    setConfirmando(true)
  }

  async function confirmarEdicao() {
    if (!edicao) return
    setSalvandoEdicao(true)
    try {
      const atualizado = await updatePedido(edicao.id, {
        quantidade_carga: novaQuantidade,
        total_liquido: novoTotal,
      })
      setPedidos((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)))
      cancelarEdicao()
    } catch (err) {
      setConfirmando(false)
      setErroEdicao(err instanceof Error ? err.message : 'Erro ao salvar o vale.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  function handleEdicaoKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      pedirConfirmacao()
    } else if (e.key === 'Escape') {
      cancelarEdicao()
    }
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
                <div className="empresa-combobox relatorios-empresa-combobox" ref={comboboxRef}>
                  <input
                    type="text"
                    value={empresaQuery}
                    onChange={(e) => handleEmpresaQueryChange(e.target.value)}
                    onFocus={() => {
                      if (empresaSuggestions.length > 0) setShowSuggestions(true)
                    }}
                    placeholder="Todos os clientes"
                    autoComplete="off"
                  />
                  {searchingEmpresas && (
                    <div className="empresa-combobox__suggestions">
                      <div className="empresa-combobox__empty">Buscando...</div>
                    </div>
                  )}
                  {!searchingEmpresas && showSuggestions && empresaSuggestions.length === 0 && empresaQuery.trim() && (
                    <div className="empresa-combobox__suggestions">
                      <div className="empresa-combobox__empty">Nenhum cliente encontrado.</div>
                    </div>
                  )}
                  {!searchingEmpresas && showSuggestions && empresaSuggestions.length > 0 && (
                    <ul className="empresa-combobox__suggestions">
                      {empresaSuggestions.map((e) => (
                        <li
                          key={e.id}
                          className="empresa-combobox__option"
                          onMouseDown={() => handleEmpresaSelect(e)}
                        >
                          {e.nome_fantasia}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
                        {isAdmin && <th className="relatorios-acoes">Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoFiltrado.map((p) => {
                        const editando = edicao?.id === p.id
                        return (
                          <tr key={p.id} className={editando ? 'relatorios-row--editando' : undefined}>
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
                            {editando && edicao ? (
                              <>
                                <td className="num">
                                  <input
                                    className="relatorios-edit-input"
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={edicao.quantidadeStr}
                                    onChange={(e) => handleEdicaoQuantidade(e.target.value)}
                                    onKeyDown={handleEdicaoKeyDown}
                                    aria-label="Quantidade (m³)"
                                    autoFocus
                                  />
                                </td>
                                <td className="num">
                                  <input
                                    className="relatorios-edit-input"
                                    type="text"
                                    inputMode="decimal"
                                    value={edicao.totalStr}
                                    onChange={(e) => setEdicao({ ...edicao, totalStr: e.target.value })}
                                    onBlur={() => setEdicao({ ...edicao, totalStr: parseValor(edicao.totalStr).toFixed(2) })}
                                    onKeyDown={handleEdicaoKeyDown}
                                    aria-label="Total"
                                  />
                                  {erroEdicao && <span className="relatorios-edit-erro">{erroEdicao}</span>}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="num">{p.quantidade_carga}</td>
                                <td className="num">{formatCurrency(p.total_liquido)}</td>
                              </>
                            )}
                            <td>{p.observacao}</td>
                            {isAdmin && (
                              <td className="relatorios-acoes">
                                {editando ? (
                                  <>
                                    <button className="btn btn-primary btn-sm" type="button" onClick={pedirConfirmacao}>
                                      Salvar
                                    </button>
                                    <button className="btn btn-secondary btn-sm" type="button" onClick={cancelarEdicao}>
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    type="button"
                                    onClick={() => iniciarEdicao(p)}
                                    disabled={edicao !== null}
                                  >
                                    Editar
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {confirmando && edicao && valeEmEdicao && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Confirmar alteração?</h2>
              <p>
                Vale Nº {valeEmEdicao.id} — {valeEmEdicao.empresa_nome}
              </p>
              <table className="relatorios-confirm-table">
                <tbody>
                  <tr>
                    <th>Quantidade</th>
                    <td>{valeEmEdicao.quantidade_carga} m³</td>
                    <td>→</td>
                    <td>
                      <strong>{novaQuantidade} m³</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Total</th>
                    <td>{formatCurrency(valeEmEdicao.total_liquido)}</td>
                    <td>→</td>
                    <td>
                      <strong>{formatCurrency(novoTotal)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="modal-box__actions">
                <button className="btn btn-secondary" type="button" onClick={() => setConfirmando(false)} disabled={salvandoEdicao}>
                  Voltar
                </button>
                <button className="btn btn-primary" type="button" onClick={confirmarEdicao} disabled={salvandoEdicao}>
                  {salvandoEdicao ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
