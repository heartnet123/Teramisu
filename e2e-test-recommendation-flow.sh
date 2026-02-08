#!/bin/bash

# E2E Test Script for Recommendation Flow
# This script verifies the recommendation flow from product page to cart to checkout

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"

echo -e "${YELLOW}=== Recommendation Flow E2E Test ===${NC}\n"

# Function to check if service is healthy
check_service() {
    local url=$1
    local name=$2

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name is running"
        return 0
    else
        echo -e "${RED}✗${NC} $name is not responding"
        return 1
    fi
}

# Check services
echo "Checking services..."
check_service "$BACKEND_URL" "Backend API" || exit 1
check_service "$FRONTEND_URL" "Frontend Web" || exit 1
echo ""

# Test 1: Frequently Bought Together Endpoint
echo -e "${YELLOW}Test 1: Frequently Bought Together API${NC}"
response=$(curl -s "$BACKEND_URL/api/recommendations/frequently-bought-together/prod_123")
if echo "$response" | grep -q "products"; then
    echo -e "${GREEN}✓${NC} Frequently Bought Together endpoint responds"
    echo "$response" | head -c 200
    echo "..."
else
    echo -e "${RED}✗${NC} Frequently Bought Together endpoint failed"
    echo "$response"
fi
echo ""

# Test 2: Personalized Recommendations Endpoint
echo -e "${YELLOW}Test 2: Personalized Recommendations API${NC}"
# This requires authentication, so we expect a 401 without auth
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/recommendations/personalized")
if [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✓${NC} Personalized endpoint requires authentication (401)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected status code: $status_code"
fi
echo ""

# Test 3: Category-Based Recommendations Endpoint
echo -e "${YELLOW}Test 3: Category-Based Recommendations API${NC}"
response=$(curl -s "$BACKEND_URL/api/recommendations/category/Chairs")
if echo "$response" | grep -q "products"; then
    echo -e "${GREEN}✓${NC} Category-based recommendations endpoint responds"
    echo "$response" | head -c 200
    echo "..."
else
    echo -e "${RED}✗${NC} Category-based recommendations endpoint failed"
    echo "$response"
fi
echo ""

# Test 4: Track Recommendation Event Endpoint
echo -e "${YELLOW}Test 4: Track Recommendation Event API${NC}"
response=$(curl -s -X POST "$BACKEND_URL/api/recommendations/track" \
    -H "Content-Type: application/json" \
    -d '{"type":"click","productId":"prod_123","recommendedProductId":"prod_456"}')
if echo "$response" | grep -q "eventId"; then
    echo -e "${GREEN}✓${NC} Track endpoint accepts click events"
    echo "$response"
else
    echo -e "${RED}✗${NC} Track endpoint failed"
    echo "$response"
fi
echo ""

# Test 5: Admin Analytics Endpoint
echo -e "${YELLOW}Test 5: Admin Analytics API${NC}"
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/admin/recommendations/analytics")
if [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
    echo -e "${GREEN}✓${NC} Admin endpoint requires authentication (401/403)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected status code: $status_code"
fi
echo ""

# Test 6: Cart Recommendations Endpoint
echo -e "${YELLOW}Test 6: Cart Recommendations API${NC}"
response=$(curl -s -X POST "$BACKEND_URL/api/recommendations/cart" \
    -H "Content-Type: application/json" \
    -d '{"productIds":["prod_123","prod_456"]}')
if echo "$response" | grep -q "products"; then
    echo -e "${GREEN}✓${NC} Cart recommendations endpoint responds"
    echo "$response" | head -c 200
    echo "..."
else
    echo -e "${RED}✗${NC} Cart recommendations endpoint failed"
    echo "$response"
fi
echo ""

echo -e "${YELLOW}=== Backend API Tests Complete ===${NC}\n"
echo -e "${YELLOW}=== Manual Frontend Verification Required ===${NC}\n"
echo "Please manually verify the following in your browser:"
echo ""
echo "1. Product Page - Frequently Bought Together:"
echo "   - Visit: $FRONTEND_URL/shop/prod_123"
echo "   - Verify 'Frequently Bought Together' section appears"
echo "   - Verify 2-3 recommended products show"
echo "   - Click on a recommended product and verify navigation"
echo ""
echo "2. Homepage - Recommended for You:"
echo "   - Visit: $FRONTEND_URL/"
echo "   - Log in as a test user"
echo "   - Verify 'Recommended for You' section appears"
echo "   - Verify personalized recommendations show"
echo ""
echo "3. Cart Page - You Might Also Like:"
echo "   - Visit: $FRONTEND_URL/cart"
echo "   - Add products to cart if empty"
echo "   - Verify 'You Might Also Like' section appears"
echo "   - Verify recommendations based on cart items"
echo ""
echo "4. Dashboard - Recommended for Next Purchase:"
echo "   - Visit: $FRONTEND_URL/dashboard"
echo "   - Log in as a user with order history"
echo "   - Verify 'Recommended for Next Purchase' section appears"
echo ""
echo "5. Admin Panel - Recommendation Metrics:"
echo "   - Visit: $FRONTEND_URL/admin"
echo "   - Log in as admin"
echo "   - Verify 'Recommendation Performance' section appears"
echo "   - Verify metrics: Total Views, Clicks, CTR, Conversion Rate"
echo "   - Verify 'Top Recommended Products' table"
echo ""
echo "6. End-to-End Flow:"
echo "   - Start on a product page with recommendations"
echo "   - Click on a recommended product"
echo "   - Add the recommended product to cart"
echo "   - Go to cart and verify new recommendations"
echo "   - Complete checkout process"
echo "   - Verify order confirmation shows recommendations"
echo "   - Check admin panel for updated metrics"
echo ""
