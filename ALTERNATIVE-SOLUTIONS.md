# 🚀 Solutions Alternatives (Plus Simples)

## Si Firebase Functions pose problème, voici des alternatives :

## 1. Solution Vercel (Recommandée) ✨

### Étape 1 : Créer un nouveau projet Vercel
```bash
npx create-next-app@latest cas-clinique-api --typescript
cd cas-clinique-api
```

### Étape 2 : Créer les API routes
Créez `app/api/openai/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...params } = body;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

### Étape 3 : Déployer sur Vercel
1. Push sur GitHub
2. Connectez à Vercel.com
3. Ajoutez `OPENAI_API_KEY` dans les variables d'environnement
4. Déployez !

### Étape 4 : Modifier votre app
Dans `src/services/ai-client.ts`, changez les URLs :
```javascript
const API_URL = 'https://votre-app.vercel.app/api/openai';
```

## 2. Solution Netlify Functions 🎯

### Créer `netlify/functions/openai.js` :
```javascript
exports.handler = async (event, context) => {
  const { action, ...params } = JSON.parse(event.body);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://latry.consulting',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data)
  };
};
```

## 3. Solution Proxy CORS (Temporaire) ⚡

### Option A : Utiliser un proxy public
Dans `src/services/ai-client.ts` :
```javascript
const PROXY_URL = 'https://corsproxy.io/?';
const OPENAI_URL = PROXY_URL + encodeURIComponent('https://api.openai.com/v1/chat/completions');
```

⚠️ **Attention** : Les proxys publics sont lents et peu fiables.

### Option B : Votre propre proxy
Déployez ce code sur n'importe quel serveur Node.js :

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: 'https://latry.consulting' }));
app.use(express.json());

app.post('/api/openai', async (req, res) => {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

## 4. Solution Cloudflare Workers 🌐

Créez un worker :
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Gérer CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://latry.consulting',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  const body = await request.json();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://latry.consulting',
    }
  });
}
```

## Recommandation Finale

**Pour la simplicité** : Utilisez Vercel (gratuit, rapide, simple)
**Pour le contrôle** : Utilisez votre propre serveur Node.js
**Pour le scale** : Restez sur Firebase Functions (mais il faut configurer la clé)

## Aide Rapide

Si vous voulez que je vous aide à implémenter une de ces solutions, dites-moi laquelle vous préférez ! 