#!/bin/bash

# Script de monitoring en temps réel des workflows GitHub Actions

OWNER="maximelat"
REPO="cas-clinique"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction pour obtenir le statut emoji
get_status_emoji() {
    local status=$1
    local conclusion=$2
    
    if [ "$status" = "in_progress" ]; then
        echo "🔄"
    elif [ "$status" = "completed" ]; then
        case "$conclusion" in
            "success") echo "✅" ;;
            "failure") echo "❌" ;;
            "cancelled") echo "⚫" ;;
            *) echo "❓" ;;
        esac
    else
        echo "⏸️"
    fi
}

# Fonction pour afficher le statut
check_status() {
    clear
    echo -e "${BLUE}=== GitHub Actions Monitor ===${NC}"
    echo -e "Repository: ${GREEN}$OWNER/$REPO${NC}"
    echo -e "Heure: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Récupérer les workflows
    local workflows=$(curl -s "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=5")
    
    # Compter les workflows en cours
    local in_progress=$(echo "$workflows" | jq '[.workflow_runs[] | select(.status == "in_progress")] | length')
    
    if [ "$in_progress" -gt 0 ]; then
        echo -e "${YELLOW}⚡ $in_progress workflow(s) en cours d'exécution${NC}"
    else
        echo -e "${GREEN}✨ Aucun workflow en cours${NC}"
    fi
    echo ""
    
    echo "📊 Derniers workflows:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "$workflows" | jq -r '.workflow_runs[] | 
        "\(.status)|\(.conclusion // "")|\(.name)|\(.head_sha[0:7])|\(.created_at)|\(.html_url)"' | \
    while IFS='|' read -r status conclusion name sha created_at url; do
        local emoji=$(get_status_emoji "$status" "$conclusion")
        local time=$(echo "$created_at" | sed 's/T/ /; s/Z//')
        
        # Colorer selon le statut
        if [ "$status" = "in_progress" ]; then
            echo -e "${YELLOW}$emoji En cours${NC} - $name - $sha - $time"
        elif [ "$conclusion" = "success" ]; then
            echo -e "${GREEN}$emoji Success ${NC} - $name - $sha - $time"
        elif [ "$conclusion" = "failure" ]; then
            echo -e "${RED}$emoji Échec  ${NC} - $name - $sha - $time"
        else
            echo -e "$emoji $status - $name - $sha - $time"
        fi
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔗 Voir tous les workflows: https://github.com/$OWNER/$REPO/actions"
}

# Mode surveillance continue
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    echo "👀 Mode surveillance activé (Ctrl+C pour arrêter)"
    while true; do
        check_status
        echo ""
        echo "⏱️  Actualisation dans 30 secondes..."
        sleep 30
    done
else
    # Affichage unique
    check_status
    echo ""
    echo "💡 Astuce: Utilisez './monitor-workflow.sh --watch' pour une surveillance continue"
fi 