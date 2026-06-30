import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPedido } from '../../services/pedidos'
import { formatDateTime } from '../../utils/format'
import type { Pedido } from '../../types/database'
import './ImpressaoTicket.css'

function Copia({ pedido, via }: { pedido: Pedido; via: string }) {
  return (
    <div className="ticket">
      <div className="ticket__header">
        <strong>Drop Água</strong>
        <span>{via}</span>
      </div>
      <div className="ticket__row">
        <span>
          Vale Nº <strong>{pedido.id}</strong>
        </span>
        <span>{formatDateTime(pedido.created_at)}</span>
      </div>
      {pedido.retirada && <div className="ticket__retirada">RETIRADA</div>}
      <div className="ticket__field">
        <label>Cliente</label>
        <span>{pedido.empresa_nome}</span>
      </div>
      <div className="ticket__field">
        <label>CNPJ</label>
        <span>{pedido.cnpj}</span>
      </div>
      <div className="ticket__field">
        <label>Local de Entrega</label>
        <span>{pedido.local_entrega}</span>
      </div>
      <div className="ticket__grid">
        <div className="ticket__field">
          <label>Entrada</label>
          <span>&nbsp;</span>
        </div>
        <div className="ticket__field">
          <label>Saída</label>
          <span>&nbsp;</span>
        </div>
      </div>
      <div className="ticket__field">
        <label>Quantidade (m³)</label>
        <span>{pedido.quantidade_carga}</span>
      </div>
      <div className="ticket__grid">
        <div className="ticket__field">
          <label>Motorista</label>
          <span>{pedido.motorista_nome}</span>
        </div>
        <div className="ticket__field">
          <label>Placa</label>
          <span>{pedido.placa}</span>
        </div>
      </div>
      <div className="ticket__field">
        <label>Observação</label>
        <span>{pedido.observacao}</span>
      </div>
      <div className="ticket__signature">Assinatura: ____________________________</div>
    </div>
  )
}

export function ImpressaoTicket() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getPedido(Number(id))
      .then(setPedido)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar vale.'))
  }, [id])

  useEffect(() => {
    if (!pedido) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [pedido])

  useEffect(() => {
    function handleAfterPrint() {
      navigate('/vales')
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [navigate])

  if (error) return <div className="page-content">{error}</div>
  if (!pedido) return <div className="page-content">Carregando...</div>

  return (
    <div className="ticket-page">
      <Copia pedido={pedido} via="Via Cliente" />
      <Copia pedido={pedido} via="Via Empresa" />
      <div className="ticket-page__actions no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/vales')}>
          Voltar
        </button>
      </div>
    </div>
  )
}
