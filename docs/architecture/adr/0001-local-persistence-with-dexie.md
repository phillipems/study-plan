# ADR 0001 — Persistência local com Dexie e IndexedDB

- **Situação:** aceita
- **Data:** 2026-10-07

## Contexto

O Study Plan é uma aplicação local-first: não há backend, e os dados do usuário ficam no navegador. A primeira funcionalidade que grava dados (objetivos de estudo) exigiu definir onde e como eles são armazenados, e como essa estrutura convive com a organização do código por funcionalidades.

## Decisão

- Os dados são gravados no IndexedDB, por meio da biblioteca Dexie.js.
- A aplicação tem **um único banco**, chamado `study-plan`, criado em `src/infrastructure/database/database.ts`.
- O **esquema e suas versões ficam centralizados** nesse arquivo, que conhece apenas nomes de tabelas e índices.
- Cada funcionalidade **encapsula o acesso às suas tabelas** em um arquivo próprio (por exemplo, `src/features/goals/goal-repository.ts`) e define ali os tipos dos registros. O restante da funcionalidade não usa o Dexie diretamente.
- Regras de negócio e validações ficam em funções que não dependem do Dexie nem do React.
- Datas são gravadas como texto no formato ISO 8601.

## Consequências

- Toda alteração de esquema (nova tabela, novo índice, migração) é feita em um só lugar, com um histórico de versões único.
- `src/infrastructure` não depende de nenhuma funcionalidade; as funcionalidades dependem da infraestrutura.
- Não há interface nem camada genérica de repositórios. Se surgir uma segunda forma de armazenamento, a troca fica restrita aos arquivos de acesso de cada funcionalidade.
- Os registros contêm apenas valores serializáveis, o que mantém viável a exportação e a importação dos dados em JSON.
- Os dados pertencem a um navegador e a um endereço específicos: não são sincronizados entre dispositivos e são perdidos se o usuário limpar os dados do site.
