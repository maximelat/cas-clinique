# Solutions pour les Erreurs CORS

## Problème Actuel

Après la requête Perplexity (qui fonctionne car leur API supporte CORS), l'appel à OpenAI échoue probablement à cause de CORS (Cross-Origin Resource Sharing).

## Pourquoi CORS ?

Les navigateurs bloquent les requêtes vers des domaines différents pour des raisons de sécurité. OpenAI n'autorise pas les appels directs depuis les navigateurs (contrairement à Perplexity).

## Solutions

### 1. **Solution Temporaire : Extension Chrome**
Pour tester rapidement :
- Installez l'extension "CORS Unblock" ou "Allow CORS"
- Activez-la uniquement pour vos tests
- **⚠️ ATTENTION** : Désactivez-la après, c'est un risque de sécurité

### 2. **Solution Recommandée : API Route Next.js**
Créez une route API dans votre projet Next.js :

```typescript
// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt, model } = await request.json();
  
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      // ... autres paramètres
    })
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

Puis dans votre service :
```typescript
// Au lieu d'appeler directement OpenAI
const response = await axios.post('/api/analyze', {
  prompt: prompt,
  model: 'o3-2025-04-16'
});
```

### 3. **Solution Production : Backend Séparé**
Pour une vraie production :
- Créez un backend Node.js/Express
- Stockez les clés API côté serveur
- Implémentez l'authentification
- Gérez les limites de taux

## Configuration Rapide

Pour faire fonctionner rapidement votre app :

1. **Vérifiez vos clés API** dans la console :
   ```javascript
   console.log('Perplexity:', !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY);
   console.log('OpenAI:', !!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
   ```

2. **Testez avec une API Route** (recommandé)

3. **Ou utilisez le mode Demo** qui ne nécessite pas d'API

## Debug

Dans la console du navigateur, vous devriez voir :
- ✅ "Réponse Perplexity complète" 
- ✅ "Recherche Perplexity terminée"
- ❌ Erreur CORS ou Network Error après

C'est normal ! OpenAI bloque les appels depuis les navigateurs. 