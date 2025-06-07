#!/bin/bash

# Script pour vérifier le statut des workflows GitHub Actions

# Configuration
OWNER="maximelat"
REPO="cas-clinique"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Vérification du statut des workflows GitHub Actions..."
echo "Repository: $OWNER/$REPO"
echo ""

# Option 1: Utiliser GitHub CLI (si installé)
if command -v gh &> /dev/null; then
    echo "📋 Workflows récents (via GitHub CLI):"
    gh run list --repo "$OWNER/$REPO" --limit 5
    echo ""
    
    # Afficher le dernier workflow en détail
    echo "📊 Détails du dernier workflow:"
    LATEST_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --limit 1 --json databaseId --jq '.[0].databaseId')
    if [ ! -z "$LATEST_RUN_ID" ]; then
        gh run view "$LATEST_RUN_ID" --repo "$OWNER/$REPO"
    fi
else
    echo "⚠️  GitHub CLI n'est pas installé. Installation recommandée: brew install gh"
fi

echo ""
echo "🌐 Liens utiles:"
echo "- Voir tous les workflows: https://github.com/$OWNER/$REPO/actions"
echo "- Dernier déploiement: https://github.com/$OWNER/$REPO/actions/workflows/deploy.yml"

# Option 2: Utiliser curl avec l'API GitHub (sans token pour les repos publics)
echo ""
echo "📡 Statut via API GitHub:"
curl -s "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=3" | \
    jq -r '.workflow_runs[] | "\(.status) - \(.conclusion // "en cours") - \(.name) - \(.created_at)"' 2>/dev/null || \
    echo "❌ Erreur lors de la récupération via l'API (jq requis)" 