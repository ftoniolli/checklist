/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { openRoute, settled, startApp, stopApp } from '../src/controllers/appController.js'

async function resetDatabase() {
  await stopApp()
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('checklist')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

beforeEach(async () => {
  await resetDatabase()
  document.body.innerHTML = '<div id="app"></div>'
  window.confirm = () => true
  location.hash = '#/painel'
  await startApp(document.querySelector('#app'))
  await settled()
})

describe('interface', () => {
  it('abre o painel com zeros e sem dados fictícios de propriedade', async () => {
    expect(document.querySelector('[data-stat="machines"]').textContent).toBe('0')
    expect(document.querySelector('[data-stat="components"]').textContent).toBe('0')
    expect(document.querySelector('[data-stat="pending"]').textContent).toBe('0')
    expect(document.querySelector('[data-stat="completed"]').textContent).toBe('0')
    expect(document.querySelector('[data-stat="nonconformities"]').textContent).toBe('0')
    expect(document.querySelector('[data-stat="tests"]').textContent).toBe('0')
    expect(document.body.textContent).toContain('Nenhuma atividade registrada.')
    expect(document.body.textContent).not.toContain('Fazenda Burity')
  })

  it('cadastra máquina, componente, associação, checklist e mantém os dados ao reabrir', async () => {
    await openRoute('#/maquinas/nova')
    const machineForm = document.querySelector('[data-form="machine"]')
    machineForm.querySelector('[name="name"]').value = 'Trator Norte'
    machineForm.querySelector('[name="categoryId"]').value = 'cat-trator'
    machineForm.querySelector('[name="serialNumber"]').value = 'SN-10'
    machineForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settled()
    expect(document.body.textContent).toContain('Trator Norte')
    expect(document.body.textContent).toContain('TR-001')

    await openRoute('#/maquinas/nova')
    const planterForm = document.querySelector('[data-form="machine"]')
    planterForm.querySelector('[name="name"]').value = 'Plantadeira Sul'
    planterForm.querySelector('[name="categoryId"]').value = 'cat-plantadeira'
    planterForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settled()
    const planterUrl = location.hash

    await openRoute('#/maquinas')
    const tractorLink = [...document.querySelectorAll('a')].find((link) => link.textContent.includes('Trator Norte'))
    await openRoute(tractorLink.getAttribute('href'))
    const association = document.querySelector('[data-form="association"]')
    const implement = [...association.querySelectorAll('option')].find((option) => option.textContent.includes('Plantadeira Sul'))
    association.querySelector('[name="implementId"]').value = implement.value
    association.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settled()
    expect(document.body.textContent).toContain('Plantadeira Sul')

    await openRoute(`${tractorLink.getAttribute('href').replace(/\/$/, '')}`)
    const addComponent = [...document.querySelectorAll('a')].find((link) => link.textContent.includes('Adicionar componente'))
    await openRoute(addComponent.getAttribute('href'))
    const componentForm = document.querySelector('[data-form="component"]')
    componentForm.querySelector('[name="name"]').value = 'Monitor de plantio'
    componentForm.querySelector('[name="categoryId"]').value = 'cat-monitor'
    componentForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settled()
    expect(document.body.textContent).toContain('Monitor de plantio')

    await openRoute('#/checklists')
    const inspectionForm = document.querySelector('[data-form="inspection"]')
    const machineOption = [...inspectionForm.querySelectorAll('[name="machineTarget"] option')].find((option) => option.textContent.includes('Trator Norte'))
    inspectionForm.querySelector('[name="machineTarget"]').value = machineOption.value
    inspectionForm.querySelector('[name="machineTarget"]').dispatchEvent(new Event('change', { bubbles: true }))
    await settled()
    inspectionForm.querySelector('[name="templateId"]').value = 'tpl-geral'
    inspectionForm.querySelector('[name="responsible"]').value = 'Técnico de campo'
    inspectionForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settled()

    const card = document.querySelector('[data-item-card="sec-identificacao-1"]')
    card.querySelector('[data-state="conforme"]').click()
    await settled()
    const nonCompliant = document.querySelector('[data-item-card="sec-instalacao-4"]')
    nonCompliant.querySelector('[data-state="nao_conforme"]').click()
    await settled()
    const notApplicable = document.querySelector('[data-item-card="sec-instalacao-2"]')
    notApplicable.querySelector('[data-state="nao_se_aplica"]').click()
    await settled()
    expect(document.querySelector('[data-item-card="sec-identificacao-1"] [data-state="conforme"]').className).toContain('is-selected')
    expect(document.querySelector('[data-item-card="sec-instalacao-4"] [data-state="nao_conforme"]').className).toContain('is-selected')
    expect(document.querySelector('[data-item-card="sec-instalacao-2"] [data-state="nao_se_aplica"]').className).toContain('is-selected')
    expect(document.querySelector('[data-item-card="sec-identificacao-2"] [data-state="nao_inspecionado"]').className).toContain('is-selected')

    document.body.innerHTML = '<div id="app"></div>'
    await startApp(document.querySelector('#app'))
    await openRoute(location.hash)
    expect(document.querySelector('[data-item-card="sec-identificacao-1"] [data-state="conforme"]').className).toContain('is-selected')
    expect(document.querySelector('[data-item-card="sec-instalacao-4"] [data-state="nao_conforme"]').className).toContain('is-selected')
    expect(document.body.textContent).toContain(planterUrl ? 'Checklist' : 'Checklist')
  })
})
