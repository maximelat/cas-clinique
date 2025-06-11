# Correction : Problème de récupération d'historique

## Problème identifié

Les analyses n'étaient pas retrouvées avec leur ID personnalisé `analysis_TIMESTAMP_RANDOM`.

### Cause racine

Le code utilisait `addDoc` qui génère automatiquement un ID Firebase, alors que l'ID personnalisé était stocké dans le champ `id` du document :

```typescript
// AVANT (problématique)
const docRef = await addDoc(collection(db, 'analyses'), historyEntry)
// Cela créait un document avec un ID Firebase auto-généré
// L'ID personnalisé était dans historyEntry.id mais pas utilisé comme ID du document
```

### Solution implémentée

Utiliser `setDoc` avec l'ID personnalisé comme ID du document :

```typescript
// APRÈS (corrigé)
const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
await setDoc(doc(db, 'analyses', analysisId), historyEntry)
// Cela crée un document avec analysisId comme ID du document
```

## Changements effectués

### 1. Import de `setDoc`
```typescript
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
```

### 2. Modification de la sauvegarde
- Génération de l'ID avant la création de `historyEntry`
- Utilisation de `setDoc` au lieu de `addDoc`
- Stockage de l'ID dans `analysisData` pour le partage

### 3. Gestion des cas connecté/non connecté
- Si connecté : sauvegarde avec ID et mise à jour de `analysisData`
- Si non connecté : définition de `analysisData` sans ID

## Impact

- Les nouvelles analyses seront sauvegardées avec leur ID personnalisé comme ID de document
- Les anciennes analyses restent accessibles grâce à la recherche par champ `id` dans `HistoryService.getAnalysis()`
- Les URLs de partage fonctionneront correctement avec le format `/analysis/view?id=analysis_TIMESTAMP_RANDOM`

## Test de vérification

1. Créer une nouvelle analyse
2. Vérifier dans la console que l'ID est bien `analysis_TIMESTAMP_RANDOM`
3. Copier l'URL de partage
4. Ouvrir l'URL dans un nouvel onglet
5. L'analyse doit se charger correctement 