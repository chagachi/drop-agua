import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { listEmpresasForSelect } from '../../services/empresas'
import { listMotoristasForSelect } from '../../services/motoristas'
import { listPlacasForSelect } from '../../services/placas'
import { createPedido, getPedido, updatePedido } from '../../services/pedidos'
import { formatCurrency } from '../../utils/format'
import type { Empresa, Motorista, Placa } from '../../types/database'

export function PedidoForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { session, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [placas, setPlacas] = useState<Placa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const totalLiquido = quantidadeCarga * valorUnitario

  useEffect(() => {
    Promise.all([listEmpresasForSelect(), listMotoristasForSelect(), listPlacasForSelect()])
      .then(([e, m, p]) => {
        setEmpresas(e)
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

  function handleEmpresaChange(value: string) {
    const eid = Number(value)
    const empresa = empresas.find((e) => e.id === eid)
    setEmpresaId(eid || '')
    if (!empresa) return

    setEmpresaNome(empresa.nome_fantasia)
    setCnpj(empresa.cnpj ?? '')
    setLocalEntrega(empresa.endereco_entrega ?? '')
    setValorEntregaEmpresa(empresa.valor_entrega)
    setValorRetiradaEmpresa(empresa.valor_retirada)
    setMotoristaId('')
    setMotoristaNome('')
    setPlaca('')

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
        navigate(`/vales/${pedido.id}`)
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
        <h1>{isEdit ? `Vale Nº ${id}` : 'Novo Vale'}</h1>
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
            <select value={empresaId} onChange={(e) => handleEmpresaChange(e.target.value)} required>
              <option value="">Selecione...</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome_fantasia}
                </option>
              ))}
            </select>
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
