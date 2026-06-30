// Extrai linhas de INSERT de um dump phpMyAdmin/mysqldump para as tabelas
// cadastroempresas, funcionarios e placas, sem precisar de um servidor MySQL.
// Parser tolerante ao formato de dump padrão (strings entre aspas simples,
// escapes \' e \\, NULL e números sem aspas, incluindo ';' e '(' ')' dentro
// de strings — não usa regex para achar o fim do statement, varre caractere
// a caractere respeitando o estado "dentro de string".

function parseValueTuple(tuple) {
  const values = []
  let i = 0
  while (i < tuple.length) {
    while (tuple[i] === ' ' || tuple[i] === '\n' || tuple[i] === '\r') i++
    if (tuple[i] === undefined) break

    if (tuple[i] === "'") {
      i++
      let str = ''
      while (i < tuple.length && tuple[i] !== "'") {
        if (tuple[i] === '\\' && i + 1 < tuple.length) {
          const next = tuple[i + 1]
          if (next === 'n') str += '\n'
          else if (next === 'r') str += '\r'
          else if (next === 't') str += '\t'
          else str += next
          i += 2
        } else {
          str += tuple[i]
          i++
        }
      }
      i++ // closing quote
      values.push(str)
    } else if (tuple.slice(i, i + 4) === 'NULL') {
      values.push(null)
      i += 4
    } else {
      let num = ''
      while (i < tuple.length && tuple[i] !== ',') {
        num += tuple[i]
        i++
      }
      values.push(num.trim())
    }

    while (tuple[i] === ' ') i++
    if (tuple[i] === ',') i++
  }
  return values
}

// Varre a partir de `start` (logo após "VALUES") e retorna { rows, endIndex }
// onde endIndex é a posição do ';' que termina o statement (profundidade 0,
// fora de string).
function parseValuesSection(text, start) {
  const rows = []
  let depth = 0
  let current = ''
  let inString = false
  let i = start

  for (; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      current += ch
      if (ch === '\\') {
        i++
        current += text[i]
        continue
      }
      if (ch === "'") inString = false
      continue
    }

    if (ch === "'") {
      inString = true
      current += ch
      continue
    }

    if (ch === '(') {
      depth++
      if (depth === 1) {
        current = ''
        continue
      }
    }
    if (ch === ')') {
      depth--
      if (depth === 0) {
        rows.push(parseValueTuple(current))
        continue
      }
    }
    if (ch === ';' && depth === 0) {
      return { rows, endIndex: i }
    }
    if (depth > 0) current += ch
  }

  return { rows, endIndex: i }
}

export function extractTable(sqlText, tableName) {
  const marker = `INSERT INTO \`${tableName}\` (`
  let columns = null
  const allRows = []
  let searchFrom = 0

  while (true) {
    const markerIndex = sqlText.indexOf(marker, searchFrom)
    if (markerIndex === -1) break

    const colListStart = markerIndex + marker.length
    const colListEnd = sqlText.indexOf(')', colListStart)
    if (!columns) {
      columns = sqlText
        .slice(colListStart, colListEnd)
        .split(',')
        .map((c) => c.trim().replace(/`/g, ''))
    }

    const valuesKeywordIndex = sqlText.indexOf('VALUES', colListEnd)
    const { rows, endIndex } = parseValuesSection(sqlText, valuesKeywordIndex + 'VALUES'.length)

    for (const row of rows) {
      const obj = {}
      columns.forEach((col, idx) => (obj[col] = row[idx]))
      allRows.push(obj)
    }

    searchFrom = endIndex + 1
  }

  return allRows
}
