## Idioma

Sempre responda em português do Brasil (pt-BR) neste repositório.

## Implementação de tickets

Todo ticket (issue) é resolvido com o skill `mattpocock-skills:tdd`, carregado antes de escrever qualquer código: ciclo red → green, um teste por vez, só nos pontos de teste definidos na spec (hoje, a API HTTP contra Postgres real).

Cada comportamento é testado nos cenários bons e nos ruins: além do caminho feliz, os testes cobrem entradas inválidas, acesso negado, recurso inexistente e falha de dependência (como o banco fora do ar), verificando o status e o corpo da resposta.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`EduardoSanches03/ATaverna`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
