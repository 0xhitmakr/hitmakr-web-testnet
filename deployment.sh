#!/bin/bash

echo "Starting deployment..."

if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source /root/.bashrc
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    bun install -g pm2
fi

echo "Installing dependencies..."
bun install

echo "Building Next.js application..."
NODE_ENV=production bun run build

echo "Configuring PM2..."
pm2 delete hitmakr-web-testnet 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production

echo "Saving PM2 configuration..."
pm2 save

echo "Setting up PM2 startup..."
pm2 startup

echo "Deployment completed!"