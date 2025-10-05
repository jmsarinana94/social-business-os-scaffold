# Makefile — Social Business OS (API helpers)
# Place this file at the repo root: social-business-os-scaffold-v0.2/Makefile
# Requires: direnv (loads .envrc/.envrc.local), jq, curl, bash
# Notes:
# - All API calls run inside apps/api/ and source scripts/api-helpers.sh
# - Environment is expected from direnv or your shell:
#     API_EMAIL, API_PASS, BASE, ORG
# - Override defaults at runtime, e.g.: make api.products PAGE=2 LIMIT=20

SHELL := /bin/bash
.ONESHELL:
.SILENT: help
.PHONY: help api.env api.login api.token api.health api.products \
        api.product.create api.product.get api.product.update \
        api.product.delete api.smoke

# Default list paging (override on the command line)
PAGE  ?= 1
LIMIT ?= 10

# Helper: run a command inside apps/api with helpers sourced
define run_api
	cd apps/api ; \
	source scripts/api-helpers.sh ; \
	ensure_tok "$${API_EMAIL}" "$${API_PASS}" ; \
	$(1)
endef

help:
	echo "Usage:"
	echo "  make api.env                # Show current API env (email, pass, base, org)"
	echo "  make api.login              # Login and cache token"
	echo "  make api.token              # Print token prefix (sanity check)"
	echo "  make api.health             # GET /health"
	echo "  make api.products           # List products (PAGE, LIMIT override)"
	echo "  make api.product.create     # Create product (random SKU)"
	echo "  make api.product.get ID=<uuid>"
	echo "  make api.product.update ID=<uuid> [TITLE=.. PRICE=.. QTY=..]"
	echo "  make api.product.delete ID=<uuid>"
	echo "  make api.smoke              # Run scripted smoke test (scripts/api-smoke.sh)"
	echo ""
	echo "Env vars (via direnv or shell): API_EMAIL, API_PASS, BASE, ORG"

api.env:
	# Print effective env from apps/api direnv context
	cd apps/api ; \
	direnv exec . bash -lc ' \
	  echo EMAIL=$${API_EMAIL} ; \
	  echo PASS=$${API_PASS} ; \
	  echo BASE=$${BASE} ; \
	  echo ORG=$${ORG} \
	'

api.login:
	$(call run_api, api_login "$${API_EMAIL}" "$${API_PASS}" && echo "logged in")

api.token:
	$(call run_api, printf "BASE=%s\nORG=%s\nEMAIL=%s\nTOK_PREFIX=%s\n" \
	  "$${BASE}" "$${ORG}" "$${API_EMAIL}" "$${TOK:0:12}")

api.health:
	$(call run_api, aget "$${BASE}/health" | jq .)

api.products:
	$(call run_api, aget "$${BASE}/products?page=$(PAGE)&limit=$(LIMIT)" | jq .)

# Create a product with a unique, time-based SKU
# Optional overrides at call-time:
#   TITLE="Gadget" TYPE="physical" STATUS="active" PRICE=19 QTY=7 DESC="from Make"
TITLE  ?= Widget
TYPE   ?= physical
STATUS ?= active
PRICE  ?= 10
QTY    ?= 5
DESC   ?= CLI create
api.product.create:
	$(call run_api, \
	  SKU="SKU-$$(date +%s)" ; \
	  CREATE_JSON=$$(jq -n --arg sku "$$SKU" \
	    --arg title "$(TITLE)" --arg type "$(TYPE)" \
	    --arg status "$(STATUS)" --arg desc "$(DESC)" \
	    --argjson price $(PRICE) --argjson qty $(QTY) \
	    '{sku:$$sku,title:$$title,type:$$type,status:$$status,price:$$price,inventoryQty:$$qty,description:$$desc}'); \
	  ID=$$(apost "$$BASE/products" -d "$$CREATE_JSON" | tee /dev/stderr | jq -r '.data.id // .id // empty'); \
	  test -n "$$ID" || { echo "Create failed (no ID returned)"; exit 1; } ; \
	  echo "ID=$$ID" )

# Get one product: make api.product.get ID=<uuid>
api.product.get:
	@if [ -z "$(ID)" ]; then echo "Usage: make $@ ID=<uuid>"; exit 2; fi
	$(call run_api, aget "$${BASE}/products/$(ID)" | jq .)

# Update one product:
#   make api.product.update ID=<uuid> [TITLE="Widget (updated)"] [PRICE=15] [QTY=20]
api.product.update:
	@if [ -z "$(ID)" ]; then echo "Usage: make $@ ID=<uuid> [TITLE=.. PRICE=.. QTY=..]"; exit 2; fi
	$(call run_api, \
	  J=$$(jq -n \
	    --arg title "$(or $(TITLE),Widget (updated))" \
	    --argjson price $(or $(PRICE),15) \
	    --argjson qty $(or $(QTY),20) \
	    '{title:$$title,price:$$price,inventoryQty:$$qty}'); \
	  aput "$$BASE/products/$(ID)" -d "$$J" | jq .)

# Delete one product: make api.product.delete ID=<uuid>
api.product.delete:
	@if [ -z "$(ID)" ]; then echo "Usage: make $@ ID=<uuid>"; exit 2; fi
	$(call run_api, adel "$${BASE}/products/$(ID)" | jq .)

# Run the smoke test script if present; otherwise execute an inline smoke flow
api.smoke:
	@if [ -x apps/api/scripts/api-smoke.sh ]; then \
	  cd apps/api && ./scripts/api-smoke.sh ; \
	else \
	  echo "scripts/api-smoke.sh not found or not executable; running inline smoke..." ; \
	  $(MAKE) --no-print-directory _inline_smoke ; \
	fi

# Internal: inline smoke sequence (create → get → update → list → delete → 404)
_inline_smoke:
	$(call run_api, \
	  echo "1) Health…" ; aget "$$BASE/health" | jq . ; \
	  echo "2) Login…" ; api_login "$$API_EMAIL" "$$API_PASS" >/dev/null ; \
	  echo "3) Create…" ; SKU="SKU-$$(date +%s)" ; \
	    CREATE_JSON=$$(jq -n --arg sku "$$SKU" '{sku:$$sku,title:"Widget",type:"physical",status:"active",price:10,inventoryQty:5,description:"Smoke"}'); \
	    ID=$$(apost "$$BASE/products" -d "$$CREATE_JSON" | jq -r '.data.id // .id // empty'); \
	    echo "ID=$$ID" ; \
	  echo "4) Get…" ; aget "$$BASE/products/$$ID" | jq . ; \
	  echo "5) Update…" ; UPDATE_JSON='{"title":"Widget (updated)","price":15,"inventoryQty":20}' ; \
	    aput "$$BASE/products/$$ID" -d "$$UPDATE_JSON" | jq . ; \
	  echo "6) List…" ; aget "$$BASE/products?page=1&limit=10" | jq . ; \
	  echo "7) Delete…" ; adel "$$BASE/products/$$ID" | jq . ; \
	  echo "8) Confirm 404…" ; aget "$$BASE/products/$$ID" | jq . ; \
	  echo "🎉 Smoke test complete!" \
	)

# Tiny helper to emulate an "or" for jq-typed defaults in update
# Usage: $(or $(VAR),default)
or = $(firstword $(strip $1) $(strip $2))

# Simple helpers for apps/api
API_DIR := apps/api
BASE    ?= http://localhost:4000
ORG     ?= demo
EMAIL   ?= tester@example.com
PASS    ?= password123

.PHONY: help
help:
	@echo "Targets:"
	@echo "  make api.build        - nest build"
	@echo "  make api.start        - node dist/src/main.js"
	@echo "  make api.stop         - kill anything listening on :4000"
	@echo "  make prisma.push      - prisma db push"
	@echo "  make prisma.seed      - seed demo user/org"
	@echo "  make e2e              - run api e2e tests"
	@echo "  make smoke            - run smoke script (auth & no-auth)"
	@echo "  make smoke.auth       - run smoke with EMAIL/PASS"

.PHONY: api.build
api.build:
	cd $(API_DIR) && pnpm build

.PHONY: api.start
api.start:
	cd $(API_DIR) && node dist/src/main.js

.PHONY: api.stop
api.stop:
	- lsof -ti :4000 | xargs kill -9 2>/dev/null || true

.PHONY: prisma.push
prisma.push:
	cd $(API_DIR) && pnpm prisma db push

.PHONY: prisma.seed
prisma.seed:
	cd $(API_DIR) && ORG=$(ORG) API_EMAIL=$(EMAIL) API_PASS=$(PASS) pnpm prisma db seed

.PHONY: e2e
e2e:
	cd $(API_DIR) && mkdir -p .tmp/jest-cache && TMPDIR=$$(pwd)/.tmp pnpm -F @repo/api test:e2e --cacheDirectory $$(pwd)/.tmp/jest-cache

.PHONY: smoke
smoke:
	cd $(API_DIR) && BASE=$(BASE) ORG=$(ORG) ./scripts/smoke.sh

.PHONY: smoke.auth
smoke.auth:
	cd $(API_DIR) && BASE=$(BASE) ORG=$(ORG) EMAIL=$(EMAIL) PASS=$(PASS) ./scripts/smoke.sh

API ?= http://localhost:4001/v1
ORG ?= org_demo
EMAIL ?= you@example.com
PASS ?= test1234

export API ORG EMAIL PASS

.PHONY: login seed list
login:
	@scripts/demo.sh login

seed:
	@scripts/demo.sh seed

list:
	@scripts/demo.sh list

# Run the full demo: login + seed demo products + list products
demo: login
	@echo "🚀 Running demo (login + seed + list)…"
	./scripts/demo_seed.sh
	$(MAKE) list

.PHONY: orders.demo
orders.demo:
	@echo "Running demo checkout…"
	@./scripts/demo_checkout.sh

.PHONY: orders.list
orders.list:
	@./scripts/login.sh >/dev/null 2>&1 || true
	@TOKEN=$$(cat .token 2>/dev/null || echo "") ;\
	if [ -z "$$TOKEN" ]; then echo "No token. Run 'make login' first."; exit 1; fi ;\
	curl -sS "$${API:-http://localhost:4001/v1}/orders" \
	  -H "authorization: Bearer $$TOKEN" \
	  -H "x-org-id: $${ORG:-org_demo}" | jq .

orders.demo:
	@echo "Running demo checkout…"
	@API?=http://localhost:4001/v1 ORG?=org_demo EMAIL?=you@example.com PASS?=test1234 \
	bash ./scripts/demo_checkout.sh

db.reset:
	@echo "⚠️  Dropping and recreating public schema (dev only)…"
	docker compose exec -T db psql -U postgres -d sbo -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

prisma.deploy:
	@echo "Running prisma deploy inside api container…"
	docker compose exec -T api sh -lc '\
	  corepack enable >/dev/null 2>&1 || true; \
	  npx --yes prisma@6.14.0 migrate deploy --schema=prisma/schema.prisma || \
	  npx --yes prisma@6.14.0 db push --schema=prisma/schema.prisma; \
	  npx --yes prisma@6.14.0 generate --schema=prisma/schema.prisma \
	'