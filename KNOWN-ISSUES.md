# Problèmes connus

## 1. Erreur de couleur "oklch" lors de l'export PDF

### Description
Lors de l'utilisation de l'export PDF, une erreur non bloquante peut apparaître dans la console :
```
Error: Attempting to parse an unsupported color function "oklch"
```

### Impact
- L'export PDF fonctionne correctement malgré cette erreur
- C'est un problème de compatibilité entre les couleurs CSS modernes et html2canvas

### Solution
- Cette erreur peut être ignorée
- Le PDF est généré correctement

### Statut
Non critique - Aucune action requise

## 2. Paramètre max_tokens avec le modèle o3-2025-04-16 (RÉSOLU)

### Description
Le modèle o3-2025-04-16 nécessite l'utilisation de `max_completion_tokens` au lieu de `max_tokens`.

### Solution appliquée
- ✅ Remplacé `max_tokens` par `max_completion_tokens` dans tous les appels API
- ✅ Testé et vérifié avec succès

## 3. Avertissements de préchargement de polices

### Description
Des avertissements peuvent apparaître concernant des polices préchargées mais non utilisées.

### Impact
- Aucun impact sur les fonctionnalités
- Performance non affectée

### Statut
Non critique - Optimisation future possible 