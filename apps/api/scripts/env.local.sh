export BASE="${BASE:-http://localhost:4010/v1}"
LOGIN_JSON=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@example.com","password":"Passw0rd!demo"}')
export TOKEN=$(echo "$LOGIN_JSON" | jq -r '.access_token // .token // empty')
echo "BASE=$BASE"
echo "TOKEN length: ${#TOKEN}"
