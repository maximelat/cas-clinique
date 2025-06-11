# Correction Erreur Firestore - Valeurs Undefined

## Problème
`FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined`

Firestore n'accepte pas les valeurs `undefined` dans les documents. Seules les valeurs suivantes sont acceptées :
- Valeurs définies (string, number, boolean, etc.)
- `null`
- Arrays et objets (sans undefined à l'intérieur)

## Solution implémentée

Dans `src/services/history.ts`, méthode `saveAnalysis()` :

1. **Remplacer undefined par null** :
   ```typescript
   perplexityReport: analysis.perplexityReport || null,
   rareDiseaseData: analysis.rareDiseaseData || null,
   images: analysis.images || null
   ```

2. **Filtrer les champs undefined** :
   ```typescript
   const cleanedDoc = Object.entries(analysisDoc).reduce((acc, [key, value]) => {
     if (value !== undefined) {
       acc[key as keyof AnalysisRecord] = value;
     }
     return acc;
   }, {} as any);
   ```

## Pourquoi cette erreur ?

L'erreur survenait lors de la sauvegarde d'une analyse sans recherche de maladies rares :
- `rareDiseaseData` était `undefined`
- Firestore rejetait le document

## Test
1. Faire une analyse normale (sans recherche de maladies rares)
2. L'analyse doit être sauvegardée sans erreur
3. Vérifier dans l'historique que l'analyse apparaît 