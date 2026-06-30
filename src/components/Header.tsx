import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import logo from '../assets/logo.jpg'
import './Header.css'

export function Header() {
  const { isAdmin } = useAuth()

  return (
    <header className="app-header">
      <Link to="/dashboard" className="app-header__brand">
        <img src={logo} alt="Drop Água" />
      </Link>
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
