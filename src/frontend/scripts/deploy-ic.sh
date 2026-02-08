#!/bin/bash

# IC Mainnet Deployment Script
# This script deploys both backend and frontend canisters to the Internet Computer mainnet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
LOGS_DIR="frontend/deploy-logs"
mkdir -p "$LOGS_DIR"

# Generate timestamp for log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOGS_DIR/deploy-$TIMESTAMP.log"

echo "🚀 Starting IC mainnet deployment..."
echo "📝 Logging to: $LOG_FILE"
echo ""

# Function to log and display
log_and_display() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to extract canister ID from dfx output
extract_canister_id() {
    local canister_name=$1
    local output=$2
    echo "$output" | grep -oP "(?<=$canister_name: )[a-z0-9-]+" | head -1
}

# Start deployment
log_and_display "$(date): Starting deployment to IC mainnet"
log_and_display "----------------------------------------"

# Step 1: Build
log_and_display ""
log_and_display "📦 Step 1/3: Building canisters..."
if ! BUILD_OUTPUT=$(dfx build --network ic 2>&1); then
    log_and_display "${RED}❌ Build failed!${NC}"
    log_and_display ""
    log_and_display "Error output:"
    log_and_display "$BUILD_OUTPUT"
    log_and_display ""
    log_and_display "Failing step: BUILD"
    exit 1
fi
log_and_display "${GREEN}✓ Build successful${NC}"

# Step 2: Deploy backend
log_and_display ""
log_and_display "🔧 Step 2/3: Installing backend canister..."
if ! BACKEND_OUTPUT=$(dfx canister install backend --network ic --mode upgrade 2>&1 || dfx canister install backend --network ic 2>&1); then
    log_and_display "${RED}❌ Backend installation failed!${NC}"
    log_and_display ""
    log_and_display "Error output:"
    log_and_display "$BACKEND_OUTPUT"
    log_and_display ""
    log_and_display "Failing step: INSTALL (backend)"
    log_and_display ""
    log_and_display "Common causes:"
    log_and_display "  - Insufficient cycles in wallet"
    log_and_display "  - Network timeout (retry in a few minutes)"
    log_and_display "  - Controller mismatch"
    exit 1
fi
log_and_display "${GREEN}✓ Backend installed${NC}"

# Step 3: Deploy frontend
log_and_display ""
log_and_display "🎨 Step 3/3: Installing frontend canister and uploading assets..."
if ! FRONTEND_OUTPUT=$(dfx canister install frontend --network ic --mode upgrade 2>&1 || dfx canister install frontend --network ic 2>&1); then
    log_and_display "${RED}❌ Frontend installation failed!${NC}"
    log_and_display ""
    log_and_display "Error output:"
    log_and_display "$FRONTEND_OUTPUT"
    log_and_display ""
    log_and_display "Failing step: INSTALL (frontend) or ASSET_UPLOAD"
    log_and_display ""
    log_and_display "Common causes:"
    log_and_display "  - Insufficient cycles in wallet"
    log_and_display "  - Network timeout during asset upload (retry)"
    log_and_display "  - Asset size exceeds limits"
    exit 1
fi
log_and_display "${GREEN}✓ Frontend installed and assets uploaded${NC}"

# Extract canister IDs
log_and_display ""
log_and_display "📋 Extracting canister information..."

BACKEND_ID=$(dfx canister id backend --network ic 2>&1)
FRONTEND_ID=$(dfx canister id frontend --network ic 2>&1)

if [ -z "$BACKEND_ID" ] || [ -z "$FRONTEND_ID" ]; then
    log_and_display "${YELLOW}⚠️  Warning: Could not extract canister IDs${NC}"
    log_and_display "Deployment may have succeeded, but canister IDs are not available."
    log_and_display "Check with: dfx canister id backend --network ic"
    exit 0
fi

FRONTEND_URL="https://$FRONTEND_ID.ic0.app"

# Success output
log_and_display ""
log_and_display "========================================="
log_and_display "${GREEN}✅ Deployment successful!${NC}"
log_and_display "========================================="
log_and_display ""
log_and_display "Backend Canister ID:  $BACKEND_ID"
log_and_display "Frontend Canister ID: $FRONTEND_ID"
log_and_display "Frontend URL:         $FRONTEND_URL"
log_and_display ""
log_and_display "🌐 Visit your app: $FRONTEND_URL"
log_and_display ""
log_and_display "$(date): Deployment completed successfully"

exit 0
