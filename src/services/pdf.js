import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { RESULT_LABEL, SEVERITY_LABEL, SITUATION_LABEL, STATE_LABEL, formatDay, formatWhen } from '../models/labels.js'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const BOTTOM = 64

export async function renderPdf(report) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const contentWidth = PAGE_WIDTH - MARGIN * 2
  const ink = rgb(0.08, 0.12, 0.09)
  const muted = rgb(0.28, 0.34, 0.29)
  const green = rgb(0.08, 0.32, 0.18)
  let page = null
  let y = 0

  const openPage = (continued) => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
    if (continued) {
      drawLine(safe(`Checklist - ${report.workTitle || 'Relatório técnico'}`), 10, bold, muted)
      y -= 6
    }
  }

  const room = () => y - BOTTOM

  const drawLine = (value, size, usedFont, color, x = MARGIN, width = contentWidth) => {
    const lines = wrap(value, usedFont, size, width)
    for (const line of lines) {
      if (room() < size + 6) openPage(true)
      if (line) page.drawText(line, { x, y: y - size, size, font: usedFont, color })
      y -= size + 4
    }
  }

  const gap = (amount = 10) => {
    y -= amount
  }

  const heading = (value, size = 16) => {
    if (room() < size + 18) openPage(true)
    drawLine(value, size, bold, green)
    gap(4)
  }

  const paragraph = (value) => {
    drawLine(value || '—', 11, font, ink)
    gap(6)
  }

  const table = (headers, rows, widths) => {
    const body = rows.length ? rows : [['Nenhum registro.', ...headers.slice(1).map(() => '')]]
    paintRow(headers, widths, true)
    for (const row of body) paintRow(row, widths, false)
    gap(8)
  }

  const paintRow = (cells, widths, header) => {
    const usedFont = header ? bold : font
    const wrapped = cells.map((cell, index) => wrap(cell, usedFont, 9, widths[index] - 8))
    const totalLines = Math.max(...wrapped.map((lines) => lines.length), 1)
    let offset = 0
    while (offset < totalLines) {
      const capacity = Math.max(1, Math.floor((room() - 8) / 12))
      const take = Math.min(capacity, totalLines - offset)
      const rowHeight = take * 12 + 8
      page.drawRectangle({
        x: MARGIN,
        y: y - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: header ? green : rgb(1, 1, 1),
        borderColor: header ? green : rgb(0.73, 0.78, 0.73),
        borderWidth: 0.4
      })
      let x = MARGIN
      wrapped.forEach((lines, index) => {
        lines.slice(offset, offset + take).forEach((line, lineIndex) => {
          if (!line) return
          page.drawText(line, {
            x: x + 4,
            y: y - 14 - lineIndex * 12,
            size: 9,
            font: usedFont,
            color: header ? rgb(1, 1, 1) : ink
          })
        })
        x += widths[index]
      })
      y -= rowHeight
      offset += take
      if (offset < totalLines) openPage(true)
    }
  }

  openPage(false)
  await drawLogo()
  heading('Relatório técnico', 20)
  paragraph(report.organizationName || 'ASCAD Agrotecnologia')
  table(['Campo', 'Registro'], [
    ['Propriedade', report.propertyName || 'Não informada'],
    ['Trabalho', report.workTitle || 'Não informado'],
    ['Data da inspeção', formatDay(report.date)],
    ['Responsáveis', report.responsibles || 'Não informados'],
    ['Responsável técnico', report.technicalResponsible || 'Não informado']
  ], [160, contentWidth - 160])

  if (!report.machines.length) paragraph('Nenhuma máquina encontrada para o filtro informado.')

  for (const machine of report.machines) {
    heading(machine.name)
    paragraph(`${machine.identifier || 'Sem identificador'} · ${machine.categoryName || 'Sem categoria'} · ${SITUATION_LABEL[machine.situation] || machine.situation || '—'}`)
    table(['Campo', 'Registro'], [
      ['Fabricante', machine.manufacturer],
      ['Modelo', machine.model],
      ['Ano', machine.year ? String(machine.year) : ''],
      ['Número de série', machine.serialNumber],
      ['Propriedade', machine.property],
      ['Setor ou talhão', machine.sector],
      ['Horímetro', machine.hourMeter == null ? '' : String(machine.hourMeter)],
      ['Responsável', machine.responsible],
      ['Observações', machine.notes]
    ].filter((row) => row[1] !== '' && row[1] != null), [160, contentWidth - 160])

    heading('Situação da inspeção', 13)
    paragraph(machine.verdict.classification)
    for (const reason of machine.verdict.reasons) paragraph(reason)

    heading('Componentes', 13)
    table(['Componente', 'Categoria', 'Série / firmware'], machine.components.map((component) => [
      component.name,
      component.categoryName || '',
      [component.serialNumber, component.firmware].filter(Boolean).join(' · ')
    ]), [190, 150, contentWidth - 340])

    heading('Checklists', 13)
    if (!machine.inspections.length) paragraph('Nenhum checklist no período.')
    for (const inspection of machine.inspections) {
      paragraph(`${inspection.templateName} · ${inspection.status === 'concluida' ? 'Concluída' : 'Em andamento'} · ${formatDay(inspection.date)} · ${inspection.responsible || 'Responsável não informado'}`)
      const items = inspection.summary?.items || []
      table(['Item', 'Estado', 'Observação'], items.map((item) => [
        item.label,
        STATE_LABEL[item.state] || item.state,
        detailOf(item)
      ]), [210, 100, contentWidth - 310])
    }

    heading('Testes operacionais', 13)
    table(['Data', 'Objetivo', 'Resultado'], machine.tests.map((test) => [
      formatWhen(test.datetime),
      test.objective,
      RESULT_LABEL[test.result] || test.result
    ]), [110, contentWidth - 250, 140])
    for (const test of machine.tests) {
      if (test.failures || test.pending || test.conclusion) {
        paragraph(`${test.objective}: ${[test.failures && `Falhas: ${test.failures}`, test.pending && `Pendências: ${test.pending}`, test.conclusion && `Conclusão: ${test.conclusion}`].filter(Boolean).join(' ')}`)
      }
    }

    heading('Não conformidades e recomendações', 13)
    table(['Item', 'Gravidade', 'Ação e correção'], machine.openNonconformities.map((item) => [
      item.label,
      SEVERITY_LABEL[item.severity] || item.severity || '—',
      [item.recommendedAction, item.correctionOwner, item.dueDate && `Prazo ${formatDay(item.dueDate)}`].filter(Boolean).join(' · ')
    ]), [180, 80, contentWidth - 260])

    heading('Fotografias', 13)
    if (!machine.photos.length) paragraph('Nenhuma fotografia no período.')
    for (const photo of machine.photos) {
      await drawPhoto(pdf, photo)
      paragraph([photo.description || 'Sem descrição', photo.componentName || 'Sem componente associado', formatWhen(photo.capturedAt)].join(' · '))
    }
  }

  heading('Conclusão')
  paragraph(report.conclusion || 'Sem conclusão registrada.')
  heading('Responsável técnico', 13)
  paragraph(report.technicalResponsible || 'Não informado')
  gap(18)
  if (room() < 24) openPage(true)
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + 220, y },
    thickness: 0.8,
    color: ink
  })
  gap(14)
  paragraph('Assinatura')

  const pages = pdf.getPages()
  pages.forEach((item, index) => {
    item.drawText(`Página ${index + 1} de ${pages.length}`, {
      x: MARGIN,
      y: 32,
      size: 9,
      font,
      color: muted
    })
    item.drawText('Checklist', {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize('Checklist', 9),
      y: 32,
      size: 9,
      font,
      color: muted
    })
  })

  return pdf.save()

  async function drawLogo() {
    if (!report.logoBytes) return
    try {
      const image = await pdf.embedPng(report.logoBytes)
      const width = 200
      const height = width * (image.height / image.width)
      y -= height
      page.drawImage(image, { x: (PAGE_WIDTH - width) / 2, y, width, height })
      gap(14)
    } catch {
      // o relatório segue sem a marca quando a imagem não puder ser lida
    }
  }

  async function drawPhoto(document, photo) {
    if (!photo.blob) {
      paragraph('Imagem indisponível para incorporação.')
      return
    }
    try {
      const bytes = new Uint8Array(await photo.blob.arrayBuffer())
      let image = null
      if (photo.mimeType?.includes('png') || isPng(bytes)) image = await document.embedPng(bytes)
      else if (photo.mimeType?.includes('jpeg') || photo.mimeType?.includes('jpg') || isJpeg(bytes)) image = await document.embedJpg(bytes)
      if (!image) {
        paragraph('A fotografia está em formato não incorporado ao PDF. Ela permanece no aplicativo e no backup.')
        return
      }
      const maxWidth = contentWidth
      const maxHeight = 240
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
      const width = image.width * scale
      const height = image.height * scale
      if (room() < height + 16) openPage(true)
      y -= height
      page.drawImage(image, { x: MARGIN, y, width, height })
      gap(8)
    } catch {
      paragraph('A fotografia não pôde ser incorporada ao PDF. Ela permanece armazenada no aplicativo.')
    }
  }
}

function detailOf(item) {
  return [
    item.note,
    item.recommendedAction && `Ação: ${item.recommendedAction}`,
    item.correctionOwner && `Responsável: ${item.correctionOwner}`,
    item.dueDate && `Prazo: ${formatDay(item.dueDate)}`,
    item.correctionStatus && `Correção: ${item.correctionStatus}`
  ].filter(Boolean).join(' · ')
}

function wrap(value, font, size, maxWidth) {
  const paragraphs = safe(value).split('\n')
  const lines = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const pieces = breakWord(word, font, size, maxWidth)
      for (const piece of pieces) {
        const trial = line ? `${line} ${piece}` : piece
        if (font.widthOfTextAtSize(trial, size) <= maxWidth) line = trial
        else {
          if (line) lines.push(line)
          line = piece
        }
      }
    }
    if (line) lines.push(line)
  }
  return lines.length ? lines : ['']
}

function breakWord(word, font, size, maxWidth) {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word]
  const pieces = []
  let chunk = ''
  for (const character of word) {
    const trial = chunk + character
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) chunk = trial
    else {
      if (chunk) pieces.push(chunk)
      chunk = character
    }
  }
  if (chunk) pieces.push(chunk)
  return pieces
}

function safe(value) {
  return String(value ?? '—')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?')
}

function isPng(bytes) {
  return bytes.length > 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
}

function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216
}
