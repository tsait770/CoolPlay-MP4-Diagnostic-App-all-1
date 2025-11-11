#!/bin/bash

echo "🧹 Clearing Metro bundler cache..."

# Stop any running Metro instances
pkill -f "react-native" || true
pkill -f "metro" || true

# Clear watchman
if command -v watchman &> /dev/null; then
    echo "Clearing watchman..."
    watchman watch-del-all
fi

# Clear Metro cache
rm -rf $TMPDIR/metro-* 
rm -rf $TMPDIR/react-* 
rm -rf $TMPDIR/haste-*

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear Expo cache
if command -v npx &> /dev/null; then
    echo "Clearing Expo cache..."
    npx expo start -c
fi

echo "✅ Cache cleared! Now restart your development server."
