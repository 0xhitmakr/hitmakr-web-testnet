#!/bin/bash

echo "Starting deployment..."

echo "Installing dependencies..."
npm install

echo "Building Next.js application..."
NODE_ENV=production npm run build

echo "Configuring PM2..."
pm2 delete hitmakr-web-testnet 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production

echo "Saving PM2 configuration..."
pm2 save

echo "Setting up PM2 startup..."
pm2 startup

echo "Deployment completed!"