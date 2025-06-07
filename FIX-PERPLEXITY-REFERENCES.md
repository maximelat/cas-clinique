# Correction de l'extraction des références Perplexity

## Problème identifié

Perplexity retourne les références dans le texte avec le format `[1]`, `[2]`, etc., mais l'array `citations` est vide.

## Solution implémentée

### 1. Extraction améliorée des références

Le nouveau code extrait les références de plusieurs façons :

```javascript
// Pattern 1: [1] [titre](URL) dans le texte
// Pattern 2: ### **Sources** [1] [titre](URL) dans la section sources
const referencePattern = /\[(\d+)\]\s*(?:\[([^\]]+)\]\s*)?\(([^)]+)\)|### \*\*Sources\*\*[\s\S]*?\[(\d+)\]\s*\[([^\]]+)\]\(([^)]+)\)/g;
```

### 2. Gestion des erreurs d'analyse d'image

- Les erreurs d'analyse d'image ne bloquent plus le processus complet
- Try/catch autour de chaque analyse d'image
- Message d'erreur ajouté dans le rapport si l'image échoue

### 3. Utilisation de GPT-4o pour les images

o3 ne supporte pas encore les images via l'API Responses, donc :
- Firebase Functions : utilise GPT-4o pour analyser les images
- Mode développement : utilise aussi GPT-4o

## Améliorations du prompt Perplexity

Le prompt système demande maintenant explicitement :
1. Sources de moins de 5 ans (2020-2025)
2. Citations obligatoires [1], [2], etc. pour chaque affirmation
3. URLs complètes pour chaque source
4. Structure claire en sections

## Statut

✅ Code mis à jour dans src/services/ai-client.ts
✅ Firebase Functions mises à jour pour utiliser GPT-4o pour les images
✅ Extraction des références améliorée
✅ Gestion d'erreurs robuste

## Test

Pour vérifier que les corrections fonctionnent :
1. Soumettre un cas avec une image
2. Vérifier que l'analyse continue même si l'image échoue
3. Vérifier que les références sont extraites du texte Perplexity
4. Vérifier que les 7 sections s'affichent correctement 