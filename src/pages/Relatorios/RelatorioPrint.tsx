import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listPedidosByRange } from '../../services/pedidos'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Pedido } from '../../types/database'
import './RelatorioPrint.css'

export function RelatorioPrint() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startDate = searchParams.get('startDate') ?? ''
  const finalDate = searchParams.get('finalDate') ?? ''
  const empresaId = searchParams.get('empresaId')
  const motoristaId = searchParams.get('motoristaId')
  const retiradaOnly = searchParams.get('retirada') === '1'

  useEffect(() => {
    if (!startDate || !finalDate) return
    listPedidosByRange(
      new Date(startDate).toISOString(),
      new Date(`${finalDate}T23:59:59`).toISOString(),
      empresaId ? Number(empresaId) : undefined,
      motoristaId ? Number(motoristaId) : undefined
    )
      .then((data) => setPedidos(retiradaOnly ? data.filter((p) => p.retirada) : data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao gerar relatório.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pedidos) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [pedidos])

  useEffect(() => {
    function handleAfterPrint() {
      navigate('/relatorios')
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [navigate])

  if (error) return <div className="page-content">{error}</div>
  if (!pedidos) return <div className="page-content">Carregando...</div>

  const totalQuantidade = pedidos.reduce((sum, p) => sum + p.quantidade_carga, 0)
  const totalValor = pedidos.reduce((sum, p) => sum + p.total_liquido, 0)

  return (
    <div className="relatorio-print">
      <h1>Drop Água — Relatório de Vales</h1>
      <p>
        Período: {formatDate(startDate)} a {formatDate(finalDate)}
        {retiradaOnly && ' — Somente Retiradas'}
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Motorista</th>
            <th>Placa</th>
            <th>Qtd (m³)</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td>#{p.id}</td>
              <td>{formatDate(p.created_at)}</td>
              <td>{p.empresa_nome}</td>
              <td>{p.motorista_nome}</td>
              <td>{p.placa}</td>
              <td>{p.quantidade_carga}</td>
              <td>{formatCurrency(p.total_liquido)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="relatorio-print__totals">
        <span>Total de vales: {pedidos.length}</span>
        <span>Volume total: {totalQuantidade.toFixed(3)} m³</span>
        <span>Valor total: {formatCurrency(totalValor)}</span>
      </div>

      <div className="no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/relatorios')}>
          Voltar
        </button>
      </div>
    </div>
  )
}
