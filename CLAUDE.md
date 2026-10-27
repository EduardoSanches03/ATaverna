## Idioma

Sempre responda em português do Brasil (pt-BR) neste repositório.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`EduardoSanches03/ATaverna`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Review de PRs

Terminado um ticket, abra o PR (skill `mattpocock-skills:pr`, com `Closes #N`) e rode o skill `rabbit-loop` nele até a entrega que o skill define. A revisão final e o merge são do humano.
