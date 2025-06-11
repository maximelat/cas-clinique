# Refactoring : Inversion du flux O3 → Perplexity

## Date : 2025-01-17

## Changements majeurs

### 1. Inversion du flux d'analyse

**Avant** : Perplexity → GPT-4o (analyse références) → O3
**Après** : O3 → Perplexity (basé sur l'analyse O3)

### Avantages :
- Les sources sont maintenant directement liées au contenu analysé par O3
- Pas de décorrélation entre les références et le contenu
- Suppression de l'étape intermédiaire GPT-4o pour l'analyse des références
- Flux plus logique : analyse clinique d'abord, puis recherche de sources

### 2. Modifications dans `ai-client.ts`

#### Nouvelle méthode `analyzeWithO3Simple`
- Analyse clinique pure sans références
- Instructions explicites pour NE PAS ajouter de références [1], [2], etc.
- Format structuré identique mais sans sources

#### Refactoring de `analyzeClinicalCase`
```typescript
// Nouveau flux
1. Analyse des images (si présentes)
2. Analyse O3 du cas clinique
3. Recherche Perplexity basée sur l'analyse O3
4. Extraction directe des références (sans GPT-4o)
```

#### Mise à jour de `deepAnalysis`
- Suit le même flux : O3 d'abord, puis Perplexity
- Contexte enrichi avec les modifications pour O3
- Recherche Perplexity basée sur la nouvelle analyse

### 3. Consommation des crédits

Toutes les fonctions déduisent maintenant correctement les crédits :

| Fonction | Crédits | Description |
|----------|---------|-------------|
| `handleAnalyze` | 1 | Analyse simple ou approfondie |
| `searchForRareDiseases` | 1 | Recherche de maladies rares |
| `handleDeepAnalysis` | 2 | Reprise approfondie complète |
| `handleRelaunchAnalysis` | 1 | Relance de l'analyse |

### 4. Corrections additionnelles

#### Sauvegarde des analyses
- Utilisation de `setDoc` avec l'ID personnalisé au lieu de `addDoc`
- Format : `analysis_TIMESTAMP_RANDOM`
- Support des anciens IDs `cas-XXX` dans `HistoryService.getAnalysis()`

#### Affichage des références
- Extraction améliorée des métadonnées (titre, auteurs, année, journal)
- Détection automatique du journal depuis l'URL
- Meilleur formatage dans l'interface

#### Gestion des versions
- Système de versions déjà implémenté dans `analysis/view`
- Sauvegarde automatique des versions précédentes
- Possibilité de restaurer une version antérieure

### 5. Impact sur l'expérience utilisateur

**Positif** :
- Sources plus pertinentes et mieux alignées avec l'analyse
- Temps de traitement légèrement réduit (pas d'étape GPT-4o)
- Références directement liées au contenu analysé

**À surveiller** :
- La qualité des sources Perplexity basées sur l'analyse O3
- L'adaptation des utilisateurs au nouveau flux

### 6. Tests recommandés

1. **Analyse simple** : Vérifier que les références correspondent au contenu
2. **Analyse approfondie** : Vérifier la cohérence des sources
3. **Reprise approfondie** : Tester avec des modifications multiples
4. **Maladies rares** : Vérifier que les sources sont spécifiques
5. **Crédits** : Confirmer la déduction correcte pour chaque fonction

### 7. Prochaines étapes possibles

1. Ajouter un système de scoring de pertinence des références
2. Permettre à l'utilisateur de filtrer les sources par date/type
3. Implémenter un cache pour les recherches Perplexity similaires
4. Ajouter des métriques pour comparer l'ancien et le nouveau flux 