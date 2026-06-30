import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './Header.css'

export function Header() {
  const { isAdmin } = useAuth()

  return (
    <header className="app-header">
      <div className="app-header__brand">Drop Água</div>
      <nav className="app-header__nav">
        <Link to="/dashboard">Início</Link>
        <Link to="/clientes">Clientes</Link>
        <Link to="/vales">Vales</Link>
        <Link to="/motoristas">Motoristas</Link>
        <Link to="/placas">Placas</Link>
        {isAdmin && <Link to="/relatorios">Relatórios</Link>}
        <Link to="/logout">Sair</Link>
      </nav>
    </header>
  )
}
