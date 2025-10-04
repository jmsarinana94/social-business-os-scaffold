# ==== Shell & Make defaults ================================================
SHELL := /bin/bash
.SHELLFLAGS := -Eeuo pipefail -c
.ONESHELL:
.DEFAULT_GOAL := help

# ==== Phony targets =========================================================
.PHONY: help dev build start db seed e2e e2e-mac openapi-lint openapi-preview \
        login check-env status reset demo errors heavy zero sdk \
        seed-deterministic load ship-demo openapi-validate

# ==== Paths / Config ========================================================
APP_DIR ?= .
SCRIPTS := $(APP_DIR)/scripts
API_SH  := $(APP_DIR)/api.sh
OPENAPI := $(APP_DIR)/openapi.yaml
SDK_OUT := $(APP_DIR)/sdks

# ==== Helper to print nice headers =========================================
define _print_header
	@printf "\n\033[1;36m==> %s\033[0m\n" "$(1)"
endef

# ==== Basic project commands ===============================================
dev:          ## Run dev server
	pnpm dev

build:        ## Build the app
	pnpm build

start:        ## Start the app
	pnpm start

db:           ## Push Prisma schema to DB
	pnpm prisma db push

seed:         ## Seed DB (demo org)
	ORG=demo API_EMAIL=tester@example.com API_PASS=password123 pnpm prisma db seed

e2e:          ## Run end-to-end tests
	pnpm test:e2e

e2e-mac:      ## Run e2e with a tmp cache (macOS-friendly)
	mkdir -p .tmp/jest-cache && TMPDIR=$(pwd)/.tmp pnpm test:e2e -- --cacheDirectory $(pwd)/.tmp/jest-cache

openapi-lint: ## Lint OpenAPI
	npx @redocly/cli lint $(OPENAPI)

openapi-preview: ## Preview OpenAPI docs on :8088
	npx @redocly/cli preview-docs $(OPENAPI) -p 8088

openapi-validate: ## Validate openapi.yaml (requires swagger-cli)
	@if command -v swagger-cli >/dev/null; then \
		swagger-cli validate $(OPENAPI); \
	else echo "install swagger-cli: npm i -g swagger-cli"; fi

# ==== Meta / Help ===========================================================
help: ## Show targets (includes Makefile.local if present)
	@awk 'BEGIN {FS":.*?## "; printf "\nTargets:\n"} \
	     /^[a-zA-Z0-9_%-]+:.*?## / { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' Makefile
	@if [ -f Makefile.local ]; then \
	  echo "Local targets (Makefile.local):"; \
	  awk 'BEGIN {FS":.*?## "} \
	       /^[a-zA-Z0-9_%-]+:.*?## / { printf "  \033[36m%-26s\033[0m %s\n", $$1, $$2 }' Makefile.local; \
	fi

check-env: ## Fail fast if env missing
	@if [[ -z "$$BASE" || -z "$$EMAIL" ]]; then \
		echo "❌ Missing BASE or EMAIL. Run: direnv allow"; exit 1; \
	fi

login: check-env ## Ensure TOKEN is present (via api.sh)
	@source $(API_SH); login_api

status: ## Snapshot inventory + last order + details
	@source ./api.sh; status_snapshot

# ==== Golden-path demo flows ===============================================
reset: login ## Reset demo inventory for both SKUs to 25
	@$(call _print_header,"Resetting demo inventory to 25")
	source $(API_SH); seed_demo_data ORGDEMO-MUG-GREEN "Green Mug" 13.50 25; seed_plain_mug; products_min

demo: login ## Seed → scripted demo flow (if provided by api.sh)
	@$(call _print_header,"Running API demo flow...")
	source $(API_SH); if declare -F demo_flow >/dev/null; then demo_flow; else echo "demo_flow not found in api.sh"; fi

errors: login ## Prove guardrails return 400s
	@$(call _print_header,"Error smoke: guardrails")
	source $(API_SH); error_smoke

heavy: login ## 3 orders + roll-up snapshots
	@$(call _print_header,"Heavy smoke: seed + 3 orders + snapshots")
	source $(API_SH); heavy_smoke

zero: login ## Drain demo SKU to zero and show 400
	@$(call _print_header,"Draining demo SKU to zero")
	source $(API_SH); exhaust_to_zero; products_min

# ==== Developer Experience / Tooling =======================================
sdk: ## Generate SDKs & types from OpenAPI into $(SDK_OUT)
	@$(call _print_header,"Generating SDKs from OpenAPI")
	mkdir -p $(SDK_OUT)
	npx --yes openapi-typescript $(OPENAPI) --output $(SDK_OUT)/types.ts
	npx --yes @hey-api/openapi-ts --input $(OPENAPI) --output $(SDK_OUT)/node --client fetch
	if command -v openapi-generator >/dev/null; then \
	  openapi-generator generate -i $(OPENAPI) -g python -o $(SDK_OUT)/python; \
	fi
	@echo "✅ SDKs in $(SDK_OUT)"

seed-deterministic: login ## Seed fixed, repeatable data for demos
	@$(call _print_header,"Seeding deterministic data")
	source $(API_SH); seed_demo_data ORGDEMO-MUG-GREEN "Green Mug" 13.50 25; seed_plain_mug; products_min

load: login ## Lightweight load test (see scripts/load_test.sh)
	@$(call _print_header,"Running lightweight load test")
	bash $(SCRIPTS)/load_test.sh

ship-demo: ## Record a 90s demo and save to ./demo.mp4
	@$(call _print_header,"Recording 90-second demo (scripted)")
	bash $(SCRIPTS)/record_demo.sh

# ==== Local overrides (optional) ===========================================
-include Makefile.local