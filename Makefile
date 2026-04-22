DOCKER_REGISTRY ?= docker.io
IMAGE_NAME_BACKEND = chatapp/backend
IMAGE_NAME_FRONTEND = chatapp/frontend
VERSION = latest

.PHONY: help build build-backend build-frontend push push-backend push-frontend \
        up down logs logs-backend logs-frontend test lint clean deploy health-check

help:
	@echo "Chat Application - Makefile Commands"
	@echo "======================================"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make build              - Build all Docker images"
	@echo "  make build-backend      - Build backend Docker image"
	@echo "  make build-frontend     - Build frontend Docker image"
	@echo "  make push               - Push all images to registry"
	@echo "  make push-backend       - Push backend image"
	@echo "  make push-frontend      - Push frontend image"
	@echo ""
	@echo "Docker Compose Commands:"
	@echo "  make up                 - Start all services (development)"
	@echo "  make down               - Stop all services"
	@echo "  make logs               - View logs from all services"
	@echo "  make logs-backend       - View backend logs"
	@echo "  make logs-frontend      - View frontend logs"
	@echo "  make restart            - Restart all services"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test               - Run all tests"
	@echo "  make test-backend       - Run backend tests"
	@echo "  make test-frontend      - Run frontend tests"
	@echo "  make lint               - Run linting for both"
	@echo "  make lint-backend       - Lint backend code"
	@echo "  make lint-frontend      - Lint frontend code"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-dev         - Deploy to development"
	@echo "  make deploy-staging     - Deploy to staging"
	@echo "  make health-check       - Run health checks"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean              - Clean up containers and images"
	@echo "  make prune              - Prune Docker system"
	@echo ""

# Docker build commands
build: build-backend build-frontend
	@echo "✓ All images built successfully"

build-backend:
	@echo "Building backend image..."
	docker build -t $(IMAGE_NAME_BACKEND):$(VERSION) -f backend/Dockerfile backend/
	@echo "✓ Backend image built: $(IMAGE_NAME_BACKEND):$(VERSION)"

build-frontend:
	@echo "Building frontend image..."
	docker build -t $(IMAGE_NAME_FRONTEND):$(VERSION) -f frontend/Dockerfile frontend/
	@echo "✓ Frontend image built: $(IMAGE_NAME_FRONTEND):$(VERSION)"

# Docker push commands
push: push-backend push-frontend
	@echo "✓ All images pushed successfully"

push-backend: build-backend
	@echo "Pushing backend image..."
	docker tag $(IMAGE_NAME_BACKEND):$(VERSION) $(DOCKER_REGISTRY)/$(IMAGE_NAME_BACKEND):$(VERSION)
	docker push $(DOCKER_REGISTRY)/$(IMAGE_NAME_BACKEND):$(VERSION)
	@echo "✓ Backend image pushed"

push-frontend: build-frontend
	@echo "Pushing frontend image..."
	docker tag $(IMAGE_NAME_FRONTEND):$(VERSION) $(DOCKER_REGISTRY)/$(IMAGE_NAME_FRONTEND):$(VERSION)
	docker push $(DOCKER_REGISTRY)/$(IMAGE_NAME_FRONTEND):$(VERSION)
	@echo "✓ Frontend image pushed"

# Docker compose commands
up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:4000"

down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

restart: down up

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Testing commands
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && npm test -- --passWithNoTests

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test -- --passWithNoTests

# Linting commands
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend code..."
	cd backend && npm run lint

lint-frontend:
	@echo "Linting frontend code..."
	cd frontend && npm run lint

# Deployment commands
deploy-dev: test lint build up health-check
	@echo "✓ Development deployment complete"

deploy-staging: test lint build
	@echo "Deploying to staging..."
	bash scripts/deploy.sh staging
	@echo "✓ Staging deployment complete"

health-check:
	@echo "Running health checks..."
	bash scripts/health-check.sh

# Cleanup commands
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v
	docker image prune -f
	@echo "✓ Cleanup complete"

prune:
	@echo "Pruning Docker system..."
	docker system prune -af
	@echo "✓ Prune complete"

# Development commands
dev-install:
	@echo "Installing dependencies..."
	cd backend && npm ci
	cd ../frontend && npm ci

dev-start:
	@echo "Starting development servers..."
	@sh -c 'cd backend && npm run dev &'
	@sh -c 'cd frontend && npm run dev &'
	@echo "✓ Development servers started"

dev-stop:
	@echo "Stopping development servers..."
	pkill -f "npm run dev"
	@echo "✓ Development servers stopped"
