import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { createMotorista } from '../../services/motoristas'

export function MotoristaCreate() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [celular, setCelular] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createMotorista({ nome, telefone, celular, is_active: true })
      navigate('/motoristas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar motorista.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>Novo Motorista</h1>
        {error && <p className="login-form__error">{error}</p>}
        <form className="record-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label>
            Telefone
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </label>
          <label>
            Celular
            <input value={celular} onChange={(e) => setCelular(e.target.value)} />
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
