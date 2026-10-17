# Checklist

Aplicativo de checklist e relatório técnico de máquinas e equipamentos agrícolas da ASCAD Agrotecnologia.

O nome exibido na interface é **Checklist**. O idioma da interface é português brasileiro. A primeira versão funciona no navegador do tablet ou do computador, pode ser instalada como aplicativo e guarda os dados no próprio dispositivo.

## O que a primeira versão faz

- Cadastro, edição e arquivamento de máquinas, com categorias que podem ser ampliadas na tela Dados.
- Inventário de componentes por máquina.
- Associação de plantadeira a trator, com histórico. Trocar a associação não move nem apaga inspeções anteriores.
- Checklists de máquina e de componente, separados, com os estados Não inspecionado, Conforme, Não conforme e Não se aplica.
- Não conformidade com gravidade, ação, responsável, prazo e estado da correção.
- Testes operacionais com histórico.
- Fotografias da câmera ou de arquivo, ligadas à máquina e, se o operador escolher, a um componente, checklist ou teste.
- Relatório técnico para impressão e exportação em PDF.
- Backup completo em JSON, incluindo imagens, com validação e confirmação antes de substituir os dados.
- Uso offline depois que o aplicativo tiver sido aberto uma vez com conexão.

O painel começa em zero. Ele não traz máquinas, fotos nem números de exemplo.

## Arquitetura

A aplicação é uma página web estática, organizada em modelo, visão e controlador:

- `src/models` guarda as regras de cadastro, checklist, associação, backup e relatório.
- `src/services` guarda o banco local, a exportação e o PDF.
- `src/views` monta a interface.
- `src/controllers` recebe as ações do operador.

Os registros ficam no IndexedDB do navegador, no banco `checklist`. As fotografias entram no mesmo banco e no arquivo de backup. Não há sincronização entre aparelhos nesta versão: isso só deve ser feito depois de definir autenticação, autorização, persistência remota e uma regra para conflitos.

O endereço publicado, se a implantação for feita, entrega apenas o programa. Os dados da propriedade permanecem no tablet. Por isso o programa pode ser aberto sem login, mas um visitante não vê as inspeções de outro aparelho.

Limitações e o isolamento em relação à infraestrutura GNSS estão em [docs/arquitetura.md](docs/arquitetura.md).

## Executar neste computador

É preciso Node.js 20 ou superior.

```bash
npm install
npm test
npm run dev
```

O endereço local aparece no terminal. Para gerar a pasta que vai ao servidor:

```bash
npm run build
npm run preview
```

Os arquivos finais ficam em `dist/`.

## Testes

```bash
npm test
```

A suíte cobre cadastro, arquivamento, componentes, associação, os quatro estados do checklist, não conformidade, testes operacionais, backup com fotografia, relatório, PDF e a navegação principal da interface. O teste de interface usa um navegador simulado no tamanho de uso em tablet não substitui uma conferência no aparelho físico; o procedimento está na seção seguinte.

## Instalar no tablet Android

1. No Chrome, abra o endereço do Checklist.
2. Confira se o painel abre e se os contadores estão coerentes com o aparelho.
3. No menu do Chrome, escolha **Instalar aplicativo** ou **Adicionar à tela inicial**.
4. Abra o atalho instalado uma vez com internet, para que a cópia local seja guardada.
5. Ative o modo avião e confirme que o painel, o cadastro e um checklist continuam abrindo.
6. Faça um backup e copie o arquivo para um computador ou pendrive.

O Chrome pode apagar dados de sites pouco usados. O botão de backup é a proteção principal. Não há cópia automática em servidor.

## Backup e restauração

1. Abra **Dados**.
2. Toque em **Exportar backup**. O arquivo `checklist-backup-....json` contém cadastros, checklists, testes e fotografias.
3. Guarde esse arquivo fora do tablet.
4. Para restaurar, em **Dados**, escolha o arquivo em **Importar backup**.
5. Confira a contagem apresentada.
6. Toque em **Substituir dados deste dispositivo** e confirme.

Se o arquivo for inválido, o aplicativo recusa a leitura e mantém os dados atuais. A restauração nunca ocorre só porque o arquivo foi selecionado.

## Publicação

O endereço público do aplicativo é https://ftoniolli.github.io/checklist/. O código está em https://github.com/ftoniolli/checklist. Esse site entrega somente o programa. Cadastros, fotos e relatórios ficam no aparelho.
