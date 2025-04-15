#!/bin/bash

echo "📤 Committing and pushing static site to GitHub Pages..."
git add .
git commit -m "🚀 Deploy static update on $(date '+%Y-%m-%d %H:%M:%S')" || echo "⚠️ Nothing new to commit."
git push origin main

echo "🎉 Done! Visit https://aibotcoder.com"
