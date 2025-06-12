#!/bin/bash

# Script pour configurer la clé API MedGemma dans Firebase Functions

echo "Configuration de la clé API MedGemma pour Firebase Functions"
echo "============================================"
echo ""

# Vérifier si la clé est fournie en argument
if [ -z "$1" ]; then
    echo "Usage: ./set-medgemma-key.sh <MEDGEMMA_API_KEY>"
    echo ""
    echo "Exemple: ./set-medgemma-key.sh hf_XXXXXXXXXXXXXXXXXXXXX"
    exit 1
fi

MEDGEMMA_KEY=$1

# Configurer la clé dans Firebase Functions
echo "Configuration de la clé MedGemma..."
firebase functions:config:set medgemma.key="$MEDGEMMA_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Clé MedGemma configurée avec succès"
    echo ""
    echo "Pour déployer les fonctions avec la nouvelle configuration :"
    echo "cd firebase-functions && npm run deploy"
else
    echo "❌ Erreur lors de la configuration de la clé"
    exit 1
fi 