# ADR 0003 — Registro diário de tempo de estudo

- **Situação:** aceita
- **Data:** 2026-11-10

## Contexto

O usuário registra quanto tempo estudou cada disciplina em cada dia, navegando por semanas de segunda a domingo. O pedido é um **total diário consolidado**, e não sessões com início e fim. As horas pertencem à disciplina, não aos objetivos a que ela está ligada.

Datas e semanas precisam corresponder ao calendário local do usuário, sem que fusos horários ou horário de verão mudem o dia exibido.

## Decisão

- Os registros pertencem a uma funcionalidade própria, `src/features/study-time`, que lê disciplinas apenas pela interface pública da funcionalidade de disciplinas. A funcionalidade de disciplinas não depende dela; o cartão de cada disciplina apenas leva ao endereço da sua página de tempo.
- Cada registro guarda `subjectId`, `date` (texto `AAAA-MM-DD`, data do calendário local), `durationMinutes` (minutos inteiros, de 1 a 1439), `createdAt` e `updatedAt`.
- A tabela `studyTime` usa como chave primária o par `[subjectId+date]`: existe no máximo um total por disciplina e dia, e gravar de novo substitui o total, sem somar.
- A semana é lida como um intervalo dessa chave (da segunda ao domingo de uma disciplina), sem carregar outros registros.
- A existência da disciplina é conferida na mesma transação que grava o registro.
- "Hoje" é obtido uma vez a partir do relógio local; os demais cálculos de calendário (início da semana, dias da semana, semanas anteriores) operam sobre ano, mês e dia em UTC, que não tem horário de verão.
- Não se registra tempo em datas posteriores à data local atual, nem mesmo dentro da semana corrente. A regra é aplicada no caso de uso de gravação, e não só na interface, que exibe esses dias como indisponíveis.
- O esquema passou à versão 3, que apenas acrescenta a tabela `studyTime`.

## Consequências

- Não há como registrar mais de um total para a mesma disciplina e data, nem somas acidentais.
- `00:00` não é um registro: para voltar ao estado sem registro, o registro é removido.
- Um registro guarda o dia do calendário, não um instante: o mesmo dado é exibido no mesmo dia em qualquer fuso.
- Sessões individuais, cronômetro ou horários de início e fim exigiriam um novo modelo; o total diário poderia, então, ser derivado delas.
- Consultas futuras por data em todas as disciplinas (por exemplo, um total semanal geral) precisarão de um índice em `date`, acrescentado em uma nova versão do esquema.
- O IndexedDB não garante integridade referencial: registros de uma disciplina que venha a ser excluída precisarão de uma regra própria quando a exclusão de disciplinas existir.
