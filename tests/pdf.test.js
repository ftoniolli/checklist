import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildReport } from '../src/models/report.js'
import { defaultCategories, defaultTemplates } from '../src/models/seed.js'
import { renderPdf } from '../src/services/pdf.js'

const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0))

describe('PDF', () => {
  it('gera um documento com texto em português e ao menos uma página', async () => {
    const templates = defaultTemplates()
    const template = templates.find((item) => item.id === 'tpl-geral')
    const answers = Object.fromEntries(template.sections.flatMap((section) => section.items.map((item) => [item.id, { state: 'conforme' }])))
    answers['sec-instalacao-4'] = {
      state: 'nao_conforme',
      note: 'Conector oxidado na entrada do chicote. A inspeção não inventou medição de satélite.',
      severity: 'alta',
      recommendedAction: 'Substituir o conector e refazer a vedação.',
      correctionOwner: 'Oficina da fazenda',
      dueDate: '2026-07-01',
      correctionStatus: 'aberta'
    }
    const report = buildReport({
      organizationName: 'ASCAD Agrotecnologia',
      propertyName: 'Propriedade informada no relatório',
      workTitle: 'Inspeção de validação',
      date: '2026-06-02',
      responsibles: 'Equipe de campo',
      technicalResponsible: 'Responsável técnico',
      conclusion: 'A máquina não pode ser aprovada enquanto a não conformidade estiver aberta.'
    }, {
      categories: defaultCategories(),
      machines: [{
        id: 'maq-1',
        name: 'Trator Norte',
        identifier: 'TR-001',
        categoryId: 'cat-trator',
        situation: 'em_operacao',
        manufacturer: 'Fabricante',
        model: 'Modelo X',
        serialNumber: 'SN-10'
      }],
      components: [{ id: 'c1', machineId: 'maq-1', name: 'Antena GNSS', categoryId: 'cat-antena', serialNumber: 'ANT-1', firmware: '2.0' }],
      templates,
      inspections: [{
        id: 'ins-1',
        scope: 'maquina',
        targetId: 'maq-1',
        machineId: 'maq-1',
        templateId: 'tpl-geral',
        status: 'concluida',
        date: '2026-06-02',
        responsible: 'Técnico',
        createdAt: '2026-06-02T10:00:00.000Z',
        answers
      }],
      tests: [{
        id: 't1',
        machineId: 'maq-1',
        datetime: '2026-06-02T11:00:00.000Z',
        objective: 'Comunicação do monitor',
        result: 'reprovado',
        failures: 'Sem resposta do módulo',
        pending: 'Revisar chicote',
        conclusion: 'Não liberar'
      }],
      photos: [{
        id: 'f1',
        machineId: 'maq-1',
        componentId: 'c1',
        description: 'Antena no teto',
        capturedAt: '2026-06-02T12:00:00.000Z',
        mimeType: 'image/png',
        blob: new Blob([png], { type: 'image/png' })
      }]
    })
    report.machines[0].components[0].categoryName = 'Antena GNSS'
    report.machines[0].photos[0].componentName = 'Antena GNSS'

    expect(report.machines[0].verdict.classification).toBe('Não aprovada')
    const bytes = await renderPdf(report)
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe('%PDF-')
    const document = await PDFDocument.load(bytes)
    expect(document.getPageCount()).toBeGreaterThan(0)
    expect(document.getPageCount()).toBeLessThan(6)
  })
})
