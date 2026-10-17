import { archiveMachine as markArchived, nextIdentifier, restoreMachine as markRestored, validateMachine } from '../models/machine.js'
import { changeAssociation as reassignAssociation } from '../models/association.js'
import { normalizeAnswer } from '../models/checklist.js'
import { BACKUP_STORES, buildBackup, prepareImport } from '../models/backup.js'
import { validatePhotoLink } from '../models/photo.js'
import { validateTemplate } from '../models/template.js'
import { defaultCategories, defaultTemplates } from '../models/seed.js'
import { mapStorageError } from '../models/storageError.js'

const STORES = BACKUP_STORES
const TEST_RESULTS = ['aprovado', 'aprovado_com_ressalvas', 'reprovado', 'nao_realizado']

export function openDatabase(name = 'checklist') {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      for (const storeName of STORES) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createRepository(database) {
  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error || new Error('A gravação foi cancelada.'))
    })
  }

  function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly')
      const request = transaction.objectStore(storeName).getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  function getOne(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly')
      const request = transaction.objectStore(storeName).get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async function putOne(storeName, value) {
    try {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(value)
      await transactionDone(transaction)
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async function removeOne(storeName, id) {
    try {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).delete(id)
      await transactionDone(transaction)
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async function activity(summary) {
    await putOne('activities', {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      summary
    })
  }

  function hydratePhoto(record) {
    if (!record) return record
    if (record.blob instanceof Blob) return record
    const bytes = record.bytes instanceof Uint8Array ? record.bytes : new Uint8Array(record.bytes || [])
    return {
      ...record,
      blob: new Blob([bytes], { type: record.mimeType || 'application/octet-stream' })
    }
  }

  async function bytesFromBlob(blob) {
    return new Uint8Array(await blob.arrayBuffer())
  }

  return {
    database,

    async ensureSeed() {
      const categories = await getAll('categories')
      if (categories.length > 0) return
      const now = new Date().toISOString()
      for (const category of defaultCategories()) await putOne('categories', { ...category, createdAt: now })
      for (const template of defaultTemplates()) await putOne('templates', { ...template, createdAt: now })
      await putOne('settings', {
        id: 'principal',
        organizationName: 'ASCAD Agrotecnologia',
        propertyName: '',
        technicalResponsible: '',
        updatedAt: now
      })
    },

    async snapshot() {
      const entries = await Promise.all(STORES.map(async (store) => [store, await getAll(store)]))
      const data = Object.fromEntries(entries)
      data.photos = data.photos.map(hydratePhoto)
      data.settings = data.settings[0] || {
        id: 'principal',
        organizationName: 'ASCAD Agrotecnologia',
        propertyName: '',
        technicalResponsible: ''
      }
      return data
    },

    listMachines(options = {}) {
      return getAll('machines').then((machines) => machines
        .filter((machine) => options.includeArchived || machine.situation !== 'arquivada')
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    },

    getMachine(id) {
      return getOne('machines', id)
    },

    async saveMachine(input) {
      const categories = await getAll('categories')
      const machineCategories = categories.filter((category) => category.kind === 'maquina')
      const result = validateMachine(input, machineCategories)
      if (!result.ok) throw new Error(result.error)
      const machines = await getAll('machines')
      const existing = input.id ? machines.find((machine) => machine.id === input.id) : null
      let identifier = result.value.identifier
      if (!identifier) {
        const category = machineCategories.find((item) => item.id === result.value.categoryId)
        identifier = existing?.identifier || nextIdentifier(category, machines.filter((machine) => machine.id !== existing?.id))
      } else if (machines.some((machine) => machine.identifier === identifier && machine.id !== existing?.id)) {
        throw new Error('Já existe uma máquina com este identificador.')
      }
      const now = new Date().toISOString()
      const record = {
        ...existing,
        ...result.value,
        id: existing?.id || crypto.randomUUID(),
        identifier,
        situation: existing?.situation === 'arquivada' && !input.situation ? 'arquivada' : result.value.situation,
        previousSituation: existing?.previousSituation || '',
        archivedAt: existing?.archivedAt || null,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }
      await putOne('machines', record)
      await activity(existing ? `Máquina atualizada: ${record.name}` : `Máquina cadastrada: ${record.name}`)
      return record
    },

    async archiveMachine(id) {
      const machine = await getOne('machines', id)
      if (!machine) throw new Error('Máquina não encontrada.')
      const now = new Date().toISOString()
      const record = { ...markArchived(machine, now), updatedAt: now }
      await putOne('machines', record)
      await activity(`Máquina arquivada: ${machine.name}`)
      return record
    },

    async restoreMachine(id) {
      const machine = await getOne('machines', id)
      if (!machine) throw new Error('Máquina não encontrada.')
      const record = markRestored(machine, new Date().toISOString())
      await putOne('machines', record)
      await activity(`Máquina restaurada: ${machine.name}`)
      return record
    },

    async saveCategory(input) {
      const name = String(input.name || '').trim()
      if (!name) throw new Error('Informe o nome da categoria.')
      if (!['maquina', 'componente'].includes(input.kind)) throw new Error('Informe se a categoria é de máquina ou de componente.')
      const existing = input.id ? await getOne('categories', input.id) : null
      const record = {
        id: existing?.id || crypto.randomUUID(),
        name,
        kind: existing?.builtin ? existing.kind : input.kind,
        role: input.kind === 'maquina' ? (input.role || '') : '',
        builtin: Boolean(existing?.builtin),
        createdAt: existing?.createdAt || new Date().toISOString()
      }
      if (!['', 'trator', 'implemento'].includes(record.role)) throw new Error('Papel de associação inválido.')
      await putOne('categories', record)
      await activity(`Categoria registrada: ${record.name}`)
      return record
    },

    listComponents(machineId) {
      return getAll('components').then((components) => components
        .filter((component) => !machineId || component.machineId === machineId)
        .filter((component) => !component.archived)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    },

    async saveComponent(input) {
      const name = String(input.name || '').trim()
      if (!name) throw new Error('Informe o nome do componente.')
      const category = await getOne('categories', input.categoryId)
      if (!category || category.kind !== 'componente') throw new Error('Selecione a categoria do componente.')
      const machine = await getOne('machines', input.machineId)
      if (!machine) throw new Error('Selecione a máquina à qual o componente pertence.')
      const existing = input.id ? await getOne('components', input.id) : null
      const now = new Date().toISOString()
      const record = {
        id: existing?.id || crypto.randomUUID(),
        name,
        categoryId: category.id,
        manufacturer: String(input.manufacturer || '').trim(),
        model: String(input.model || '').trim(),
        serialNumber: String(input.serialNumber || '').trim(),
        firmware: String(input.firmware || '').trim(),
        machineId: machine.id,
        physicalState: input.physicalState || 'nao_verificado',
        functionalState: input.functionalState || 'nao_verificado',
        connections: String(input.connections || '').trim(),
        inspectionDate: String(input.inspectionDate || '').trim(),
        notes: String(input.notes || '').trim(),
        archived: Boolean(existing?.archived),
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }
      await putOne('components', record)
      await activity(`${existing ? 'Componente atualizado' : 'Componente cadastrado'}: ${record.name}`)
      return record
    },

    async archiveComponent(id) {
      const component = await getOne('components', id)
      if (!component) throw new Error('Componente não encontrado.')
      const record = { ...component, archived: true, updatedAt: new Date().toISOString() }
      await putOne('components', record)
      await activity(`Componente arquivado: ${component.name}`)
      return record
    },

    listAssociations() {
      return getAll('associations')
    },

    async changeAssociation({ tractorId, implementId }) {
      const [machines, categories, associations] = await Promise.all([
        getAll('machines'),
        getAll('categories'),
        getAll('associations')
      ])
      const tractor = machines.find((machine) => machine.id === tractorId)
      const implement = machines.find((machine) => machine.id === implementId)
      if (!tractor || !implement) throw new Error('Selecione o trator e a plantadeira.')
      const tractorCategory = categories.find((category) => category.id === tractor.categoryId)
      const implementCategory = categories.find((category) => category.id === implement.categoryId)
      if (tractorCategory?.role !== 'trator') throw new Error('A associação deve partir de uma máquina cadastrada como trator.')
      if (implementCategory?.role !== 'implemento') throw new Error('Selecione uma plantadeira ou outro implemento associável.')
      const result = reassignAssociation(associations, {
        tractorId,
        implementId,
        now: new Date().toISOString(),
        id: crypto.randomUUID()
      })
      for (const item of result.associations) {
        const changed = result.created?.id === item.id || result.closed.some((closed) => closed.id === item.id)
        if (changed) await putOne('associations', item)
      }
      if (result.created) await activity(`Associação alterada: ${tractor.name} e ${implement.name}`)
      return result
    },

    getInspection(id) {
      return getOne('inspections', id)
    },

    listInspections() {
      return getAll('inspections')
    },

    async startInspection(input) {
      const template = await getOne('templates', input.templateId)
      if (!template) throw new Error('Modelo de checklist não encontrado.')
      if (template.scope !== 'ambos' && template.scope !== input.scope) {
        throw new Error('Este modelo não serve para o tipo de inspeção selecionado.')
      }
      const targetStore = input.scope === 'componente' ? 'components' : 'machines'
      const target = await getOne(targetStore, input.targetId)
      if (!target) throw new Error('Registro a inspecionar não encontrado.')
      const now = new Date().toISOString()
      const record = {
        id: crypto.randomUUID(),
        scope: input.scope,
        targetId: input.targetId,
        machineId: input.machineId || (input.scope === 'maquina' ? input.targetId : ''),
        templateId: template.id,
        contextImplementId: input.contextImplementId || '',
        responsible: String(input.responsible || '').trim(),
        date: String(input.date || now.slice(0, 10)),
        status: 'em_andamento',
        answers: {},
        createdAt: now,
        updatedAt: now
      }
      await putOne('inspections', record)
      await activity(`Inspeção iniciada: ${template.name}`)
      return record
    },

    async updateAnswer(inspectionId, itemId, patch) {
      const inspection = await getOne('inspections', inspectionId)
      if (!inspection) throw new Error('Inspeção não encontrada.')
      const current = inspection.answers?.[itemId] || {}
      const answers = { ...inspection.answers, [itemId]: normalizeAnswer({ ...current, ...patch }) }
      const record = { ...inspection, answers, updatedAt: new Date().toISOString() }
      await putOne('inspections', record)
      return record
    },

    async setInspectionStatus(inspectionId, status) {
      if (!['em_andamento', 'concluida'].includes(status)) throw new Error('Situação de inspeção inválida.')
      const inspection = await getOne('inspections', inspectionId)
      if (!inspection) throw new Error('Inspeção não encontrada.')
      const record = { ...inspection, status, updatedAt: new Date().toISOString() }
      await putOne('inspections', record)
      await activity(status === 'concluida' ? 'Inspeção concluída' : 'Inspeção reaberta')
      return record
    },

    listTests(machineId) {
      return getAll('tests').then((tests) => tests
        .filter((test) => !machineId || test.machineId === machineId)
        .sort((a, b) => String(b.datetime).localeCompare(String(a.datetime))))
    },

    async saveTest(input) {
      const machine = await getOne('machines', input.machineId)
      if (!machine) throw new Error('Selecione a máquina do teste.')
      if (input.componentId) {
        const component = await getOne('components', input.componentId)
        if (!component || component.machineId !== machine.id) throw new Error('O componente não pertence à máquina do teste.')
      }
      if (!TEST_RESULTS.includes(input.result)) throw new Error('Informe o resultado do teste.')
      if (!String(input.objective || '').trim()) throw new Error('Informe o objetivo do teste.')
      if (!String(input.responsible || '').trim()) throw new Error('Informe o responsável pelo teste.')
      if (!String(input.datetime || '').trim()) throw new Error('Informe a data e a hora do teste.')
      const existing = input.id ? await getOne('tests', input.id) : null
      const now = new Date().toISOString()
      const record = {
        id: existing?.id || crypto.randomUUID(),
        machineId: machine.id,
        componentId: input.componentId || '',
        datetime: input.datetime,
        responsible: String(input.responsible).trim(),
        objective: String(input.objective).trim(),
        procedure: String(input.procedure || '').trim(),
        conditions: String(input.conditions || '').trim(),
        result: input.result,
        failures: String(input.failures || '').trim(),
        pending: String(input.pending || '').trim(),
        conclusion: String(input.conclusion || '').trim(),
        photoIds: existing?.photoIds || [],
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }
      await putOne('tests', record)
      await activity(`Teste operacional registrado: ${machine.name}`)
      return record
    },

    async listPhotos() {
      const photos = await getAll('photos')
      return photos.map(hydratePhoto).sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))
    },

    async savePhoto(input) {
      const components = await getAll('components')
      const link = validatePhotoLink({
        machineId: input.machineId,
        componentId: input.componentId || '',
        components
      })
      if (!link.ok) throw new Error(link.error)
      const machine = await getOne('machines', input.machineId)
      if (!machine) throw new Error('Máquina não encontrada.')
      if (!input.blob) throw new Error('Selecione uma imagem.')
      const bytes = await bytesFromBlob(input.blob)
      const now = new Date().toISOString()
      const record = {
        id: crypto.randomUUID(),
        machineId: machine.id,
        componentId: input.componentId || '',
        inspectionId: input.inspectionId || '',
        itemId: input.itemId || '',
        testId: input.testId || '',
        description: String(input.description || '').trim(),
        capturedAt: input.capturedAt || now,
        fileName: input.fileName || 'imagem',
        mimeType: input.mimeType || input.blob.type || 'image/jpeg',
        bytes: Array.from(bytes),
        createdAt: now
      }
      await putOne('photos', record)
      await activity(`Fotografia registrada: ${machine.name}`)
      return hydratePhoto(record)
    },

    async deletePhoto(id) {
      const photo = await getOne('photos', id)
      if (!photo) throw new Error('Fotografia não encontrada.')
      await removeOne('photos', id)
      await activity('Fotografia excluída')
      return photo
    },

    async saveTemplate(input) {
      const existing = input.id ? await getOne('templates', input.id) : null
      const sections = (input.sections || []).map((section) => ({
        id: section.id || crypto.randomUUID(),
        title: section.title,
        items: (section.items || []).map((item) => ({
          id: item.id || crypto.randomUUID(),
          label: item.label
        }))
      }))
      const result = validateTemplate({ ...input, sections })
      if (!result.ok) throw new Error(result.error)
      const record = {
        id: existing?.id || crypto.randomUUID(),
        ...result.value,
        builtin: Boolean(existing?.builtin),
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await putOne('templates', record)
      await activity(`Modelo de checklist salvo: ${record.name}`)
      return record
    },

    async saveSettings(input) {
      const current = await getOne('settings', 'principal')
      const record = {
        id: 'principal',
        organizationName: String(input.organizationName || current?.organizationName || 'ASCAD Agrotecnologia').trim(),
        propertyName: String(input.propertyName ?? '').trim(),
        technicalResponsible: String(input.technicalResponsible ?? '').trim(),
        updatedAt: new Date().toISOString()
      }
      await putOne('settings', record)
      return record
    },

    async exportBackup() {
      const data = {}
      for (const store of STORES) data[store] = await getAll(store)
      data.photos = await Promise.all(data.photos.map(async (photo) => {
        const hydrated = hydratePhoto(photo)
        const bytes = new Uint8Array(await hydrated.blob.arrayBuffer())
        let binary = ''
        const chunk = 0x8000
        for (let index = 0; index < bytes.length; index += chunk) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
        }
        const { bytes: rawBytes, blob, ...rest } = hydrated
        return { ...rest, dataBase64: btoa(binary) }
      }))
      return buildBackup(data, { now: new Date().toISOString() })
    },

    async importBackup(payload, options = {}) {
      const data = prepareImport(payload, options)
      const photos = data.photos.map((photo) => {
        const binary = atob(photo.dataBase64)
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
        const { dataBase64, blob, ...rest } = photo
        return { ...rest, bytes: Array.from(bytes) }
      })
      try {
        const transaction = database.transaction(STORES, 'readwrite')
        for (const storeName of STORES) {
          const store = transaction.objectStore(storeName)
          store.clear()
          const records = storeName === 'photos' ? photos : data[storeName]
          for (const record of records) store.put(record)
        }
        await transactionDone(transaction)
      } catch (error) {
        throw mapStorageError(error)
      }
    }
  }
}
