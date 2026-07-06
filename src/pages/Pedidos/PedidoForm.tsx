import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { searchEmpresasByNome } from '../../services/empresas'
import { listMotoristasForSelect } from '../../services/motoristas'
import { listPlacasForSelect } from '../../services/placas'
import { createPedido, getPedido, updatePedido } from '../../services/pedidos'
import { formatCurrency } from '../../utils/format'
import { calcTotalLiquido } from '../../utils/calc'
import type { Empresa, Motorista, Placa } from '../../types/database'

export function PedidoForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { session, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [placas, setPlacas] = useState<Placa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Empresa combobox
  const [empresaQuery, setEmpresaQuery] = useState('')
  const [empresaSuggestions, setEmpresaSuggestions] = useState<Empresa[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingEmpresas, setSearchingEmpresas] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Empresa selecionada
  const [empresaId, setEmpresaId] = useState<number | ''>('')
  const [empresaNome, setEmpresaNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [localEntrega, setLocalEntrega] = useState('')
  const [valorEntregaEmpresa, setValorEntregaEmpresa] = useState(0)
  const [valorRetiradaEmpresa, setValorRetiradaEmpresa] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [retirada, setRetirada] = useState(false)

  const [motoristaId, setMotoristaId] = useState<number | ''>('')
  const [motoristaNome, setMotoristaNome] = useState('')
  const [placa, setPlaca] = useState('')

  const [quantidadeCarga, setQuantidadeCarga] = useState(0)
  const [observacao, setObservacao] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  const valorUnitario = retirada ? valorRetiradaEmpresa : valorEntregaEmpresa
  const totalLiquido = calcTotalLiquido(quantidadeCarga, valorUnitario)

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

  useEffect(() => {
    Promise.all([listMotoristasForSelect(), listPlacasForSelect()])
      .then(([m, p]) => {
        setMotoristas(m)
        setPlacas(p)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dados.'))
      .finally(() => {
        if (!isEdit) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    getPedido(Number(id))
      .then((p) => {
        setEmpresaId(p.empresa_id)
        setEmpresaNome(p.empresa_nome)
        setEmpresaQuery(p.empresa_nome)
        setCnpj(p.cnpj ?? '')
        setLocalEntrega(p.local_entrega ?? '')
        setRetirada(p.retirada)
        setMotoristaId(p.motorista_id ?? '')
        setMotoristaNome(p.motorista_nome)
        setPlaca(p.placa)
        setQuantidadeCarga(p.quantidade_carga)
        setObservacao(p.observacao ?? '')
        setCreatedAt(p.created_at.slice(0, 16))
        setValorEntregaEmpresa(p.retirada ? 0 : p.valor_unitario)
        setValorRetiradaEmpresa(p.retirada ? p.valor_unitario : 0)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar pedido.'))
      .finally(() => setLoading(false))
  }, [isEdit, id])

  function handleEmpresaQueryChange(value: string) {
    setEmpresaQuery(value)
    // Se o usuário começou a digitar, limpa a seleção anterior
    if (empresaId) {
      setEmpresaId('')
      setEmpresaNome('')
      setCnpj('')
      setLocalEntrega('')
      setValorEntregaEmpresa(0)
      setValorRetiradaEmpresa(0)
    }
  }

  function handleEmpresaSelect(empresa: Empresa) {
    setEmpresaId(empresa.id)
    setEmpresaQuery(empresa.nome_fantasia)
    setEmpresaNome(empresa.nome_fantasia)
    setCnpj(empresa.cnpj ?? '')
    setLocalEntrega(empresa.endereco_entrega ?? '')
    setValorEntregaEmpresa(empresa.valor_entrega)
    setValorRetiradaEmpresa(empresa.valor_retirada)
    setMotoristaId('')
    setMotoristaNome('')
    setPlaca('')
    setShowSuggestions(false)

    if (empresa.valor_retirada > 0) {
      setShowModal(true)
    } else {
      setRetirada(false)
    }
  }

  function chooseEntrega() {
    setRetirada(false)
    setShowModal(false)
  }

  function chooseRetirada() {
    setRetirada(true)
    setShowModal(false)
  }

  function handleMotoristaChange(value: string) {
    const mid = Number(value)
    const motorista = motoristas.find((m) => m.id === mid)
    setMotoristaId(mid || '')
    setMotoristaNome(motorista?.nome ?? '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresaId) {
      setError('Selecione um cliente.')
      return
    }
    if (!retirada && !motoristaId) {
      setError('Selecione um motorista.')
      return
    }
    if (!retirada && !placa) {
      setError('Selecione uma placa.')
      return
    }
    if (retirada && !motoristaNome.trim()) {
      setError('Informe o nome de quem está retirando.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      empresa_id: Number(empresaId),
      empresa_nome: empresaNome,
      cnpj,
      motorista_id: retirada ? null : Number(motoristaId),
      motorista_nome: motoristaNome,
      placa,
      local_entrega: localEntrega,
      retirada,
      valor_unitario: valorUnitario,
      quantidade_carga: quantidadeCarga,
      total_liquido: totalLiquido,
      observacao,
      status: 0,
      created_by: session?.user.id ?? null,
      ...(isAdmin && isEdit && createdAt ? { created_at: new Date(createdAt).toISOString() } : {}),
    }

    try {
      if (isEdit && id) {
        await updatePedido(Number(id), payload)
        navigate(`/vales/${id}`)
      } else {
        const pedido = await createPedido(payload)
        navigate(`/impressao/${pedido.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pedido.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="page-content">Carregando...</div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <div className="page-content__toolbar">
          <h1>{isEdit ? `Vale Nº ${id}` : 'Novo Vale'}</h1>
          {isEdit && (
            <Link className="btn btn-secondary" to={`/impressao/${id}`}>
              Imprimir
            </Link>
          )}
        </div>
        {error && <p className="login-form__error">{error}</p>}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Entrega ou Retirada?</h2>
              <p>Este cliente também atende retirada. Escolha o tipo deste vale:</p>
              <div className="modal-box__actions">
                <button className="btn btn-primary" onClick={chooseEntrega}>
                  Entrega
                </button>
                <button className="btn btn-secondary" onClick={chooseRetirada}>
                  Retirada
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="record-form" onSubmit={handleSubmit}>
          <label className="span-2">
            Cliente
            <div className="empresa-combobox" ref={comboboxRef}>
              <input
                type="text"
                value={empresaQuery}
                onChange={(e) => handleEmpresaQueryChange(e.target.value)}
                onFocus={() => {
                  if (empresaSuggestions.length > 0) setShowSuggestions(true)
                }}
                placeholder="Digite o nome do cliente..."
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
            CNPJ
            <span className="field-readonly">{cnpj || '-'}</span>
          </label>
          <label>
            Tipo
            <span className="field-readonly">{retirada ? 'Retirada' : 'Entrega'}</span>
          </label>

          <label className="span-2">
            Local de Entrega
            <input value={localEntrega} onChange={(e) => setLocalEntrega(e.target.value)} />
          </label>

          {retirada ? (
            <>
              <label>
                Motorista (retirada)
                <input
                  value={motoristaNome}
                  onChange={(e) => setMotoristaNome(e.target.value)}
                  required
                />
              </label>
              <label>
                Placa
                <input value={placa} onChange={(e) => setPlaca(e.target.value)} required />
              </label>
            </>
          ) : (
            <>
              <label>
                Motorista
                <select
                  value={motoristaId}
                  onChange={(e) => handleMotoristaChange(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {motoristas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Placa
                <select value={placa} onChange={(e) => setPlaca(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {placas.map((p) => (
                    <option key={p.id} value={p.placa}>
                      {p.placa}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label>
            Quantidade de Carga (m³)
            <input
              type="number"
              step="0.001"
              value={quantidadeCarga}
              onChange={(e) => setQuantidadeCarga(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Valor Unitário
            <span className="field-readonly">{formatCurrency(valorUnitario)}</span>
          </label>

          <label className="span-2">
            Observação
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
          </label>

          {isAdmin && isEdit && (
            <label>
              Data do pedido (admin)
              <input
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
              />
            </label>
          )}

          <label>
            Total Líquido
            <span className="field-readonly">
              <strong>{formatCurrency(totalLiquido)}</strong>
            </span>
          </label>

          <div className="record-form__actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
