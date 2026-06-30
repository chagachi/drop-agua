import { useEffect, useState } from 'react'
import { Header } from '../../components/Header'
import { useAuth } from '../../auth/useAuth'
import { listProfiles, updateProfile } from '../../services/profiles'
import { formatDate } from '../../utils/format'
import type { Profile } from '../../types/database'

export function UsuariosList() {
  const { session } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    listProfiles()
      .then(setProfiles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function toggle(profile: Profile, field: 'is_admin' | 'is_active') {
    const isSelf = profile.id === session?.user.id
    if (isSelf && field === 'is_admin' && profile.is_admin) {
      window.alert('Você não pode remover sua própria permissão de administrador.')
      return
    }
    if (isSelf && field === 'is_active' && profile.is_active) {
      window.alert('Você não pode desativar a própria conta.')
      return
    }

    setSavingId(profile.id)
    setError(null)
    try {
      const updated = await updateProfile(profile.id, { [field]: !profile[field] })
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? updated : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <div className="page-content__toolbar">
          <h1>Usuários</h1>
        </div>
        <p className="empty-state" style={{ padding: 0, marginBottom: '1rem', textAlign: 'left' }}>
          Pra criar um usuário novo, use o painel do Supabase (Authentication → Add user). Aqui você
          só promove/despromove admin e ativa/desativa contas já existentes.
        </p>

        {error && <p className="login-form__error">{error}</p>}

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Criado em</th>
                <th>Admin</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.email}
                    {p.id === session?.user.id && ' (você)'}
                  </td>
                  <td>{formatDate(p.created_at)}</td>
                  <td>
                    <button
                      className={`btn ${p.is_admin ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={savingId === p.id}
                      onClick={() => toggle(p, 'is_admin')}
                    >
                      {p.is_admin ? 'Admin' : 'Comum'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`btn ${p.is_active ? 'btn-primary' : 'btn-danger'}`}
                      disabled={savingId === p.id}
                      onClick={() => toggle(p, 'is_active')}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
