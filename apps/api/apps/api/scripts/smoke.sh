set -euo pipefail

BASE=http://localhost:4000
ORG=demo
EMAIL="tester+$(date +%s)@example.com"
PASSWORD="password"

echo "1) Health…"
curl -sS "$BASE/health" | jq .

echo "2) Register (500 is okay on re-run with same email)…"
curl -sS -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" -H "x-org: $ORG" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Tester\"}" | jq .

echo "3) Login…"
TOK=$(curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -H "x-org: $ORG" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -er '.access_token')
echo "TOKEN: ${TOK:0:20}…"

echo "4) Create product…"
PID=$(curl -sS -X POST "$BASE/products" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Widget\",\"sku\":\"SKU-$RANDOM\",\"type\":\"physical\",\"status\":\"active\",\"price\":10,\"inventoryQty\":5,\"description\":\"Smoke\"}" \
  | jq -er '.data.id')
echo "ID=$PID"

echo "5) Get…"
curl -sS "$BASE/products/$PID" -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "6) Update…"
curl -sS -X PUT "$BASE/products/$PID" \
  -H "Authorization: Bearer $TOK" -H "x-org: $ORG" \
  -H "Content-Type: application/json" \
  -d '{"title":"Widget (updated)","price":15,"inventoryQty":20}' | jq .

echo "7) List…"
# Any of these three lines is fine; keeping the first:
curl -sS "$BASE/products?page=1&limit=10" -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "8) Delete…"
curl -sS -X DELETE "$BASE/products/$PID" -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "9) Confirm 404 after delete…"
curl -sS "$BASE/products/$PID" -H "Authorization: Bearer $TOK" -H "x-org: $ORG" | jq .

echo "🎉 Smoke test complete!"
