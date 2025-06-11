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

## 2. Erreurs API avec o3-2025-04-16 (RÉSOLU)

### Problèmes rencontrés et solutions
1. **"Unsupported parameter: 'max_tokens'"** → Utiliser `max_output_tokens`
2. **"Unsupported value: 'temperature'"** → Retirer (o3 utilise toujours 1.0)
3. **Mauvaise URL API** → Utiliser `/v1/responses` au lieu de `/v1/chat/completions`

### Structure correcte pour o3/o4-mini
```javascript
{
  model: "o3-2025-04-16",
  reasoning: { effort: "medium" },
  input: [{ role: "user", content: "..." }],
  max_output_tokens: 25000
}
```

### Statut
✅ RÉSOLU - L'API Responses est maintenant correctement implémentée

## 3. Avertissements de préchargement de polices

### Description
Des avertissements peuvent apparaître concernant des polices préchargées mais non utilisées.

### Impact
- Aucun impact sur les fonctionnalités
- Performance non affectée

### Statut
Non critique - Optimisation future possible 