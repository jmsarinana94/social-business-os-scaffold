# scripts/env.zsh
set +H; histchars=; setopt INTERACTIVE_COMMENTS
export BASE='http://localhost:4010/v1'
export EMAIL='tester@example.com'
export PASS='Passw0rd!demo'
auth() { echo "Authorization: Bearer $TOKEN"; }