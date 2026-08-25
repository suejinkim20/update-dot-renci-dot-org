# 📦 Load environment variables
LOCAL_ENV_FILE ?= .env.local
PROD_ENV_FILE  ?= .env.production
ENV_FILE       ?= $(LOCAL_ENV_FILE)

ifneq (,$(wildcard $(ENV_FILE)))
  include $(ENV_FILE)
  export
endif

# =============================================================================
# 🤖 AUTOPHONY
# =============================================================================

.PHONY: help check version build run stop rebuild logs logs-follow ps push helm-lint helm-template helm-status helm-down deploy deploy-prod release

# =============================================================================
# 📌 CONSTANTS
# =============================================================================

.DEFAULT_GOAL := help

REGISTRY      := containers.renci.org
FRONTEND_IMG  := $(REGISTRY)/comms/renci-update-frontend
BACKEND_IMG   := $(REGISTRY)/comms/renci-update-backend
NAMESPACE     ?= comms
HELM_RELEASE  := renci-update
HELM_CHART    := ./helm

# Detect host architecture and set platform flag for cross-compilation
ARCH := $(shell uname -m)
ifeq ($(ARCH), arm64)
  PLATFORM_FLAG := --platform linux/amd64
else
  PLATFORM_FLAG :=
endif
# Read current version from Chart.yaml (single source of truth)
CURRENT_VERSION := $(shell grep '^appVersion:' $(HELM_CHART)/Chart.yaml | awk '{print $$2}' | tr -d '"')

# Detect host architecture and set platform flag for cross-compilation
ARCH := $(shell uname -m)
ifeq ($(ARCH), arm64)
  PLATFORM_FLAG := --platform linux/amd64
else
  PLATFORM_FLAG :=
endif

# =============================================================================
# ✅ CHECKS
# =============================================================================

check: check-vars-AD_AUTHORITY check-vars-AD_CLIENT_ID check-vars-PUBLIC_BASE_URL check-vars-SESSION_SECRET check-vars-GRAPHQL_ENDPOINT check-vars-MONDAY_API_KEY check-vars-MONDAY_BOARD_ID ## ✅ Check all required env vars are set
	@echo "✅ All required environment variables are set."

# ⚠️ Fail if a required variable is not set
check-vars-%:
	@if [ -z "$(value $*)" ]; then \
		echo "❌ Error: '$*' is required but not set."; \
		echo "💡 Define it in $(ENV_FILE) or pass it directly: make $@ $*=<value>"; \
		exit 1; \
	fi

##@ Help

help: ## 📖 Show this help
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z0-9_.-]+:.*?##/ {printf "  • \033[36m%-22s\033[0m %s\n", $$1, $$2}; /^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)}' $(MAKEFILE_LIST)
	@echo ""
	@echo "  📌 Current version: \033[33m$(CURRENT_VERSION)\033[0m"
	@echo "  📦 Env file:        \033[33m$(ENV_FILE)\033[0m"
	@echo ""

##@ Versioning

version: ## 🔖 Bump version everywhere — usage: make version VERSION=x.y.z
ifndef VERSION
	$(error ❌ VERSION is required — usage: make version VERSION=x.y.z)
endif
	@echo "🔖 Bumping version to $(VERSION)"
	@sed -i.bak 's/^version: .*/version: $(VERSION)/'         $(HELM_CHART)/Chart.yaml
	@sed -i.bak 's/^appVersion: .*/appVersion: "$(VERSION)"/' $(HELM_CHART)/Chart.yaml
	@sed -i.bak 's/tag: .*/tag: "$(VERSION)"/g'               $(HELM_CHART)/values.yaml
	@sed -i.bak 's/"version": ".*"/"version": "$(VERSION)"/'  package.json
	@node -e "\
		const fs = require('fs');\
		const pkg = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));\
		pkg.version = '$(VERSION)';\
		pkg.packages[''].version = '$(VERSION)';\
		fs.writeFileSync('package-lock.json', JSON.stringify(pkg, null, 2) + '\n');\
		"
	@rm -f $(HELM_CHART)/Chart.yaml.bak $(HELM_CHART)/values.yaml.bak package.json.bak
	@echo "✅ Version updated to $(VERSION) in Chart.yaml, values.yaml, package.json, and package-lock.json"

##@ Local Docker

build: ## 🛠️  Build frontend and backend images
	@echo "🧱 Building images at version $(CURRENT_VERSION) (arch: $(ARCH), env: $(ENV_FILE))"
	docker buildx build $(PLATFORM_FLAG) \
		-f frontend/Dockerfile -t $(FRONTEND_IMG):$(CURRENT_VERSION) .
	docker buildx build $(PLATFORM_FLAG) \
		-f backend/Dockerfile -t $(BACKEND_IMG):$(CURRENT_VERSION) .
	@echo "✅ Images built"
	
run: ## ▶️  Start backend then frontend containers
	@echo "🚀 Starting backend with $(ENV_FILE)"
	docker run --rm -d \
		-p 3001:3001 \
		--name renci-backend \
		--env-file $(ENV_FILE) \
		$(BACKEND_IMG):$(CURRENT_VERSION)
	@echo "🚀 Starting frontend"
	docker run --rm -d \
		--name renci-frontend \
		--network container:renci-backend \
		$(FRONTEND_IMG):$(CURRENT_VERSION)
	@echo "✅ Containers running — visit http://localhost (VPN required)"

stop: ## 🛑 Stop frontend then backend containers
	@echo "🛑 Stopping containers"
	docker stop renci-frontend renci-backend
	@echo "✅ Containers stopped"

rebuild: stop build run ## 🔄 Stop, rebuild, and restart containers

logs: ## 📋 Show logs from both containers
	@echo "--- 🖥️  backend logs ---"
	docker logs renci-backend
	@echo "--- 🌐 frontend logs ---"
	docker logs renci-frontend

logs-follow: ## 📡 Follow backend logs in real time (Ctrl+C to exit)
	docker logs -f renci-backend

ps: ## 🔍 List running containers
	docker ps

##@ Registry

push: ## 📤 Push both images to containers.renci.org
	@echo "🔐 Logging in to $(REGISTRY)"
	docker login containers.renci.org
	@echo "📤 Pushing images at version $(CURRENT_VERSION)"
	docker push $(FRONTEND_IMG):$(CURRENT_VERSION)
	docker push $(BACKEND_IMG):$(CURRENT_VERSION)
	@echo "✅ Images pushed"

##@ Helm

helm-lint: ## 🔎 Lint the Helm chart
	@echo "🔎 Linting Helm chart"
	helm lint $(HELM_CHART)

helm-template: ## 📄 Dry-run template render (useful before deploying)
	@echo "📄 Templating Helm chart"
	helm template $(HELM_RELEASE) $(HELM_CHART) --namespace $(NAMESPACE)

helm-status: ## 📊 Check status of the Helm release
	@echo "📊 Checking Helm release status"
	helm status $(HELM_RELEASE) --namespace $(NAMESPACE)

helm-down: ## 🗑️  Uninstall the Helm release
	@echo "⬇️  Uninstalling $(HELM_RELEASE) from namespace $(NAMESPACE)"
	helm uninstall $(HELM_RELEASE) --namespace $(NAMESPACE)

deploy: ## 🚀 Deploy to Kubernetes via Helm (reads secrets from $(PROD_ENV_FILE))
	@$(MAKE) deploy-prod ENV_FILE=$(PROD_ENV_FILE)

deploy-prod: check ## 🚀 Internal production deploy target
	@echo "⬆️  Deploying $(HELM_RELEASE) to namespace $(NAMESPACE) at version $(CURRENT_VERSION)"
	helm upgrade --install $(HELM_RELEASE) $(HELM_CHART) \
		-n $(NAMESPACE) \
		--set secrets.AD_AUTHORITY=$(AD_AUTHORITY) \
		--set secrets.AD_CLIENT_ID=$(AD_CLIENT_ID) \
		--set secrets.AD_CLIENT_SECRET=$(AD_CLIENT_SECRET) \
		--set secrets.AD_SCOPE=$(AD_SCOPE) \
		--set secrets.PUBLIC_BASE_URL=$(PUBLIC_BASE_URL) \
		--set secrets.GRAPHQL_ENDPOINT=$(GRAPHQL_ENDPOINT) \
		--set secrets.GRAPHQL_AUTH_HEADER=$(GRAPHQL_AUTH_HEADER) \
		--set secrets.MONDAY_API_KEY=$(MONDAY_API_KEY) \
		--set secrets.MONDAY_BOARD_ID=$(MONDAY_BOARD_ID) \
		--set secrets.SESSION_SECRET=$(SESSION_SECRET) \
		--set secrets.MONDAY_COL_STATUS=$(MONDAY_COL_STATUS) \
		--set secrets.MONDAY_COL_DATE=$(MONDAY_COL_DATE) \
		--set secrets.MONDAY_COL_CONTENT_TYPE=$(MONDAY_COL_CONTENT_TYPE) \
		--set secrets.MONDAY_COL_DESCRIPTION=$(MONDAY_COL_DESCRIPTION) \
		--set secrets.MONDAY_COL_ITEM_NAME=$(MONDAY_COL_ITEM_NAME) \
		--set secrets.MONDAY_COL_ASSIGNED_PERSON=$(MONDAY_COL_ASSIGNED_PERSON) \
		--set secrets.MONDAY_COL_SUBMITTER_EMAIL=$(MONDAY_COL_SUBMITTER_EMAIL) \
		--set secrets.MONDAY_COL_WORDPRESS_LINK=$(MONDAY_COL_WORDPRESS_LINK) \
		--set secrets.MONDAY_COL_OPERATION=$(MONDAY_COL_OPERATION) \
		--set secrets.MONDAY_COL_DUE_DATE=$(MONDAY_COL_DUE_DATE) \
		--set secrets.MONDAY_SUBITEM_COL_CONTENT=$(MONDAY_SUBITEM_COL_CONTENT)
	@echo "✅ Helm deploy complete — verifying pods"
	kubectl get pods -n $(NAMESPACE) | grep $(HELM_RELEASE)

##@ Convenience

release: ## 🎉 Full release — usage: make release VERSION=x.y.z
ifndef VERSION
	$(error ❌ VERSION is required — usage: make release VERSION=x.y.z)
endif
	@$(MAKE) version VERSION=$(VERSION)
	@$(MAKE) build
	@$(MAKE) push
	@$(MAKE) deploy
