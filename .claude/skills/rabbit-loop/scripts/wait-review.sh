#!/usr/bin/env bash
# Espera o CodeRabbit terminar de revisar o commit atual do PR.
# Uso: wait-review.sh <pr> [desde]
#   desde: data ISO 8601 (UTC); só aceita review publicada depois dela. Use numa rodada sem push,
#          para não confundir a review antiga do mesmo commit com a reação às respostas.
# Prazo: variável WAIT_TIMEOUT em segundos (padrão 1500).
# Imprime uma linha: "<RESULTADO> <sha>", com RESULTADO em
#   APPROVED | CHANGES_REQUESTED | COMMENTED  (review publicada para o commit)
#   NO_NEW_REVIEW                             (revisou o commit sem publicar review nova; nunca com "desde")
#   TIMEOUT                                   (nada dentro do prazo)
set -euo pipefail

pr=$1
since=${2:-}
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
bot='coderabbitai[bot]'
deadline=$((SECONDS + ${WAIT_TIMEOUT:-1500}))

while (( SECONDS < deadline )); do
  # Relido a cada volta: um push durante a espera muda o commit que importa.
  head=$(gh pr view "$pr" --json headRefOid -q .headRefOid)

  state=$(gh api --paginate "repos/$repo/pulls/$pr/reviews" 2>/dev/null \
    | jq -rs --arg bot "$bot" --arg head "$head" --arg since "$since" '
        [.[][] | select(.user.login == $bot and .commit_id == $head and .submitted_at > $since)]
        | sort_by(.submitted_at) | last | .state // empty' || true)
  if [[ -n $state ]]; then
    echo "$state $head"
    exit 0
  fi

  if [[ -z $since ]]; then
    # Sem review nova: o resumo mais recente que cita o commit já não diz "processing".
    summary=$(gh api --paginate "repos/$repo/issues/$pr/comments" 2>/dev/null \
      | jq -rs --arg bot "$bot" --arg head "$head" '
          [.[][] | select(.user.login == $bot and (.body | contains($head)))]
          | sort_by(.updated_at) | last | .body // empty' || true)
    if [[ -n $summary ]] && ! grep -q 'Currently processing' <<<"$summary"; then
      echo "NO_NEW_REVIEW $head"
      exit 0
    fi
  fi

  sleep 30
done

echo "TIMEOUT $(gh pr view "$pr" --json headRefOid -q .headRefOid)"
