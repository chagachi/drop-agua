// Conversões entre o horário local (Brasília, no navegador do usuário) e o UTC
// gravado no banco. Nunca usar `new Date('AAAA-MM-DD')` (é lido como UTC) nem
// `toISOString().slice(...)` para preencher inputs (mostra a hora UTC como local).

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Data local no formato de `<input type="date">` (AAAA-MM-DD). */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Timestamp do banco (UTC) no formato de `<input type="datetime-local">`, em horário local. */
export function toDateTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Início do dia local (00:00:00.000) em ISO/UTC, para filtros por período. */
export function startOfDayISO(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString()
}

/** Fim do dia local (23:59:59.999) em ISO/UTC, para filtros por período. */
export function endOfDayISO(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}
