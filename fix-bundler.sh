#!/bin/bash

echo "Clearing Metro bundler cache..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

echo "Cache cleared. Please restart your development server."
echo "Run: bun start"
