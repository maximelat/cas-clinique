# Problème : Décorrélation des références entre Perplexity et o3

## Description du problème

L'analyse o3 reçoit les informations de Perplexity avec des références [1], [2], etc., mais les place de manière aléatoire dans le texte, créant une décorrélation entre :
- Les vraies sources trouvées par Perplexity
- Les numéros de référence placés par o3 dans l'analyse

## Cause racine

1. **Perplexity** trouve des sources et les numérote [1], [2], [3]...
2. **o3** reçoit le texte avec ces références mais ne comprend pas toujours quelle référence correspond à quelle information
3. **Résultat** : o3 place les références de manière approximative ou invente de nouvelles références

## Solutions implémentées

### 1. Instructions explicites à o3
```typescript
// Dans analyzeWithO3
IMPORTANT: Utilise ces références [1], [2], etc. de manière COHÉRENTE avec le contenu de la recherche académique ci-dessus. 
Place chaque référence à côté de l'information qu'elle supporte réellement.
```

### 2. Liste des références valides
Fourniture explicite à o3 de la liste des références disponibles :
```typescript
RÉFÉRENCES DISPONIBLES (à utiliser dans ton analyse):
[1] - Référence académique validée
[2] - Référence académique validée
[3] - Référence académique validée
```

### 3. Post-traitement des références
Vérification après l'analyse o3 que les références utilisées existent vraiment :
```typescript
private postProcessReferences(text: string, validReferences: string[]): string {
  // Vérifier que chaque [X] utilisé existe dans les sources Perplexity
}
```

### 4. Séparation claire des informations
Structure améliorée du contexte pour o3 :
```
=== INFORMATIONS SOURCÉES (issues de la recherche académique) ===
[Contenu Perplexity avec références]

=== ANALYSE DÉTAILLÉE DES RÉFÉRENCES ===
[Analyse GPT-4o des références]

=== ANALYSES D'IMAGERIE MÉDICALE ===
[Si applicable]
```

## Limitations restantes

1. **o3 reste un modèle génératif** : Il peut toujours placer des références de manière approximative
2. **Perplexity ne fournit pas toujours le contexte exact** : Difficile de savoir quelle partie du texte correspond à quelle source
3. **Solution idéale** : Avoir un mapping exact entre chaque phrase et sa source (non disponible actuellement)

## Recommandations

1. **Pour l'utilisateur** : Toujours vérifier les sources en cliquant sur les liens
2. **Pour le développement futur** : 
   - Explorer des APIs qui fournissent un mapping phrase-source
   - Utiliser un modèle spécialisé pour l'attribution de sources
   - Implémenter un système de vérification croisée plus sophistiqué

## Impact sur l'expérience utilisateur

- Les références sont maintenant plus cohérentes
- Un avertissement dans la console indique les références mal placées
- Les sources restent accessibles et vérifiables via les liens 