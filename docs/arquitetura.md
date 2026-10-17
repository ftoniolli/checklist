# Arquitetura da versão 1

## Decisão

O Checklist é uma aplicação web instalável, sem servidor de aplicação e sem banco remoto.

Essa forma atende o uso em campo: depois do primeiro carregamento, a inspeção continua sem internet. Também atende a restrição de não publicar fotografias, relatórios ou cadastros da propriedade. O endereço do programa pode ser acessível na internet; os dados digitados no tablet não saem dele.

Não foi usada sincronização. Ainda não há regra de autenticação, autorização, armazenamento remoto durável nem resolução de conflito entre dois aparelhos. Enquanto isso não estiver definido, uma cópia central poderia perder uma inspeção feita offline ou misturar alterações concorrentes.

## Organização

O código segue o modelo MVC:

| Pasta | Responsabilidade |
| --- | --- |
| `src/models` | Regras e validações, sem tela e sem banco |
| `src/views` | Montagem da interface em português |
| `src/controllers` | Navegação e ações do operador |
| `src/services` | IndexedDB, backup em arquivo e PDF |

As categorias e os modelos de checklist iniciais são gravados apenas quando o banco local está vazio. Depois disso, categorias e modelos podem ser alterados pela tela Dados, sem mudar o código.

## Dados

O banco local `checklist` tem as coleções `categories`, `machines`, `components`, `associations`, `templates`, `inspections`, `tests`, `photos`, `activities` e `settings`.

Cada registro tem um identificador único. A associação entre trator e plantadeira guarda início e fim. A inspeção guarda a máquina ou o componente inspecionado e, quando existe, a plantadeira que estava associada naquele momento. Uma troca posterior não reescreve esse histórico.

Item sem resposta permanece **Não inspecionado**. Esse estado não é tratado como aprovação. A máquina só fica aprovada quando a inspeção mais recente de cada modelo usado está concluída, não tem item pendente e não tem não conformidade aberta. Não conformidade corrigida numa inspeção mais recente deixa de bloquear, e o registro antigo continua no histórico.

O aplicativo não consulta receptor, não conta satélite e não classifica correção RTK por conta própria. Onde não houver observação, o item fica sem resposta.

O aplicativo não comanda máquinas e não atualiza firmware.

## Fotografias e backup

A imagem é guardada no IndexedDB junto com a máquina, a data e a descrição. Componente, item de checklist e teste só são gravados quando o operador informa esse vínculo.

O backup é um JSON `checklist-backup` versão 1. A imagem vai em Base64. A importação valida o formato, recusa identificador duplicado ou fotografia vazia e só substitui o banco quando a confirmação é explícita. A gravação ocorre numa transação: se ela falhar, o banco anterior é mantido.

Se o espaço do navegador acabar, a operação é interrompida com um aviso. Nada é apagado para abrir espaço.

## Relatório

A prévia, a impressão e o PDF usam o mesmo cálculo de situação. O texto de conclusão escrito pelo responsável aparece separado da situação automática. Havendo item não inspecionado ou não conformidade aberta, a situação automática é **Não aprovada**.

## Limitações

- Não há sincronização nem conta de usuário. Cada navegador tem seu próprio arquivo de dados.
- Perder o perfil do Chrome, limpar os dados do site ou trocar de tablet sem restaurar o backup apaga o trabalho daquele aparelho.
- Dois inspetores em dois tablets não veem o cadastro um do outro.
- O PDF incorpora JPEG e PNG. Outros formatos permanecem no aplicativo e no backup, com um aviso no documento.
- O teste automatizado de tela usa um navegador simulado. A instalação no Android precisa ser conferida no tablet.
- O modo offline depende de o aplicativo ter sido aberto online ao menos uma vez depois da última atualização.

## Isolamento da infraestrutura GNSS

Este repositório não possui script de implantação. A palavra NTRIP aparece apenas como item de inspeção que o operador pode marcar.
