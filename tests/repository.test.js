import { afterEach, describe, expect, it } from 'vitest'
import { createRepository, openDatabase } from '../src/services/database.js'

let db

async function repository() {
  db = await openDatabase('checklist-test')
  const repo = createRepository(db)
  await repo.ensureSeed()
  return repo
}

afterEach(async () => {
  if (db) db.close()
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('checklist-test')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
  db = undefined
})

describe('persistência', () => {
  it('cadastra, edita e arquiva máquina sem perder o número de série', async () => {
    const repo = await repository()
    const created = await repo.saveMachine({ name: 'Trator 01', categoryId: 'cat-trator', serialNumber: 'SN-10' })
    expect(created.identifier).toBe('TR-001')
    const edited = await repo.saveMachine({ ...created, name: 'Trator 01 Norte', hourMeter: 1200 })
    expect(edited.name).toBe('Trator 01 Norte')
    expect(edited.serialNumber).toBe('SN-10')
    await repo.archiveMachine(created.id)
    expect(await repo.listMachines()).toHaveLength(0)
    expect(await repo.listMachines({ includeArchived: true })).toHaveLength(1)
  })

  it('cadastra componente personalizado na máquina escolhida', async () => {
    const repo = await repository()
    const machine = await repo.saveMachine({ name: 'Trator 02', categoryId: 'cat-trator' })
    const category = await repo.saveCategory({ name: 'Modem de correção', kind: 'componente' })
    const component = await repo.saveComponent({
      name: 'Modem principal',
      categoryId: category.id,
      machineId: machine.id,
      firmware: '1.2.3'
    })
    const stored = await repo.listComponents(machine.id)
    expect(stored.map((item) => item.id)).toContain(component.id)
    expect(stored[0].firmware).toBe('1.2.3')
  })

  it('mantém a inspeção na plantadeira quando ela muda de trator', async () => {
    const repo = await repository()
    const tractorA = await repo.saveMachine({ name: 'Trator A', categoryId: 'cat-trator' })
    const tractorB = await repo.saveMachine({ name: 'Trator B', categoryId: 'cat-trator' })
    const planter = await repo.saveMachine({ name: 'Plantadeira A', categoryId: 'cat-plantadeira', serialNumber: 'PL-77' })
    await repo.changeAssociation({ tractorId: tractorA.id, implementId: planter.id })
    const inspection = await repo.startInspection({
      scope: 'maquina',
      targetId: planter.id,
      machineId: planter.id,
      templateId: 'tpl-plantadeira',
      responsible: 'Técnico'
    })
    await repo.updateAnswer(inspection.id, 'sec-plantadeira-1', { state: 'conforme', note: 'Plaqueta legível' })
    await repo.changeAssociation({ tractorId: tractorB.id, implementId: planter.id })
    const stored = await repo.getInspection(inspection.id)
    const history = await repo.listAssociations()
    expect(stored.targetId).toBe(planter.id)
    expect(stored.answers['sec-plantadeira-1'].note).toBe('Plaqueta legível')
    expect(history).toHaveLength(2)
    expect(history.filter((item) => item.endedAt === null)).toHaveLength(1)
    expect(history.find((item) => item.endedAt === null).tractorId).toBe(tractorB.id)
  })

  it('restaura os quatro estados do checklist depois de reabrir o banco', async () => {
    const repo = await repository()
    const machine = await repo.saveMachine({ name: 'Pulverizador 01', categoryId: 'cat-pulverizador' })
    const inspection = await repo.startInspection({
      scope: 'maquina',
      targetId: machine.id,
      machineId: machine.id,
      templateId: 'tpl-pulverizador',
      responsible: 'Técnico'
    })
    await repo.updateAnswer(inspection.id, 'sec-pulverizador-1', { state: 'conforme' })
    await repo.updateAnswer(inspection.id, 'sec-pulverizador-2', { state: 'nao_conforme', severity: 'alta', recommendedAction: 'Revisar controlador' })
    await repo.updateAnswer(inspection.id, 'sec-pulverizador-3', { state: 'nao_se_aplica' })
    db.close()
    const reopened = createRepository(await openDatabase('checklist-test'))
    db = reopened.database
    const stored = await reopened.getInspection(inspection.id)
    expect(stored.answers['sec-pulverizador-1'].state).toBe('conforme')
    expect(stored.answers['sec-pulverizador-2'].state).toBe('nao_conforme')
    expect(stored.answers['sec-pulverizador-2'].correctionStatus).toBe('aberta')
    expect(stored.answers['sec-pulverizador-3'].state).toBe('nao_se_aplica')
    expect(stored.answers['sec-pulverizador-4']).toBeUndefined()
  })

  it('acumula testes operacionais da mesma máquina', async () => {
    const repo = await repository()
    const machine = await repo.saveMachine({ name: 'Distribuidor 01', categoryId: 'cat-distribuidor' })
    await repo.saveTest({
      machineId: machine.id,
      datetime: '2026-06-01T08:00',
      responsible: 'Técnico',
      objective: 'Dosagem estática',
      procedure: 'Acionar dosador parado',
      conditions: 'Máquina parada',
      result: 'aprovado_com_ressalvas',
      failures: 'Leitura oscilou',
      pending: 'Repetir em movimento',
      conclusion: 'Liberado com acompanhamento'
    })
    await repo.saveTest({
      machineId: machine.id,
      datetime: '2026-06-02T08:00',
      responsible: 'Técnico',
      objective: 'Distribuição em deslocamento',
      procedure: 'Percurso curto',
      conditions: 'Solo firme',
      result: 'reprovado',
      failures: 'Faixa irregular',
      pending: 'Calibrar novamente',
      conclusion: 'Não liberar'
    })
    const tests = await repo.listTests(machine.id)
    expect(tests).toHaveLength(2)
    expect(tests.map((item) => item.result).sort()).toEqual(['aprovado_com_ressalvas', 'reprovado'])
  })

  it('grava, exporta e restaura fotografia somente após confirmação', async () => {
    const repo = await repository()
    const machine = await repo.saveMachine({ name: 'Trator 03', categoryId: 'cat-trator' })
    const component = await repo.saveComponent({
      name: 'Antena GNSS',
      categoryId: 'cat-antena',
      machineId: machine.id
    })
    const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3])
    await repo.savePhoto({
      machineId: machine.id,
      componentId: component.id,
      description: 'Antena no teto',
      capturedAt: '2026-06-03T10:00:00.000Z',
      fileName: 'antena.png',
      mimeType: 'image/png',
      blob: new Blob([bytes], { type: 'image/png' })
    })
    const backup = await repo.exportBackup()
    expect(backup.data.photos).toHaveLength(1)
    expect(backup.data.photos[0].dataBase64.length).toBeGreaterThan(10)

    await expect(repo.importBackup(backup, { replace: false })).rejects.toThrow(/confirma/i)
    expect(await repo.listMachines()).toHaveLength(1)

    await repo.importBackup({
      ...backup,
      data: {
        ...backup.data,
        machines: [],
        components: [],
        photos: [],
        activities: backup.data.activities
      }
    }, { replace: true })
    expect(await repo.listMachines()).toHaveLength(0)

    await repo.importBackup(backup, { replace: true })
    const photos = await repo.listPhotos()
    const restored = new Uint8Array(await photos[0].blob.arrayBuffer())
    expect(Array.from(restored)).toEqual(Array.from(bytes))
    expect(photos[0].componentId).toBe(component.id)
    expect(photos[0].description).toBe('Antena no teto')
  })

  it('rejeita backup inválido sem alterar os dados atuais', async () => {
    const repo = await repository()
    await repo.saveMachine({ name: 'Trator estável', categoryId: 'cat-trator' })
    await expect(repo.importBackup({ format: 'checklist-backup', version: 1, data: {} }, { replace: true })).rejects.toThrow()
    const machines = await repo.listMachines()
    expect(machines.map((item) => item.name)).toContain('Trator estável')
  })
})
