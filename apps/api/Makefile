.PHONY: api.login api.products api.smoke

api.login:
	@cd apps/api && source scripts/api-helpers.sh && api_login "$$API_EMAIL" "$$API_PASS" >/dev/null && echo "logged in"

api.products:
	@cd apps/api && source scripts/api-helpers.sh && aget "$$BASE/products" -d page=1 -d limit=10 | jq .

api.smoke:
	@./scripts/smoke.sh
