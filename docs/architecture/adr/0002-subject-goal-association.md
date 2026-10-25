# ADR 0002 — Associação entre disciplinas e objetivos

- **Situação:** aceita
- **Data:** 2026-10-25

## Contexto

Uma disciplina de estudo (por exemplo, "Python") se relaciona com um ou mais objetivos de estudo, e um objetivo pode ter várias disciplinas: uma relação muitos-para-muitos. Toda disciplina precisa de ao menos um objetivo ao ser criada.

No futuro, horas de estudo serão registradas por disciplina. Esses registros devem apontar para a disciplina, e não para a associação entre disciplina e objetivo.

As duas representações consideradas no IndexedDB foram:

1. Uma lista de identificadores de objetivos dentro de cada disciplina.
2. Uma tabela de vínculos, com um registro por par disciplina–objetivo.

## Decisão

- Cada disciplina guarda os objetivos associados em `goalIds`, uma lista sem repetições, na tabela `subjects`.
- A tabela tem um índice multivalorado (`*goalIds`), que permite buscar as disciplinas de um objetivo.
- A disciplina tem um identificador próprio e estável, independente dos objetivos, que servirá de referência para os registros de horas.
- Ao criar uma disciplina, a existência dos objetivos é conferida na mesma transação que grava a disciplina.
- A funcionalidade de disciplinas lê os objetivos apenas pela interface pública da funcionalidade de objetivos.

## Consequências

- Disciplina e vínculos são gravados em uma única escrita, então não existe estado com vínculos parcialmente gravados.
- A exportação e a importação em JSON continuam simples: um registro por disciplina, com seus vínculos.
- A associação não tem atributos próprios. Se precisar deles (por exemplo, uma meta de horas por objetivo), será migrada para uma tabela de vínculos em uma nova versão do esquema.
- O IndexedDB não garante integridade referencial. A exclusão de um objetivo não remove o vínculo nas disciplinas; esse comportamento será definido em uma funcionalidade futura. Até lá, a interface simplesmente não exibe vínculos com objetivos inexistentes.
- O esquema passou à versão 2, que apenas acrescenta a tabela `subjects`; os objetivos já gravados não são alterados.
