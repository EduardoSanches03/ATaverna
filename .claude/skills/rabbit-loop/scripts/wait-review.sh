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
#   ERROR                                     (a API do GitHub falhou 5 vezes seguidas; sai com código 1)
set -euo pipefail

pr=$1
since=${2:-}
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
bot='coderabbitai[bot]'
deadline=$((SECONDS + ${WAIT_TIMEOUT:-1500}))
failures=0

fail() {
  failures=$((failures + 1))
  if (( failures >= 5 )); then
    echo "ERROR ${head:-?}"
    exit 1
  fi
  sleep 30
}

while (( SECONDS < deadline )); do
  # Relido a cada volta: um push durante a espera muda o commit que importa.
  head=$(gh pr view "$pr" --json headRefOid -q .headRefOid) || { fail; continue; }
  reviews=$(gh api --paginate "repos/$repo/pulls/$pr/reviews") || { fail; continue; }
  comments=$(gh api --paginate "repos/$repo/pulls/$pr/comments") || { fail; continue; }
  failures=0

  # Cada resposta do bot dentro de uma thread também vira uma review COMMENTED de corpo vazio.
  # Conta a review que tem corpo, veredito ou ao menos um comentário que não é resposta.
  state=$(jq -rs --arg bot "$bot" --arg head "$head" --arg since "$since" '
      (.[1] | map(.[]) | map(select(.in_reply_to_id == null) | .pull_request_review_id) | unique) as $with_findings
      | [.[0][][]
         | select(.user.login == $bot and .commit_id == $head and .submitted_at > $since)
         | select(.state != "COMMENTED" or (.body | length) > 0 or (.id | IN($with_findings[])))]
      | sort_by(.submitted_at) | last | .state // empty' \
    <(jq -s . <<<"$reviews") <(jq -s . <<<"$comments"))
  if [[ -n $state ]]; then
    echo "$state $head"
    exit 0
  fi

  if [[ -z $since ]]; then
    # Sem review nova: o resumo mais recente que cita o commit já não diz "processing".
    issue_comments=$(gh api --paginate "repos/$repo/issues/$pr/comments") || { fail; continue; }
    summary=$(jq -rs --arg bot "$bot" --arg head "$head" '
        [.[][] | select(.user.login == $bot and (.body | contains($head)))]
        | sort_by(.updated_at) | last | .body // empty' <<<"$issue_comments")
    if [[ -n $summary ]] && ! grep -q 'Currently processing' <<<"$summary"; then
      echo "NO_NEW_REVIEW $head"
      exit 0
    fi
  fi

  sleep 30
done

echo "TIMEOUT $(gh pr view "$pr" --json headRefOid -q .headRefOid)"
