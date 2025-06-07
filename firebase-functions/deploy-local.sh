#!/bin/bash

echo "🚀 Configuration et déploiement Firebase Functions"
echo ""

# Vérifier si Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

# Vérifier si on est connecté à Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Firebase"
    echo "Connectez-vous avec: firebase login"
    exit 1
fi

# Demander le projet Firebase si pas configuré
if grep -q "votre-projet-firebase" .firebaserc; then
    echo "📝 Configuration du projet Firebase..."
    firebase use --add
fi

# Configurer la clé OpenAI
echo ""
echo "🔑 Configuration de la clé OpenAI..."
echo "Entrez votre clé API OpenAI (elle ne sera pas affichée) :"
read -s OPENAI_KEY

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ Clé OpenAI requise"
    exit 1
fi

# Définir la configuration Firebase
firebase functions:config:set openai.key="$OPENAI_KEY"

# Créer le fichier de configuration locale
echo ""
echo "📁 Création du fichier de configuration locale..."
firebase functions:config:get > .runtimeconfig.json

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Demander si on veut déployer
echo ""
echo "✅ Configuration terminée !"
echo ""
read -p "Voulez-vous déployer les fonctions maintenant ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Déploiement en cours..."
    firebase deploy --only functions
else
    echo "Pour déployer plus tard, utilisez: firebase deploy --only functions"
fi 