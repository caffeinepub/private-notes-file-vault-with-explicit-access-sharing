#!/bin/bash

# IC Mainnet Deployment Script
# This script deploys both backend and frontend canisters to the Internet Computer mainnet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
LOGS_DIR="frontend/deploy-logs"
mkdir -p "$LOGS_DIR"

# Generate timestamp for log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOGS_DIR/deploy-$TIMESTAMP.log"

echo -e "🚀 Starting IC mainnet deployment..."
echo -e "📝 Logging to: $LOG_FILE"
echo ""

# Function to log and display
log_and_display() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to handle errors with detailed output
handle_error() {
    local step=$1
    local output=$2
    log_and_display "${RED}❌ $step failed!${NC}"
    log_and_display ""
    log_and_display "Error output:"
    log_and_display "$output"
    log_and_display ""
    log_and_display "Failing step: $step"
    log_and_display ""
    
    # Provide context-specific troubleshooting
    case $step in
        "PREFLIGHT")
            log_and_display "Common causes:"
            log_and_display "  - dfx not installed or not in PATH"
            log_and_display "  - No dfx identity configured"
            log_and_display "  - Not logged in to mainnet"
            ;;
        "BUILD")
            log_and_display "Common causes:"
            log_and_display "  - Syntax errors in Motoko code"
            log_and_display "  - Missing dependencies"
            log_and_display "  - Frontend build errors"
            ;;
        "CREATE_BACKEND"|"CREATE_FRONTEND")
            log_and_display "Common causes:"
            log_and_display "  - Insufficient cycles in wallet"
            log_and_display "  - Network timeout (retry in a few minutes)"
            log_and_display "  - Wallet not configured for mainnet"
            log_and_display "  - Identity not set as wallet controller"
            ;;
        "INSTALL_BACKEND"|"INSTALL_FRONTEND")
            log_and_display "Common causes:"
            log_and_display "  - Canister does not exist (check CREATE step)"
            log_and_display "  - Insufficient cycles in canister"
            log_and_display "  - Controller mismatch"
            log_and_display "  - Network timeout (retry)"
            ;;
    esac
    
    exit 1
}

# Start deployment
log_and_display "$(date): Starting deployment to IC mainnet"
log_and_display "=========================================="

# PREFLIGHT: Check dfx and network connectivity
log_and_display ""
log_and_display "${BLUE}🔍 PREFLIGHT: Checking environment...${NC}"
if ! PREFLIGHT_OUTPUT=$(dfx --version 2>&1); then
    handle_error "PREFLIGHT" "$PREFLIGHT_OUTPUT"
fi
log_and_display "dfx version: $(dfx --version)"
log_and_display "${GREEN}✓ Preflight checks passed${NC}"

# BUILD: Build canisters
log_and_display ""
log_and_display "${BLUE}📦 BUILD: Building canisters...${NC}"
if ! BUILD_OUTPUT=$(dfx build --network ic 2>&1); then
    handle_error "BUILD" "$BUILD_OUTPUT"
fi
log_and_display "${GREEN}✓ Build successful${NC}"

# CREATE: Ensure backend canister exists
log_and_display ""
log_and_display "${BLUE}🔧 CREATE: Ensuring backend canister exists...${NC}"

# Check if backend canister already exists
BACKEND_EXISTS=false
if BACKEND_ID_CHECK=$(dfx canister id backend --network ic 2>/dev/null); then
    if [ -n "$BACKEND_ID_CHECK" ]; then
        log_and_display "Backend canister already exists: $BACKEND_ID_CHECK"
        BACKEND_EXISTS=true
    fi
fi

if [ "$BACKEND_EXISTS" = false ]; then
    log_and_display "Creating backend canister on mainnet..."
    if ! CREATE_BACKEND_OUTPUT=$(dfx canister create backend --network ic 2>&1); then
        handle_error "CREATE_BACKEND" "$CREATE_BACKEND_OUTPUT"
    fi
    BACKEND_ID=$(dfx canister id backend --network ic 2>&1)
    log_and_display "Backend canister created: $BACKEND_ID"
fi
log_and_display "${GREEN}✓ Backend canister ready${NC}"

# CREATE: Ensure frontend canister exists
log_and_display ""
log_and_display "${BLUE}🎨 CREATE: Ensuring frontend canister exists...${NC}"

# Check if frontend canister already exists
FRONTEND_EXISTS=false
if FRONTEND_ID_CHECK=$(dfx canister id frontend --network ic 2>/dev/null); then
    if [ -n "$FRONTEND_ID_CHECK" ]; then
        log_and_display "Frontend canister already exists: $FRONTEND_ID_CHECK"
        FRONTEND_EXISTS=true
    fi
fi

if [ "$FRONTEND_EXISTS" = false ]; then
    log_and_display "Creating frontend canister on mainnet..."
    if ! CREATE_FRONTEND_OUTPUT=$(dfx canister create frontend --network ic 2>&1); then
        handle_error "CREATE_FRONTEND" "$CREATE_FRONTEND_OUTPUT"
    fi
    FRONTEND_ID=$(dfx canister id frontend --network ic 2>&1)
    log_and_display "Frontend canister created: $FRONTEND_ID"
fi
log_and_display "${GREEN}✓ Frontend canister ready${NC}"

# INSTALL_BACKEND: Install/upgrade backend canister
log_and_display ""
log_and_display "${BLUE}⚙️  INSTALL_BACKEND: Installing backend canister...${NC}"

# Try upgrade first, fall back to install
BACKEND_INSTALL_SUCCESS=false
if BACKEND_UPGRADE_OUTPUT=$(dfx canister install backend --network ic --mode upgrade 2>&1); then
    log_and_display "Backend upgraded successfully"
    BACKEND_INSTALL_SUCCESS=true
else
    log_and_display "Upgrade failed, attempting fresh install..."
    if BACKEND_INSTALL_OUTPUT=$(dfx canister install backend --network ic 2>&1); then
        log_and_display "Backend installed successfully"
        BACKEND_INSTALL_SUCCESS=true
    fi
fi

if [ "$BACKEND_INSTALL_SUCCESS" = false ]; then
    COMBINED_OUTPUT="${BACKEND_UPGRADE_OUTPUT}\n\n--- Fresh install attempt ---\n${BACKEND_INSTALL_OUTPUT}"
    handle_error "INSTALL_BACKEND" "$COMBINED_OUTPUT"
fi
log_and_display "${GREEN}✓ Backend installed${NC}"

# INSTALL_FRONTEND: Install/upgrade frontend canister and upload assets
log_and_display ""
log_and_display "${BLUE}🌐 INSTALL_FRONTEND: Installing frontend canister and uploading assets...${NC}"

# Try upgrade first, fall back to install
FRONTEND_INSTALL_SUCCESS=false
if FRONTEND_UPGRADE_OUTPUT=$(dfx canister install frontend --network ic --mode upgrade 2>&1); then
    log_and_display "Frontend upgraded successfully"
    FRONTEND_INSTALL_SUCCESS=true
else
    log_and_display "Upgrade failed, attempting fresh install..."
    if FRONTEND_INSTALL_OUTPUT=$(dfx canister install frontend --network ic 2>&1); then
        log_and_display "Frontend installed successfully"
        FRONTEND_INSTALL_SUCCESS=true
    fi
fi

if [ "$FRONTEND_INSTALL_SUCCESS" = false ]; then
    COMBINED_OUTPUT="${FRONTEND_UPGRADE_OUTPUT}\n\n--- Fresh install attempt ---\n${FRONTEND_INSTALL_OUTPUT}"
    handle_error "INSTALL_FRONTEND" "$COMBINED_OUTPUT"
fi
log_and_display "${GREEN}✓ Frontend installed and assets uploaded${NC}"

# Extract final canister IDs
log_and_display ""
log_and_display "${BLUE}📋 Extracting canister information...${NC}"

BACKEND_ID=$(dfx canister id backend --network ic 2>&1)
FRONTEND_ID=$(dfx canister id frontend --network ic 2>&1)

if [ -z "$BACKEND_ID" ] || [ -z "$FRONTEND_ID" ]; then
    log_and_display "${YELLOW}⚠️  Warning: Could not extract canister IDs${NC}"
    log_and_display "Deployment may have succeeded, but canister IDs are not available."
    log_and_display "Check with: dfx canister id backend --network ic"
    exit 0
fi

FRONTEND_URL="https://$FRONTEND_ID.ic0.app"
BACKEND_RAW_URL="https://$BACKEND_ID.raw.ic0.app"

# Success output
log_and_display ""
log_and_display "========================================="
log_and_display "${GREEN}✅ Deployment successful!${NC}"
log_and_display "========================================="
log_and_display ""
log_and_display "Backend Canister ID:  $BACKEND_ID"
log_and_display "Frontend Canister ID: $FRONTEND_ID"
log_and_display ""
log_and_display "Frontend URL:         $FRONTEND_URL"
log_and_display "Backend Raw URL:      $BACKEND_RAW_URL"
log_and_display ""
log_and_display "🌐 Visit your app: $FRONTEND_URL"
log_and_display ""

# Verification section
log_and_display "========================================="
log_and_display "${BLUE}🔍 VERIFY: Post-deployment checks${NC}"
log_and_display "========================================="
log_and_display ""
log_and_display "Run these commands to verify your deployment:"
log_and_display ""
log_and_display "1. Check backend canister status:"
log_and_display "   dfx canister status backend --network ic"
log_and_display ""
log_and_display "2. Check frontend canister status:"
log_and_display "   dfx canister status frontend --network ic"
log_and_display ""
log_and_display "3. Test backend reachability:"
log_and_display "   curl -I $BACKEND_RAW_URL"
log_and_display "   (Should return HTTP 200 or 400, not 404)"
log_and_display ""
log_and_display "4. Open frontend in browser:"
log_and_display "   $FRONTEND_URL"
log_and_display ""
log_and_display "5. Link canister in NNS dapp (optional):"
log_and_display "   - Go to https://nns.ic0.app"
log_and_display "   - Navigate to Canisters → Link Canister"
log_and_display "   - Paste backend ID: $BACKEND_ID"
log_and_display "   - Paste frontend ID: $FRONTEND_ID"
log_and_display ""
log_and_display "$(date): Deployment completed successfully"

exit 0
