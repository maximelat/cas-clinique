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

# Configuration de test pour l'analyse de cas cliniques

## Environnement de test actuel

- URL: https://latry.consulting/projet/clinical-case-analyzer/
- Mode: Client-side avec clés API exposées (NEXT_PUBLIC_)
- Déploiement: GitHub Actions vers FTP OVH

## Changements récents

1. **Migration vers API Responses** : 
   - o3-2025-04-16 utilise `/v1/responses` et non `/v1/chat/completions`
   - Paramètres : `reasoning.effort`, `input` (pas `messages`), `max_output_tokens`
   - ⚠️ Pas de `temperature` (toujours 1.0)

2. **Analyse d'images avec o4-mini-2025-04-16** :
   - Analyse automatique des images médicales uploadées
   - Types détectés : biology, ecg, medical, other
   - Les résultats sont envoyés à o3 avec les données Perplexity

3. **Nouvelle architecture multi-modèles** :
   ```
   Texte → Perplexity Academic
   Images → o4-mini → Analyses d'images
   Tout → o3 → Analyse complète en 7 sections
   ```

4. **Transcription audio** :
   - Modèle `gpt-4o-transcribe` pour la dictée
   - Optimisé pour le français médical

5. **Authentification Google SSO et crédits** :
   - Connexion avec compte Google
   - 3 crédits gratuits à l'inscription
   - 1 crédit par analyse en mode réel
   - Interface admin pour maxime.latry@gmail.com

## Configuration API

### Variables d'environnement (GitHub Secrets)

#### APIs IA
- `NEXT_PUBLIC_OPENAI_API_KEY`
- `NEXT_PUBLIC_PERPLEXITY_API_KEY`

#### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APPID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENTID`

### Modèles utilisés
- OpenAI o3: `o3-2025-04-16` (analyse principale)
- OpenAI o4-mini: `o4-mini-2025-04-16` (analyse d'images)
- OpenAI Audio: `gpt-4o-transcribe` (transcription)
- Perplexity: `sonar-reasoning-pro` (recherche académique)

## Mode Démo

Le mode démo fonctionne sans clés API et simule :
- L'analyse avec des sections prédéfinies
- La transcription avec un texte d'exemple

## Mode Réel

Nécessite les clés API configurées et permet :
- Recherche académique via Perplexity
- Analyse complète via OpenAI
- Transcription audio en temps réel
- Export PDF et téléchargement du rapport Perplexity

## Test de transcription

1. Cliquer sur le bouton "Dicter"
2. Autoriser l'accès au microphone
3. Parler pour dicter le cas clinique
4. Cliquer sur "Arrêter" pour terminer
5. La transcription apparaît automatiquement dans le champ texte

## Notes de sécurité

Pour un déploiement production, voir `SECURE-OPTIONS.md` pour des alternatives sécurisées aux clés API côté client. 