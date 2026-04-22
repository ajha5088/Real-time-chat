#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5
ELAPSED=0

echo -e "${YELLOW}Performing health checks...${NC}"

# Check backend health
echo -e "${YELLOW}Checking backend health...${NC}"
ELAPSED=0
while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for backend... ($ELAPSED/$HEALTH_CHECK_TIMEOUT)${NC}"
    sleep $HEALTH_CHECK_INTERVAL
    ELAPSED=$((ELAPSED + HEALTH_CHECK_INTERVAL))
done

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo -e "${RED}✗ Backend health check failed${NC}"
    exit 1
fi

# Check frontend health
echo -e "${YELLOW}Checking frontend health...${NC}"
ELAPSED=0
while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for frontend... ($ELAPSED/$HEALTH_CHECK_TIMEOUT)${NC}"
    sleep $HEALTH_CHECK_INTERVAL
    ELAPSED=$((ELAPSED + HEALTH_CHECK_INTERVAL))
done

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo -e "${RED}✗ Frontend health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}All services are healthy!${NC}"
