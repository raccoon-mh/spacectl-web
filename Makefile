# SpaceONE gRPC API Client - Makefile
# Simplified build and development commands

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Directories
CLIENT_DIR := client
SERVER_DIR := server
BINARY_NAME := spacectl-web
PORT := 8080
CONFIG_FILE := ~/.spaceone/environments/dev.yml

# Default target
.DEFAULT_GOAL := help

# Help
help: ## Show this help message
	@echo "$(BLUE)SpaceONE gRPC API Client - Available Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

# Build
build: ## Build client and server (creates single executable)
	@echo "$(BLUE)Building SpaceONE gRPC API Client...$(NC)"
	@echo "$(YELLOW)Building React client...$(NC)"
	cd $(CLIENT_DIR) && npm run build
	@echo "$(YELLOW)Copying client to server...$(NC)"
	cd $(SERVER_DIR) && rm -rf web && cp -r ../$(CLIENT_DIR)/build ./web
	@echo "$(YELLOW)Building Go server...$(NC)"
	cd $(SERVER_DIR) && go build -o ../$(BINARY_NAME)
	@echo "$(GREEN)Build complete! Binary: $(BINARY_NAME)$(NC)"

# Development
dev: ## Start development servers (client + server)
	@echo "$(BLUE)Starting development environment on port $(PORT)...$(NC)"
	@echo "$(YELLOW)Starting React dev server on port 3000...$(NC)"
	@echo "$(YELLOW)Backend API will be available at: http://localhost:$(PORT)$(NC)"
	cd $(CLIENT_DIR) && REACT_APP_API_URL=http://localhost:$(PORT) npm start &
	@echo "$(YELLOW)Starting Go server on port $(PORT)...$(NC)"
	cd $(SERVER_DIR) && go run main.go --port $(PORT) --config $(CONFIG_FILE) &
	@echo "$(GREEN)Development servers started!$(NC)"
	@echo "$(BLUE)React client: http://localhost:3000$(NC)"
	@echo "$(BLUE)Go server: http://localhost:$(PORT)$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all servers$(NC)"

# Start only the backend server
dev-server: ## Start only the backend server
	@echo "$(BLUE)Starting backend server on port $(PORT)...$(NC)"
	cd $(SERVER_DIR) && go run main.go --port $(PORT)

# Start only the frontend client
dev-client: ## Start only the frontend client
	@echo "$(BLUE)Starting frontend client on port 3000...$(NC)"
	@echo "$(YELLOW)Backend API will be available at: http://localhost:$(PORT)$(NC)"
	cd $(CLIENT_DIR) && REACT_APP_API_URL=http://localhost:$(PORT) npm start

# Clean
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	cd $(CLIENT_DIR) && rm -rf build node_modules/.cache
	cd $(SERVER_DIR) && rm -rf web
	rm -f $(BINARY_NAME)
	@echo "$(GREEN)Clean complete!$(NC)"

.PHONY: help build dev clean