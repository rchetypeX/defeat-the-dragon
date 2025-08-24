#!/bin/bash

echo "🧹 Starting deployment cleanup..."

# 1. Remove development documentation files
echo "📁 Removing development documentation..."
rm -f MINIKIT_COMPLIANCE_VERIFICATION.md
rm -f USEADDFRAME_VERIFICATION.md
rm -f USECOMPOSECAST_VERIFICATION.md
rm -f USEVIEWPROFILE_VERIFICATION.md
rm -f USEPRIMARYBUTTON_VERIFICATION.md
rm -f USEMINIKIT_HOOK_VERIFICATION.md
rm -f MINIKIT_PROVIDER_INITIALIZATION_VERIFICATION.md
rm -f BASE_APP_COMPATIBILITY_IMPLEMENTATION.md
rm -f BASE_APP_LAUNCH_CHECKLIST_COMPLETE.md
rm -f BASE_APP_DEBUGGING_IMPLEMENTATION.md
rm -f BASE_APP_LINKS_IMPLEMENTATION.md
rm -f BASE_APP_NOTIFICATIONS_READINESS.md
rm -f BASE_APP_SHARING_IMPLEMENTATION.md
rm -f BASE_APP_EMBEDS_IMPLEMENTATION.md
rm -f BASE_APP_CONTEXT_IMPLEMENTATION.md
rm -f BASE_APP_AUTHENTICATION.md
rm -f SCREENSHOT_REQUIREMENTS.md
rm -f BASE_APP_BEST_PRACTICES.md
rm -f NOTIFICATION_ENHANCEMENT.md
rm -f ICONS.md
rm -f SUPABASE_SETUP.md

# 2. Remove Supabase migration files
echo "🗃️ Removing Supabase migration files..."
rm -rf supabase/

# 3. Remove build artifacts
echo "🔨 Removing build artifacts..."
rm -rf .next/
rm -f tsconfig.tsbuildinfo
rm -rf .turbo/

# 4. Remove debug components
echo "🐛 Removing debug components..."
rm -f components/debugging/DebugPanel.tsx
rm -f lib/debugging.ts

# 5. Clean up environment files
echo "🔐 Cleaning environment files..."
# Ensure .env.local is not tracked
git rm --cached .env.local 2>/dev/null || true

# 6. Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application..."
npm run build

echo "✅ Deployment cleanup complete!"
echo "🚀 Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in your deployment platform"
echo "2. Deploy your application"
echo "3. Run post-deployment verification checks"
