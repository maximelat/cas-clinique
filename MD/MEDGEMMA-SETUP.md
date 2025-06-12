# Configuration de MedGemma

MedGemma est un modèle d'IA spécialisé pour l'analyse d'images médicales, intégré dans l'application Clinical Case Analyzer.

## Avantages de MedGemma

- **Analyse spécialisée** : Conçu spécifiquement pour l'imagerie médicale
- **Détection précise** : Identifie les anomalies dans les radiographies, IRM, scanners
- **Interprétation biologique** : Analyse les résultats de laboratoire
- **Analyse ECG** : Interprétation détaillée des électrocardiogrammes
- **Terminologie médicale** : Utilise un vocabulaire médical approprié

## Configuration en développement

### 1. Obtenir une clé API

1. Créez un compte sur [Hugging Face](https://huggingface.co/join)
2. Allez dans [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Créez un nouveau token avec les permissions "read"
4. Copiez le token (format : `hf_XXXXXXXXXXXXXXXXXXXXX`)

### 2. Configurer dans l'application

#### Option A : Via l'interface utilisateur
1. Lancez l'application en mode développement
2. Cliquez sur le bouton "MedGemma" dans la barre d'outils
3. Collez votre clé API
4. Cliquez sur "Enregistrer"

#### Option B : Via variable d'environnement
Ajoutez dans votre fichier `.env.local` :
```
NEXT_PUBLIC_MEDGEMMA_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXX
```

## Configuration en production

### 1. Secret GitHub Actions

Pour le déploiement automatique, ajoutez le secret dans GitHub :
1. Allez dans Settings > Secrets and variables > Actions
2. Créez un nouveau secret nommé `MEDGEMMA`
3. Collez votre clé API Hugging Face

### 2. Firebase Functions

Pour configurer la clé dans Firebase Functions :

```bash
# Depuis le dossier racine du projet
./firebase-functions/set-medgemma-key.sh hf_XXXXXXXXXXXXXXXXXXXXX

# Puis déployer les fonctions
cd firebase-functions
npm run deploy
```

## Utilisation

Une fois configuré, MedGemma sera automatiquement utilisé pour :
- L'analyse des images médicales uploadées
- La détection du type d'image (radiographie, biologie, ECG, autre)
- La génération d'analyses détaillées avec terminologie médicale

### Types d'images supportés

1. **Images médicales** (medical)
   - Radiographies
   - IRM
   - Scanners
   - Échographies

2. **Résultats biologiques** (biology)
   - Analyses de sang
   - Résultats de laboratoire
   - Bilans biologiques

3. **ECG** (ecg)
   - Électrocardiogrammes
   - Tracés cardiaques

4. **Autres** (other)
   - Images cliniques diverses
   - Photos de lésions
   - Autres documents visuels

## Fallback

Si MedGemma n'est pas configuré ou en cas d'erreur :
- En production : Utilise GPT-4o via Firebase Functions
- En développement : Utilise GPT-4o directement

## Troubleshooting

### Erreur "Clé API invalide"
- Vérifiez que votre token Hugging Face est valide
- Assurez-vous qu'il commence par `hf_`

### Erreur "Timeout"
- MedGemma peut prendre jusqu'à 60 secondes pour analyser une image complexe
- Vérifiez votre connexion internet

### Pas d'analyse d'image
- Vérifiez que le bouton MedGemma affiche une coche verte
- Reconfigurez la clé API si nécessaire 