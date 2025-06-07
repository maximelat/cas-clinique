# Options Sécurisées pour les Clés API

## 🔒 Le problème de sécurité

Avec `NEXT_PUBLIC_*`, vos clés API sont visibles dans le code source du navigateur !

## ✅ Solutions gratuites et sécurisées

### Option 1 : Cloudflare Workers (Recommandé - 100% gratuit)

1. Créez un compte Cloudflare gratuit
2. Créez un Worker qui fait le proxy :

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Vérifier l'origine pour la sécurité
    const allowedOrigins = ['https://latry.consulting'];
    const origin = request.headers.get('Origin');
    
    if (!allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    
    if (body.action === 'perplexity') {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.PERPLEXITY_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body.data)
      });
      
      return new Response(await response.text(), {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Similaire pour OpenAI...
  }
}
```

3. Configurez vos secrets dans Cloudflare
4. Utilisez l'URL du Worker dans votre app

### Option 2 : Netlify Functions (Gratuit avec limites)

1. Créez `netlify/functions/api.js` :

```javascript
exports.handler = async (event, context) => {
  const { action, data } = JSON.parse(event.body);
  
  if (action === 'perplexity') {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return {
      statusCode: 200,
      body: await response.text()
    };
  }
}
```

2. Déployez sur Netlify (gratuit jusqu'à 125k requêtes/mois)

### Option 3 : Vercel Edge Functions (Gratuit avec limites)

Similar à Netlify mais avec l'avantage d'être intégré à Next.js.

### Option 4 : GitHub Pages + GitHub Actions (Hackish mais gratuit)

Utilisez GitHub Actions comme "backend" en déclenchant des workflows via l'API GitHub.

## 🎯 Configuration recommandée

1. **Développement** : Utilisez les clés directement (NEXT_PUBLIC_*)
2. **Production** : Utilisez Cloudflare Workers

```javascript
// src/services/ai-client.ts
const API_URL = process.env.NODE_ENV === 'development' 
  ? '/api/analyze'  // Route API locale
  : 'https://your-worker.workers.dev'; // Cloudflare Worker
```

## 🚀 Mise en place rapide avec Cloudflare

1. Inscrivez-vous sur https://cloudflare.com
2. Allez dans Workers & Pages
3. Créez un nouveau Worker
4. Collez le code du proxy
5. Ajoutez vos secrets
6. Déployez et récupérez l'URL

Temps total : ~10 minutes 