import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { getMotorista, updateMotorista } from '../../services/motoristas'
import { formatPhone } from '../../utils/format'

export function MotoristaDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [celular, setCelular] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getMotorista(Number(id))
      .then((m) => {
        setNome(m.nome)
        setTelefone(m.telefone ?? '')
        setCelular(m.celular ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar motorista.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)
    try {
      await updateMotorista(Number(id), { nome, telefone, celular })
      navigate('/motoristas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar motorista.')
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
        <h1>{isAdmin ? 'Editar Motorista' : nome}</h1>
        {error && <p className="login-form__error">{error}</p>}

        {isAdmin ? (
          <form className="record-form" onSubmit={handleSubmit}>
            <label>
              Nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>
            <label>
              Telefone
              <input
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                maxLength={15}
              />
            </label>
            <label>
              Celular
              <input
                value={celular}
                onChange={(e) => setCelular(formatPhone(e.target.value))}
                maxLength={15}
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
              Telefone
              <span className="field-readonly">{telefone}</span>
            </label>
            <label>
              Celular
              <span className="field-readonly">{celular}</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
