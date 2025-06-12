# Correction des Références Perplexity

## Problèmes identifiés par l'utilisateur

1. **Seulement 4 références affichées** au lieu des 10 disponibles dans `search_results`
2. **Journaux "inventés"** : Informations déduites automatiquement depuis l'URL mais parfois incorrectes
3. **Auteurs manquants** : Toujours "Non spécifié" car Perplexity ne les fournit pas
4. **Contenu affiché** : L'analyse o3 structurée était affichée mais pas le rapport Perplexity brut

## Corrections apportées

### 1. Extraction de TOUTES les références disponibles

**Avant** : L'extracteur prenait seulement les références `[1]`, `[5]`, `[7]`, `[10]` citées dans le texte

**Après** : Utilisation de **TOUS les `search_results`** disponibles (les 10 sources)

```typescript
// PRIORITÉ 1: Utiliser les search_results (plus complets que les citations)
if (perplexityReport.search_results && perplexityReport.search_results.length > 0) {
  perplexityReport.search_results.forEach((result, index) => {
    // Crée une référence pour chaque source disponible
  });
}
```

### 2. Amélioration de la déduction des journaux

**Ajout de nouveaux patterns** pour détecter les journaux depuis l'URL :

- `academic.oup.com` → Oxford Academic (puis extraction du journal spécifique)
- `semanticscholar.org` → Semantic Scholar
- `latunisiemedicale.com` → La Tunisie Médicale
- `cfp.ca` → Canadian Family Physician
- Etc.

**Extraction depuis le titre** pour les journaux spécifiques :
- "QJM" → "QJM: An International Journal of Medicine"
- "Journal of Bone and Joint Surgery" → "The Journal of Bone and Joint Surgery"

### 3. Consigne stricte pour GPT-4o

**Nouveaux prompts plus conservateurs** :

```typescript
INSTRUCTIONS STRICTES:
1. Ne JAMAIS inventer d'auteurs - si tu ne peux pas les identifier précisément, mets "Non disponible"
2. Pour les années : utilise la date fournie ou celle dans l'URL, sinon null
3. SOIS CONSERVATEUR - mieux vaut "Non disponible" qu'une information inventée
```

**Température réduite** : `0.1` au lieu de `0.3` pour éviter l'invention

### 4. Affichage du rapport Perplexity structuré

**Nouvelle section dans l'interface** : "Recherche académique complète (Perplexity)"

- Affichage du contenu Perplexity avec formatage Markdown
- Liste de **TOUTES les sources** trouvées (les 10)
- Liens cliquables vers chaque source
- Affichage des dates de publication

### 5. Correction Firebase Functions

**Firebase Functions** maintenant configurée pour traiter **TOUTES les sources** :

```javascript
INSTRUCTIONS:
1. Crée une référence pour CHAQUE source dans search_results (même si elle n'est pas citée dans le texte)
2. NE PAS filtrer les références selon le texte - inclure TOUTES les sources
```

## Résultat attendu

### Avant
- 4 références affichées
- Journaux parfois incorrects ("QJM: An International Journal of Medicine" non justifié)
- Auteurs inventés par GPT-4o
- Seulement l'analyse o3 visible

### Après
- **10 références affichées** (toutes les sources Perplexity)
- Journaux **correctement déduits** depuis l'URL ou marqués "Non disponible"
- Auteurs **"Non disponible"** plutôt qu'inventés
- **Rapport Perplexity affiché** en plus de l'analyse o3
- **Toutes les sources cliquables** avec dates

## Test recommandé

1. Soumettre un nouveau cas clinique
2. Vérifier que la section "Recherche académique complète (Perplexity)" s'affiche
3. Compter le nombre de références dans "Références bibliographiques" (devrait être ~10)
4. Vérifier que les auteurs sont marqués "Non disponible" quand inconnus
5. Cliquer sur les liens des sources pour vérifier qu'ils fonctionnent 