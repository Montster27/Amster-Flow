#!/bin/bash

# Pre-Deployment Verification Script
# Checks that ArmsterFlow is ready for production deployment

set -e

echo "🚀 ArmsterFlow - Pre-Deployment Verification"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

# Function to print warning
warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# Check 1: Node version
echo "📦 Checking Node.js version..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 18 ]; then
    success "Node.js $(node -v) installed"
  else
    error "Node.js version must be 18 or higher (found: $(node -v))"
  fi
else
  error "Node.js not installed"
fi
echo ""

# Check 2: Dependencies installed
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
  success "node_modules directory exists"
else
  error "Dependencies not installed. Run: npm install"
fi
echo ""

# Check 3: TypeScript compilation
echo "🔍 Running TypeScript type check..."
if npm run build > /dev/null 2>&1; then
  success "TypeScript compilation successful"
else
  error "TypeScript compilation failed. Run: npm run build"
fi
echo ""

# Check 4: Tests passing
echo "🧪 Running tests..."
if npm run test:run > /dev/null 2>&1; then
  success "All tests passing"
else
  warning "Some tests failing. Run: npm test"
fi
echo ""

# Check 5: Environment variables documented
echo "🔐 Checking environment configuration..."
if [ -f ".env.example" ]; then
  success ".env.example file exists"

  # Check for required variables
  if grep -q "VITE_SUPABASE_URL" .env.example && \
     grep -q "VITE_SUPABASE_ANON_KEY" .env.example && \
     grep -q "VITE_SENTRY_DSN" .env.example; then
    success "All required environment variables documented"
  else
    error "Missing required environment variables in .env.example"
  fi
else
  error ".env.example file not found"
fi
echo ""

# Check 6: Migration script exists
echo "🗄️  Checking database migration..."
if [ -f "supabase/migrations/20251112_migrate_interviews_to_enhanced.sql" ]; then
  success "Migration script ready"
else
  error "Migration script not found"
fi
echo ""

# Check 7: Production build size
echo "📊 Analyzing production build..."
if [ -d "dist" ]; then
  MAIN_BUNDLE=$(find dist/assets -name "index-*.js" -type f 2>/dev/null | head -1)
  if [ -n "$MAIN_BUNDLE" ]; then
    SIZE=$(stat -f%z "$MAIN_BUNDLE" 2>/dev/null || stat -c%s "$MAIN_BUNDLE" 2>/dev/null)
    SIZE_KB=$((SIZE / 1024))
    if [ "$SIZE_KB" -lt 150 ]; then
      success "Main bundle size: ${SIZE_KB}KB (optimized)"
    else
      warning "Main bundle size: ${SIZE_KB}KB (consider optimization)"
    fi
  fi
else
  warning "Production build not found. Run: npm run build"
fi
echo ""

# Check 8: Git status
echo "📝 Checking Git status..."
if command -v git &> /dev/null; then
  if git diff-index --quiet HEAD --; then
    success "No uncommitted changes"
  else
    warning "Uncommitted changes detected. Commit before deploying."
  fi

  # Check current branch
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" = "main" ]; then
    success "On main branch"
  else
    warning "Not on main branch (current: $BRANCH)"
  fi
else
  warning "Git not available"
fi
echo ""

# Check 9: README and documentation
echo "📖 Checking documentation..."
if [ -f "README.md" ]; then
  success "README.md exists"
else
  error "README.md not found"
fi

if [ -f "DEPLOYMENT.md" ]; then
  success "DEPLOYMENT.md exists"
else
  warning "DEPLOYMENT.md not found (recommended)"
fi
echo ""

# Check 10: Sentry integration
echo "🐛 Checking error tracking..."
if grep -r "captureException" src/ > /dev/null 2>&1; then
  COUNT=$(grep -r "captureException" src/ | wc -l | tr -d ' ')
  success "Sentry integration active ($COUNT error handlers)"
else
  error "Sentry integration not found"
fi
echo ""

# Summary
echo "============================================="
echo "📋 Verification Summary"
echo "============================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "🚀 Ready for production deployment!"
  echo ""
  echo "Next steps:"
  echo "  1. Create Sentry project at https://sentry.io"
  echo "  2. Deploy to Vercel"
  echo "  3. Run migration in Supabase production"
  echo "  4. Follow DEPLOYMENT.md for detailed instructions"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
  echo ""
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Review warnings above before deploying to production."
  exit 0
else
  echo -e "${RED}❌ VERIFICATION FAILED${NC}"
  echo ""
  echo "Errors: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Fix all errors before deploying to production."
  exit 1
fi
