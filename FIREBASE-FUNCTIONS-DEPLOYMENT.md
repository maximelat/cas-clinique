# Déploiement des Firebase Functions

## Prérequis

1. Firebase CLI installé : `npm install -g firebase-tools`
2. Projet Firebase avec Blaze Plan (nécessaire pour les fonctions)
3. Clé API OpenAI

## Configuration

### 1. Initialiser Firebase Functions

```bash
firebase init functions
```

Choisissez :
- JavaScript
- ESLint : No
- Install dependencies : Yes

### 2. Configurer la clé OpenAI

```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```

### 3. Déployer les fonctions

```bash
cd firebase-functions
npm install
firebase deploy --only functions
```

## Fonctions déployées

- `analyzeWithO3` : Analyse finale avec o3
- `analyzeImageWithO3` : Analyse d'images avec o3
- `analyzePerplexityWithGPT4Mini` : Traitement des données Perplexity
- `transcribeAudio` : Transcription audio

## Test local

Pour tester localement :

```bash
cd firebase-functions
npm run serve
```

## Vérification

Dans la console Firebase :
1. Functions → Vérifier que les 4 fonctions sont déployées
2. Logs → Vérifier les erreurs éventuelles

## Variables GitHub Actions

Ajoutez dans vos secrets GitHub :
- `FIREBASE_SERVICE_ACCOUNT` : Le JSON du compte de service Firebase

## Déploiement automatique

Le workflow GitHub Actions peut être configuré pour déployer automatiquement les fonctions :

```yaml
- name: Deploy Firebase Functions
  run: |
    cd firebase-functions
    npm install
    npx firebase-tools deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}
```

## Coûts

- Les Firebase Functions sont facturées à l'usage
- Avec le plan Blaze : 2 millions d'invocations gratuites/mois
- Coût estimé : ~0.40$ pour 1000 analyses

## Debug

Si les fonctions ne marchent pas :
1. Vérifiez les logs : `firebase functions:log`
2. Vérifiez la configuration : `firebase functions:config:get`
3. Assurez-vous que le projet est en plan Blaze 