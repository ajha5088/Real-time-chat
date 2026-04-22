# Quick Start Guide - CI/CD Pipeline

## 🚀 Get Started in 5 Minutes

### 1. **Initial Setup**

```bash
# Clone repository
git clone <your-repo-url>
cd chat-app

# Copy environment file
cp .env.example .env

# Make scripts executable
chmod +x scripts/*.sh
```

### 2. **Start Development Environment**

```bash
# Option A: Using docker-compose
docker-compose up -d

# Option B: Using make
make up

# Option C: Using script
bash scripts/deploy.sh development
```

### 3. **Verify Services are Running**

```bash
# Check health
bash scripts/health-check.sh

# Or using make
make health-check
```

### 4. **Access the Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- MongoDB: mongodb://localhost:27017
- PostgreSQL: postgresql://localhost:5432

---

## 📋 Common Commands

### Development

```bash
# Install dependencies
make dev-install

# Start dev servers (local)
make dev-start

# Stop dev servers
make dev-stop
```

### Testing & Quality

```bash
# Run all tests
make test

# Run backend tests
make test-backend

# Run frontend tests
make test-frontend

# Lint code
make lint
```

### Docker (Build & Push)

```bash
# Build images
make build

# Push to registry
make push

# Build only backend
make build-backend

# Build only frontend
make build-frontend
```

### Docker Compose (Operations)

```bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# View backend logs only
make logs-backend

# Restart services
make restart
```

### Full Deployment

```bash
# Development: Test → Lint → Build → Run
make deploy-dev

# Staging: Test → Lint → Build → Deploy
make deploy-staging

# Health check
make health-check
```

### Cleanup

```bash
# Clean up containers and volumes
make clean

# Prune all Docker images
make prune
```

---

## 🐳 Docker Commands (Manual)

```bash
# Build images
docker build -t chatapp/backend:latest -f backend/Dockerfile backend/
docker build -t chatapp/frontend:latest -f frontend/Dockerfile frontend/

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View running containers
docker-compose ps
```

---

## 🔧 Jenkins Setup

### Prerequisites

- Jenkins v2.361+
- Docker Plugin
- Pipeline Plugin

### Configuration

1. Create new **Pipeline** job
2. Configure repository and branch
3. Set script path to `Jenkinsfile`
4. Add Docker credentials:
   - `docker-username`
   - `docker-password`
5. Enable webhook from GitHub/GitLab

### Trigger Pipeline

```bash
# Automatic triggers:
- On push to main branch
- On tag push (v1.0.0)

# Manual triggers:
- Click "Build Now" in Jenkins UI
```

---

## 📊 Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│                    GIT COMMIT                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             1. CHECKOUT & INSTALL                        │
│  - Clone repository                                      │
│  - Install backend & frontend dependencies (parallel)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           2. LINT & CODE QUALITY                         │
│  - Backend ESLint                                        │
│  - Frontend ESLint (parallel)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              3. TEST                                     │
│  - Backend Jest tests                                    │
│  - Frontend tests (parallel)                             │
│  - Generate coverage reports                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           4. BUILD DOCKER IMAGES                        │
│  - Build backend (multi-stage)                           │
│  - Build frontend (multi-stage) (parallel)              │
│  - Tag with commit hash and latest                      │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────────┬──────────────┐
         │                          │              │
         ▼                          ▼              ▼
  ┌──────────────┐    ┌──────────────────────┐ ┌──────────┐
  │ Main Branch  │    │ Staging Deployment   │ │   Tags   │
  │              │    │ (optional)            │ │ (v1.0.0) │
  └────┬─────────┘    └──────┬───────────────┘ └────┬─────┘
       │                     │                      │
       ▼                     ▼                      ▼
  ┌──────────────┐    ┌──────────────────────┐ ┌──────────────────┐
  │ Push Images  │    │ Deploy with          │ │ Manual Approval  │
  │ to Registry  │    │ docker-compose       │ │ → Production     │
  └──────────────┘    │ Health checks        │ └──────────────────┘
                      └──────────────────────┘
```

---

## 🔐 Environment Variables

Create `.env` file:

```env
# Application
NODE_ENV=production
PORT=4000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chatdb
DB_USER=chatuser
DB_PASSWORD=chatpass

# MongoDB
MONGODB_URI=mongodb://mongouser:mongopass@mongodb:27017/chatdb

# Redis
REDIS_URL=redis://redis:6379

# Neo4j
NEO4J_URI=neo4j://neo4j:7687
NEO4J_PASSWORD=password

# JWT
JWT_SECRET=your_secret_key_here

# Docker Registry
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_password
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Docker Image Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t chatapp/backend:latest -f backend/Dockerfile backend/
```

### Services Not Healthy

```bash
# Check logs
docker-compose logs -f

# Restart services
docker-compose restart

# Full cleanup and restart
docker-compose down -v
docker-compose up -d
```

### Jenkins Pipeline Not Running

- Verify webhook configuration
- Check Jenkins logs: `docker logs jenkins`
- Test webhook URL accessibility
- Verify credentials in Jenkins secrets

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file)
- [CI/CD Setup Guide](./CI-CD-SETUP.md)

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code linting passed
- [ ] Environment variables set correctly
- [ ] Database migrations completed
- [ ] Docker images built and tagged
- [ ] Images pushed to registry
- [ ] Staging deployment successful
- [ ] Health checks passing
- [ ] Team lead approval obtained

---

**Happy Deploying! 🚀**
