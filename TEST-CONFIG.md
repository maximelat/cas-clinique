# Guide de Test de la Configuration

## 🧪 Test de votre configuration

### 1. Test en local

```bash
# Copiez le fichier d'exemple si ce n'est pas fait
cp env.example .env.local

# Ajoutez vos clés dans .env.local
NEXT_PUBLIC_PERPLEXITY_API_KEY=votre-clé-perplexity
NEXT_PUBLIC_OPENAI_API_KEY=votre-clé-openai

# Lancez l'application
npm run dev
```

### 2. Cas de test médical

Utilisez ce cas pour tester :

```
Patient de 47 ans, diabétique type 2, hypertendu. 
Présente une dysmorphie faciale progressive : visage allongé, 
nez proéminent, lèvres épaisses, prognathisme. 
Augmentation de la pointure de 40 à 43 sur 5 ans. 
Transpiration excessive. HbA1c à 6%. 
Suspicion d'acromégalie.
```

### 3. Résultats attendus

✅ **Mode démo** : Affichage immédiat d'un cas d'infarctus pré-formaté

✅ **Mode réel avec APIs** :
1. Recherche Perplexity (~10-15 secondes)
2. Analyse progressive des 7 sections (~30-60 secondes)
3. Références académiques avec liens

### 4. Dépannage

**Erreur "Clés API non configurées"** :
- Vérifiez que `.env.local` contient bien vos clés
- Redémarrez le serveur de développement

**Erreur CORS avec OpenAI** :
- Normal en développement local
- Le code essaiera automatiquement sans proxy
- En production, utilisez Cloudflare Workers (voir SECURE-OPTIONS.md)

**Erreur "Model o3 not found"** :
- Le code utilise maintenant `gpt-4-turbo-preview`
- Assurez-vous d'avoir accès à GPT-4 sur votre compte OpenAI

### 5. Vérification des clés API

**Perplexity** :
- Testez sur https://docs.perplexity.ai/playground
- Vérifiez que vous avez des crédits

**OpenAI** :
- Testez sur https://platform.openai.com/playground
- Vérifiez l'accès à GPT-4

### 6. Console du navigateur

Ouvrez la console (F12) pour voir :
- Les requêtes API
- Les réponses Perplexity avec citations
- Les éventuelles erreurs

### 7. Fonctionnalités à tester

- [ ] Mode démo fonctionne
- [ ] Toggle démo/réel fonctionne
- [ ] Recherche Perplexity retourne des résultats
- [ ] Les 7 sections s'affichent progressivement
- [ ] Les références sont cliquables
- [ ] Export PDF fonctionne
- [ ] Téléchargement du rapport Perplexity 