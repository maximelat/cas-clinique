# Guide de Déploiement - Analyseur de Cas Cliniques

## Problème : Routes API avec Export Statique

Next.js en mode `export` (statique) ne supporte pas les routes API. Cela cause une erreur 404 lors des appels à `/api/analyze`.

## Solutions

### Option 1 : Déploiement sur Vercel (Recommandé)

Déployez sur Vercel qui supporte les routes API nativement :

1. Connectez votre repo GitHub à Vercel
2. Les variables d'environnement seront automatiquement configurées
3. Les routes API fonctionneront sans modification

### Option 2 : Backend Séparé

Créez un serveur Express.js séparé pour gérer les APIs :

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  // Gérer les appels Perplexity et OpenAI
});

app.listen(3001);
```

Puis configurez `NEXT_PUBLIC_API_URL` dans GitHub Secrets pour pointer vers votre backend.

### Option 3 : Serverless Functions

Utilisez des fonctions serverless (AWS Lambda, Netlify Functions, etc.) :

1. Créez des fonctions pour chaque endpoint
2. Configurez CORS
3. Mettez à jour `NEXT_PUBLIC_API_URL`

## Configuration des Variables

### GitHub Secrets requis :

- `PERPLEXITY` : Clé API Perplexity
- `OPENAI` : Clé API OpenAI  
- `API_URL` : URL du backend (si option 2 ou 3)
- `FTP_USERNAME` : Utilisateur FTP
- `FTP_PASSWORD` : Mot de passe FTP
- `SERVER` : Serveur FTP

### Variables d'environnement locales :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
PERPLEXITY_API_KEY=your-key
OPENAI_API_KEY=your-key
``` 