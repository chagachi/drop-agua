import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/useAuth'
import logo from '../../assets/logo.jpg'
import './Login.css'

export function Login() {
  const { session, loading, deactivated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (deactivated) setSubmitting(false)
  }, [deactivated])

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setSubmitting(false)
      setError('E-mail ou senha inválidos.')
      return
    }
    // continua "submitting" até a navegação reativa acontecer (ou a conta
    // ser detectada como desativada, ver useEffect acima)
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Drop Água" className="login-form__logo" />
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="login-form__error">{error}</p>}
        {deactivated && (
          <p className="login-form__error">
            Sua conta foi desativada. Fale com um administrador.
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
