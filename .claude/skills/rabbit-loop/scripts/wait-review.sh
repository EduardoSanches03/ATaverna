#!/usr/bin/env bash
# Espera o CodeRabbit terminar de revisar o commit atual do PR.
# Uso: wait-review.sh <pr> [timeout_em_segundos]
# Imprime uma linha: "<RESULTADO> <sha>", com RESULTADO em
#   APPROVED | CHANGES_REQUESTED | COMMENTED  (review publicada para o commit)
#   NO_NEW_REVIEW                             (revisou o commit sem publicar review nova)
#   TIMEOUT                                   (nada dentro do prazo)
set -euo pipefail

pr=$1
timeout=${2:-1500}
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
head=$(gh pr view "$pr" --json headRefOid -q .headRefOid)
bot='coderabbitai[bot]'
deadline=$((SECONDS + timeout))

while (( SECONDS < deadline )); do
  state=$(gh api --paginate "repos/$repo/pulls/$pr/reviews" 2>/dev/null \
    | jq -rs --arg bot "$bot" --arg head "$head" \
      '[.[][] | select(.user.login == $bot and .commit_id == $head)] | last | .state // empty' || true)
  if [[ -n $state ]]; then
    echo "$state $head"
    exit 0
  fi

  # Sem review nova: o comentário de resumo do CodeRabbit cita o commit e já não diz "processing".
  summary=$(gh api --paginate "repos/$repo/issues/$pr/comments" 2>/dev/null \
    | jq -rs --arg bot "$bot" '[.[][] | select(.user.login == $bot) | .body] | join("\n")' || true)
  if grep -q "$head" <<<"$summary" && ! grep -q 'Currently processing' <<<"$summary"; then
    echo "NO_NEW_REVIEW $head"
    exit 0
  fi

  sleep 30
done

echo "TIMEOUT $head"
