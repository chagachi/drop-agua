import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header'
import { createPlaca } from '../../services/placas'

export function PlacaCreate() {
  const navigate = useNavigate()
  const [placa, setPlaca] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createPlaca(placa.toUpperCase())
      navigate('/placas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar placa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>Nova Placa</h1>
        {error && <p className="login-form__error">{error}</p>}
        <form className="record-form" onSubmit={handleSubmit}>
          <label>
            Placa
            <input value={placa} onChange={(e) => setPlaca(e.target.value)} required />
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
