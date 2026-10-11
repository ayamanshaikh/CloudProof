#!/usr/bin/env bash
# ==============================================================================
# CloudProof Turnkey Deployment Script (Linux / macOS)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

# Terminal Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}        CloudProof Deployment Orchestrator           ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check Docker CLI
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${NC}"
    echo -e "${YELLOW}Please install Docker Engine or Docker Desktop:${NC}"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
fi

# Detect compose command (docker compose vs docker-compose)
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose is not installed.${NC}"
    exit 1
fi

MODE="${1:-prod}"

case "${MODE}" in
    --prod|prod)
        echo -e "${GREEN}[*] Launching Full Production Stack (Nginx + PostgreSQL + Backend + Frontend)...${NC}"
        if [ ! -f ".env.production" ]; then
            echo -e "${YELLOW}[!] .env.production not found. Initializing from template...${NC}"
            cp .env.production.example .env.production
            echo -e "${YELLOW}[!] Created .env.production. For production security, update JWT_SECRET and DB passwords.${NC}"
        fi
        ${COMPOSE_CMD} --env-file .env.production -f docker-compose.prod.yml up -d --build
        echo -e "${GREEN}[+] Production containers started. Waiting for health checks...${NC}"
        sleep 5
        ${COMPOSE_CMD} -f docker-compose.prod.yml ps
        echo -e "${GREEN}[✓] CloudProof is accessible at: http://localhost${NC}"
        echo -e "${GREEN}[✓] API Gateway is accessible at: http://localhost/api/v1/health${NC}"
        ;;

    --sqlite|sqlite|--lab|lab)
        echo -e "${GREEN}[*] Launching Lightweight Zero-Cost College Lab Stack (SQLite + Backend + Frontend)...${NC}"
        mkdir -p data
        ${COMPOSE_CMD} -f docker-compose.sqlite.yml up -d --build
        echo -e "${GREEN}[+] Lab containers started. Waiting for health checks...${NC}"
        sleep 5
        ${COMPOSE_CMD} -f docker-compose.sqlite.yml ps
        echo -e "${GREEN}[✓] Frontend is accessible at: http://localhost:3000${NC}"
        echo -e "${GREEN}[✓] Backend API is accessible at: http://localhost:8000/api/v1/health${NC}"
        ;;

    --dev|dev)
        echo -e "${GREEN}[*] Launching Standard Development Stack (PostgreSQL + Backend + Frontend)...${NC}"
        ${COMPOSE_CMD} -f docker-compose.yml up -d --build
        sleep 5
        ${COMPOSE_CMD} -f docker-compose.yml ps
        echo -e "${GREEN}[✓] Frontend: http://localhost:3000 | Backend: http://localhost:8000${NC}"
        ;;

    --down|down|stop)
        echo -e "${YELLOW}[*] Stopping CloudProof containers...${NC}"
        ${COMPOSE_CMD} -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
        ${COMPOSE_CMD} -f docker-compose.sqlite.yml down --remove-orphans 2>/dev/null || true
        ${COMPOSE_CMD} -f docker-compose.yml down --remove-orphans 2>/dev/null || true
        echo -e "${GREEN}[✓] All CloudProof containers stopped cleanly.${NC}"
        ;;

    --status|status)
        echo -e "${BLUE}[*] Checking CloudProof Container Status:${NC}"
        ${COMPOSE_CMD} -f docker-compose.prod.yml ps 2>/dev/null || true
        ${COMPOSE_CMD} -f docker-compose.sqlite.yml ps 2>/dev/null || true
        ${COMPOSE_CMD} -f docker-compose.yml ps 2>/dev/null || true
        ;;

    --logs|logs)
        ${COMPOSE_CMD} -f docker-compose.prod.yml logs -f --tail=100
        ;;

    *)
        echo "Usage: $0 [prod|sqlite|dev|down|status|logs]"
        echo "  prod    : Full production deployment with Nginx & PostgreSQL (Default)"
        echo "  sqlite  : Lightweight zero-cloud-cost college lab mode (SQLite)"
        echo "  dev     : Standard multi-service development compose"
        echo "  down    : Stop and remove all running containers"
        echo "  status  : View status of running containers and health checks"
        echo "  logs    : Stream container logs"
        exit 1
        ;;
esac
