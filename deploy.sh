#!/bin/bash

# AUTOMATIC DEPLOYMENT SCRIPT FOR PAWNFLOW
# This script deploys backend to Railway and frontend to Vercel

echo "🚀 Starting automated deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Dependencies checked"

# Deploy Backend to Railway
echo "📦 Deploying backend to Railway..."
cd /Users/HP/pawn-flow
railway login
railway init
railway up

echo "✅ Backend deployed to Railway"

# Deploy Frontend to Vercel
echo "📦 Deploying frontend to Vercel..."
cd /Users/HP/pawnflow-frontend
vercel --prod

echo "✅ Frontend deployed to Vercel"
echo "🎉 Deployment complete!"

