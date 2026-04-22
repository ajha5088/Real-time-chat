#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Docker Compose Deployment ===${NC}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install it first.${NC}"
    exit 1
fi

ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
    echo -e "${YELLOW}Deploying to staging environment...${NC}"
elif [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${YELLOW}Deploying to development environment...${NC}"
else
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: ./deploy.sh [development|staging]"
    exit 1
fi

# Check if services are already running
echo -e "${YELLOW}Checking existing containers...${NC}"
docker-compose -f $COMPOSE_FILE ps > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker-compose -f $COMPOSE_FILE down
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to stop existing containers${NC}"
        exit 1
    fi
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start services${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Services started successfully${NC}"

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Run health checks
bash scripts/health-check.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}=== Deployment Successful ===${NC}"
    echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
    echo -e "${GREEN}Backend: http://localhost:4000${NC}"
    echo -e "${GREEN}MongoDB: mongodb://localhost:27017${NC}"
    echo -e "${GREEN}PostgreSQL: postgresql://localhost:5432${NC}"
    echo -e "${GREEN}Redis: redis://localhost:6379${NC}"
    echo -e "${GREEN}Neo4j: neo4j://localhost:7687${NC}"
else
    echo -e "${RED}=== Deployment Failed ===${NC}"
    exit 1
fi
