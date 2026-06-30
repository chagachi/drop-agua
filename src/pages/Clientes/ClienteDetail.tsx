import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { getEmpresa, updateEmpresa } from '../../services/empresas'
import type { Empresa } from '../../types/database'

type FormState = Omit<Empresa, 'id' | 'created_at' | 'updated_at'>

export function ClienteDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getEmpresa(Number(id))
      .then((empresa) => {
        const { id: _id, created_at, updated_at, ...rest } = empresa
        setForm(rest)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar cliente.'))
      .finally(() => setLoading(false))
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id || !form) return
    setSaving(true)
    setError(null)
    try {
      await updateEmpresa(Number(id), form)
      navigate('/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente.')
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

  if (!form) {
    return (
      <div>
        <Header />
        <div className="page-content">{error ?? 'Cliente não encontrado.'}</div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>{isAdmin ? 'Editar Cliente' : form.nome_fantasia}</h1>
        {error && <p className="login-form__error">{error}</p>}

        {isAdmin ? (
          <form className="record-form" onSubmit={handleSubmit}>
            <label>
              Nome Fantasia
              <input
                value={form.nome_fantasia}
                onChange={(e) => set('nome_fantasia', e.target.value)}
                required
              />
            </label>
            <label>
              Razão Social
              <input
                value={form.razao_social ?? ''}
                onChange={(e) => set('razao_social', e.target.value)}
              />
            </label>
            <label>
              CNPJ
              <input value={form.cnpj ?? ''} onChange={(e) => set('cnpj', e.target.value)} />
            </label>
            <label>
              Inscrição Estadual
              <input value={form.ie ?? ''} onChange={(e) => set('ie', e.target.value)} />
            </label>
            <label>
              Endereço de Cobrança
              <input
                value={form.endereco_cobranca ?? ''}
                onChange={(e) => set('endereco_cobranca', e.target.value)}
              />
            </label>
            <label>
              Número
              <input value={form.numero ?? ''} onChange={(e) => set('numero', e.target.value)} />
            </label>
            <label>
              Endereço de Entrega
              <input
                value={form.endereco_entrega ?? ''}
                onChange={(e) => set('endereco_entrega', e.target.value)}
              />
            </label>
            <label>
              Bairro
              <input value={form.bairro ?? ''} onChange={(e) => set('bairro', e.target.value)} />
            </label>
            <label>
              Cidade
              <input value={form.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} />
            </label>
            <label>
              Estado
              <input
                value={form.estado ?? ''}
                maxLength={2}
                onChange={(e) => set('estado', e.target.value.toUpperCase())}
              />
            </label>
            <label>
              Telefone
              <input
                value={form.telefone1 ?? ''}
                onChange={(e) => set('telefone1', e.target.value)}
              />
            </label>
            <label>
              Celular
              <input
                value={form.telefone2 ?? ''}
                onChange={(e) => set('telefone2', e.target.value)}
              />
            </label>
            <label>
              E-mail
              <input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label>
              Valor Entrega
              <input
                type="number"
                step="0.01"
                value={form.valor_entrega}
                onChange={(e) => set('valor_entrega', Number(e.target.value))}
              />
            </label>
            <label>
              Valor Retirada
              <input
                type="number"
                step="0.01"
                value={form.valor_retirada}
                onChange={(e) => set('valor_retirada', Number(e.target.value))}
              />
            </label>
            <div className="record-form__actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="record-form">
            <label>
              Razão Social
              <span className="field-readonly">{form.razao_social}</span>
            </label>
            <label>
              CNPJ
              <span className="field-readonly">{form.cnpj}</span>
            </label>
            <label>
              Endereço de Entrega
              <span className="field-readonly">{form.endereco_entrega}</span>
            </label>
            <label>
              Cidade/Estado
              <span className="field-readonly">
                {form.cidade}/{form.estado}
              </span>
            </label>
            <label>
              Telefone
              <span className="field-readonly">{form.telefone1}</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
