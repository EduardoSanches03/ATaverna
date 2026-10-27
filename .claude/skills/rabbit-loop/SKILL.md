---
name: rabbit-loop
description: Loop de review com o CodeRabbit num PR aberto. Use logo depois de abrir o PR de um ticket, ou quando pedirem para tratar a review do CodeRabbit. Espera a review, aplica ou contesta cada comentário, envia e repete até o CodeRabbit aprovar; então entrega o PR para a revisão final humana.
---

# Rabbit loop

O PR passa por **rodadas**: o CodeRabbit revisa, você trata cada thread aberta, envia, e ele revisa de novo. O loop termina quando o CodeRabbit **aprova** (ele aprova sozinho quando não resta thread aberta e o último commit foi revisado). A revisão final e o merge são do humano.

Argumento: o número do PR. Sem argumento, use o PR da branch atual (`gh pr view --json number -q .number`).

Os scripts ficam em `.claude/skills/rabbit-loop/scripts/`.

## Rodada

Máximo de **5 rodadas**. Na 6ª, vá direto para a entrega.

### 1. Esperar a review

Rode `wait-review.sh <pr>` com `run_in_background` e continue quando ele terminar. Depois de uma rodada sem push, passe também a data anotada no passo 4 (`wait-review.sh <pr> <desde>`), para esperar a reação às respostas e não a review antiga do mesmo commit. A linha impressa decide o próximo passo:

| Resultado | Próximo passo |
|---|---|
| `APPROVED` | Entrega |
| `CHANGES_REQUESTED`, `COMMENTED` | Passo 2 |
| `NO_NEW_REVIEW` | Passo 2. Se não houver thread aberta, entrega (o CodeRabbit revisou sem aprovar: diga isso na entrega) |
| `TIMEOUT` | Entrega, avisando que o CodeRabbit não respondeu |

### 2. Triar as threads

Rode `open-threads.sh <pr>` e decida cada thread contra a spec do ticket, o `GLOSSARY.md` e as ADRs:

- **Procede**: entra na correção do passo 3.
- **Não procede**: o comentário contraria a spec, uma ADR ou o contrato, ou não se aplica. Prepare uma resposta com o motivo técnico concreto, citando a fonte.
- **Já resolvida**: o código atual já atende (comum em thread desatualizada). Prepare uma resposta apontando onde.

Concluído quando toda thread aberta tem uma decisão.

### 3. Corrigir

Para cada thread que procede:

- **Mudança de comportamento**: siga o skill `mattpocock-skills:tdd`. Primeiro o teste que fica red pelo motivo que o comentário descreve, depois a correção até green.
- **Docs, config, tipos**: edite direto.

Concluído quando `pnpm test` e `pnpm typecheck` passam na raiz.

### 4. Enviar e responder

1. Com alguma correção: commit único da rodada, `fix: aplica review do CodeRabbit (rodada N)`, com um item por thread corrigida, e push. Sem correção (todas contestadas ou já resolvidas): sem commit nem push; anote a data atual (`date -u +%FT%TZ`) para o passo 1.
2. Para cada thread aberta, escreva a resposta num arquivo do scratchpad e rode `reply-and-resolve.sh <thread_id> <arquivo>`:
   - corrigida: o que mudou e o commit;
   - não procede ou já resolvida: a resposta preparada no passo 2.

Concluído quando `open-threads.sh <pr>` não lista nada. Volte ao passo 1.

## Entrega

Avise o humano com:

- o link do PR e o resultado (aprovado, limite de rodadas, revisado sem aprovação ou sem resposta);
- quantas rodadas rodaram e o que foi corrigido em cada uma;
- **as threads contestadas** (não procede ou já resolvida), com o motivo: são o que o humano mais precisa conferir.

A aprovação vem só da review do CodeRabbit sobre o código; o caminho para ela é corrigir ou contestar cada thread. Os comandos `@coderabbitai approve` e `@coderabbitai resolve` ficam de fora, porque pulam essa review. O merge é do humano.
