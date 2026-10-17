function section(id, title, labels) {
  return {
    id,
    title,
    items: labels.map((label, index) => ({ id: `${id}-${index + 1}`, label }))
  }
}

function template(id, name, scope, categoryId, sections) {
  return { id, name, scope, categoryId, builtin: true, sections }
}

export function defaultCategories() {
  return [
    { id: 'cat-trator', name: 'Trator', kind: 'maquina', role: 'trator', builtin: true },
    { id: 'cat-plantadeira', name: 'Plantadeira', kind: 'maquina', role: 'implemento', builtin: true },
    { id: 'cat-pulverizador', name: 'Pulverizador autopropelido', kind: 'maquina', role: '', builtin: true },
    { id: 'cat-distribuidor', name: 'Distribuidor autopropelido de fertilizantes', kind: 'maquina', role: '', builtin: true },
    { id: 'cat-colheitadeira', name: 'Colheitadeira', kind: 'maquina', role: '', builtin: true },
    { id: 'cat-gnss', name: 'Equipamento GNSS', kind: 'maquina', role: '', builtin: true },
    { id: 'cat-outro', name: 'Outro equipamento', kind: 'maquina', role: '', builtin: true },
    { id: 'cat-monitor', name: 'Monitor', kind: 'componente', role: '', builtin: true },
    { id: 'cat-receptor', name: 'Receptor GNSS', kind: 'componente', role: '', builtin: true },
    { id: 'cat-antena', name: 'Antena GNSS', kind: 'componente', role: '', builtin: true },
    { id: 'cat-piloto', name: 'Piloto automático', kind: 'componente', role: '', builtin: true },
    { id: 'cat-controlador', name: 'Controlador', kind: 'componente', role: '', builtin: true },
    { id: 'cat-sensor', name: 'Sensor', kind: 'componente', role: '', builtin: true },
    { id: 'cat-chicote', name: 'Chicote elétrico', kind: 'componente', role: '', builtin: true },
    { id: 'cat-tablet', name: 'Tablet', kind: 'componente', role: '', builtin: true },
    { id: 'cat-terminal', name: 'Terminal de operação', kind: 'componente', role: '', builtin: true },
    { id: 'cat-outro-comp', name: 'Outro componente', kind: 'componente', role: '', builtin: true }
  ]
}

export function defaultTemplates() {
  return [
    template('tpl-geral', 'Identificação e instalação', 'maquina', '', [
      section('sec-identificacao', 'Identificação e inventário', [
        'Equipamento identificado',
        'Modelo registrado',
        'Número de série registrado, quando disponível',
        'Componentes identificados',
        'Inventário conferido',
        'Fotografias gerais registradas',
        'Documentação disponível'
      ]),
      section('sec-instalacao', 'Instalação física', [
        'Fixação dos equipamentos',
        'Fixação da antena',
        'Posição dos suportes',
        'Integridade dos cabos',
        'Integridade dos conectores',
        'Proteção contra água e poeira',
        'Ausência de danos visíveis',
        'Alimentação elétrica',
        'Organização da instalação',
        'Estado das conexões'
      ])
    ]),
    template('tpl-gnss', 'GNSS e posicionamento', 'ambos', 'cat-gnss', [
      section('sec-gnss', 'GNSS e posicionamento', [
        'Receptor reconhecido',
        'Antena conectada',
        'Recepção de satélites',
        'Quantidade de satélites, quando disponível',
        'Solução de posicionamento',
        'Recebimento de correções RTK, quando aplicável',
        'Comunicação com base ou serviço de correção',
        'Estado da conexão NTRIP, quando aplicável',
        'Estabilidade da solução',
        'Alarmes',
        'Configuração de comunicação',
        'Observações sobre o posicionamento'
      ])
    ]),
    template('tpl-monitor', 'Monitor e software', 'ambos', 'cat-monitor', [
      section('sec-monitor', 'Monitor e software', [
        'Monitor liga',
        'Tela funciona',
        'Comandos respondem',
        'Componentes reconhecidos',
        'Configuração conferida',
        'Versão de software registrada',
        'Ausência de alertas críticos',
        'Comunicação entre módulos',
        'Operação básica validada'
      ])
    ]),
    template('tpl-piloto', 'Piloto automático', 'ambos', 'cat-piloto', [
      section('sec-piloto', 'Piloto automático', [
        'Sistema reconhecido',
        'Receptor e antena funcionando',
        'Sensores reconhecidos',
        'Atuadores reconhecidos',
        'Configuração de direção conferida',
        'Calibração registrada',
        'Alarmes verificados',
        'Teste de funcionamento registrado',
        'Comportamento operacional avaliado',
        'Pendências documentadas'
      ])
    ]),
    template('tpl-plantadeira', 'Plantadeira', 'maquina', 'cat-plantadeira', [
      section('sec-plantadeira', 'Plantadeira', [
        'Identificação da plantadeira',
        'Número de linhas',
        'Espaçamento entre linhas',
        'Monitor reconhece o equipamento',
        'Sensores funcionando, quando existentes',
        'Dosadores funcionando, quando existentes',
        'Cabos e conectores',
        'Comunicação com o trator',
        'Configurações conferidas',
        'Teste estático registrado',
        'Teste operacional registrado',
        'Falhas identificadas',
        'Observações'
      ])
    ]),
    template('tpl-pulverizador', 'Pulverizador autopropelido', 'maquina', 'cat-pulverizador', [
      section('sec-pulverizador', 'Pulverizador autopropelido', [
        'Monitor',
        'Controladores',
        'GNSS',
        'Piloto automático',
        'Sensores de aplicação',
        'Controle de vazão',
        'Seções e barras',
        'Comunicação entre módulos',
        'Alarmes',
        'Testes funcionais',
        'Resultado operacional',
        'Pendências'
      ])
    ]),
    template('tpl-distribuidor', 'Distribuidor de fertilizantes', 'maquina', 'cat-distribuidor', [
      section('sec-distribuidor', 'Distribuidor de fertilizantes', [
        'Monitor',
        'Controladores',
        'GNSS',
        'Piloto automático',
        'Sistema de dosagem',
        'Sensores e atuadores',
        'Comunicação',
        'Configuração de distribuição',
        'Testes funcionais',
        'Resultado operacional',
        'Pendências'
      ])
    ]),
    template('tpl-componente', 'Componente individual', 'componente', '', [
      section('sec-componente', 'Componente individual', [
        'Identificação conferida',
        'Número de série conferido, quando disponível',
        'Versão de software ou firmware registrada, quando aplicável',
        'Estado físico avaliado',
        'Estado de funcionamento avaliado',
        'Conexões conferidas',
        'Fixação conferida',
        'Alimentação conferida, quando aplicável',
        'Comunicação conferida, quando aplicável',
        'Pendências registradas'
      ])
    ])
  ]
}

export function suggestedTemplateId(record, kind) {
  if (kind === 'componente') {
    const byCategory = {
      'cat-monitor': 'tpl-monitor',
      'cat-receptor': 'tpl-gnss',
      'cat-antena': 'tpl-gnss',
      'cat-piloto': 'tpl-piloto'
    }
    return byCategory[record.categoryId] || 'tpl-componente'
  }
  const byCategory = {
    'cat-plantadeira': 'tpl-plantadeira',
    'cat-pulverizador': 'tpl-pulverizador',
    'cat-distribuidor': 'tpl-distribuidor',
    'cat-gnss': 'tpl-gnss'
  }
  return byCategory[record.categoryId] || 'tpl-geral'
}
