# ⚠️ Limitation CORS en Production

## Le Problème

Votre site est déployé comme un **site statique** (HTML/CSS/JS) sur OVH. Les appels à l'API OpenAI depuis le navigateur sont bloqués par CORS (Cross-Origin Resource Sharing).

### Pourquoi ça marche avec Perplexity mais pas OpenAI ?

- ✅ **Perplexity** : Autorise les appels depuis les navigateurs (CORS activé)
- ❌ **OpenAI** : Bloque les appels depuis les navigateurs (sécurité)

## Solutions

### 1. 🎯 Solution Immédiate : Mode Démo
**Recommandé pour tester**
- Cliquez sur "Mode Démo" 
- Utilise des données simulées
- Toutes les fonctionnalités disponibles
- Pas besoin d'API

### 2. 🔧 Solution Temporaire : Extension Chrome
**Pour tester avec les vraies API**
1. Installez l'extension Chrome "CORS Unblock" ou "Allow CORS"
2. Activez-la uniquement sur votre site
3. Les appels OpenAI fonctionneront
4. ⚠️ **Désactivez après usage** (sécurité)

### 3. 🚀 Solution Production : Backend
**Pour un déploiement réel**

Vous avez besoin d'un serveur backend qui fera les appels OpenAI pour vous :

#### Option A : Vercel (Gratuit)
```javascript
// api/openai.js
export default async function handler(req, res) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.status(200).json(data);
}
```

#### Option B : Netlify Functions
#### Option C : AWS Lambda
#### Option D : Serveur Node.js sur OVH

## Résumé

| Environnement | Perplexity | OpenAI | Solution |
|--------------|------------|---------|----------|
| Local (dev) | ✅ | ✅ | Fonctionne |
| Production | ✅ | ❌ CORS | Mode Démo ou Backend |

## FAQ

**Q: Pourquoi Next.js n'utilise pas les routes API ?**
R: Votre configuration utilise `output: 'export'` qui génère un site statique. Les routes API nécessitent un serveur Node.js.

**Q: C'est un bug ?**
R: Non, c'est une mesure de sécurité d'OpenAI. Les clés API ne doivent pas être exposées dans le navigateur.

**Q: Quelle est la meilleure solution ?**
R: Pour la production, un backend est obligatoire. Pour tester, utilisez le mode démo ou une extension CORS. 