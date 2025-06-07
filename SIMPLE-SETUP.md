# Configuration Simple et Gratuite

## 🚀 Solution directe avec clés API côté client

Cette configuration permet d'utiliser les APIs directement depuis le navigateur, sans backend séparé.

### ⚠️ Important
- **Sécurité** : Les clés API seront visibles dans le code source
- À utiliser uniquement pour des projets de démonstration ou personnels
- Pour une application en production, utilisez un backend sécurisé

### 📝 Configuration

1. **Copiez le fichier d'exemple** :
```bash
cp env.example .env.local
```

2. **Ajoutez vos clés API** dans `.env.local` :
```env
NEXT_PUBLIC_PERPLEXITY_API_KEY=votre-clé-perplexity
NEXT_PUBLIC_OPENAI_API_KEY=votre-clé-openai
```

3. **Pour le déploiement GitHub** :
   - Allez dans Settings > Secrets > Actions
   - Ajoutez `perplexity` et `openai` avec vos clés API

### 🎯 Fonctionnement

- **Perplexity** : Supporte les appels directs depuis le navigateur ✅
- **OpenAI** : Peut nécessiter un proxy CORS (intégré dans le code)

### 🆓 Proxys CORS gratuits (si nécessaire)

Si OpenAI bloque les appels directs :
1. Activez temporairement : https://cors-anywhere.herokuapp.com/corsdemo
2. Ou utilisez : https://allorigins.win/

### 💡 Alternative : Mode démo uniquement

Si vous ne voulez pas exposer vos clés :
- Utilisez uniquement le mode démo
- Les clés API ne sont pas nécessaires

### 🔧 Test local

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000/demo

### 📦 Déploiement

Le site se déploie automatiquement sur OVH via GitHub Actions à chaque push sur `main`. 