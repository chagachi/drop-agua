import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { createEmpresa } from '../../services/empresas'
import { formatCNPJ, formatPhone } from '../../utils/format'
import type { Empresa } from '../../types/database'

type FormState = Omit<Empresa, 'id' | 'created_at' | 'updated_at'>

const initialState: FormState = {
  nome_fantasia: '',
  razao_social: '',
  cnpj: '',
  ie: '',
  endereco_cobranca: '',
  endereco_entrega: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  telefone1: '',
  telefone2: '',
  email: '',
  site: '',
  valor_entrega: 0,
  valor_retirada: 0,
}

export function ClienteCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createEmpresa(form)
      navigate('/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>Novo Cliente</h1>
        {error && <p className="login-form__error">{error}</p>}
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
            <input
              value={form.cnpj ?? ''}
              onChange={(e) => set('cnpj', formatCNPJ(e.target.value))}
              maxLength={18}
            />
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
              onChange={(e) => set('telefone1', formatPhone(e.target.value))}
              maxLength={15}
            />
          </label>
          <label>
            Celular
            <input
              value={form.telefone2 ?? ''}
              onChange={(e) => set('telefone2', formatPhone(e.target.value))}
              maxLength={15}
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
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
