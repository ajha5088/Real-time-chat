#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building Docker images...${NC}"

# Build backend image
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t chatapp/backend:latest -f backend/Dockerfile backend/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}✗ Backend image build failed${NC}"
    exit 1
fi

# Build frontend image
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t chatapp/frontend:latest -f frontend/Dockerfile frontend/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}✗ Frontend image build failed${NC}"
    exit 1
fi

echo -e "${GREEN}All images built successfully!${NC}"
echo -e "${YELLOW}To start the application, run: docker-compose up${NC}"
