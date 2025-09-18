# apps/api/Makefile
.PHONY: dev build start db seed e2e e2e-mac openapi-lint openapi-preview

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

db:
	pnpm prisma db push

seed:
	ORG=demo API_EMAIL=tester@example.com API_PASS=password123 pnpm prisma db seed

e2e:
	pnpm test:e2e

e2e-mac:
	mkdir -p .tmp/jest-cache && TMPDIR=$(pwd)/.tmp pnpm test:e2e -- --cacheDirectory $(pwd)/.tmp/jest-cache

openapi-lint:
	npx @redocly/cli lint openapi.yaml

openapi-preview:
	npx @redocly/cli preview-docs openapi.yaml -p 8088

-include Makefile.local