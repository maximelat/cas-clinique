# Architecture o3 + o4-mini

## Vue d'ensemble

L'application utilise maintenant une architecture multi-modèles pour l'analyse des cas cliniques :

1. **Perplexity Academic** : Recherche dans la littérature médicale
2. **o4-mini-2025-04-16** : Analyse des images médicales (radiographies, IRM, biologie, ECG)
3. **o3-2025-04-16** : Analyse médicale complète intégrant toutes les données

## Flux de traitement

```
Cas clinique (texte) → Perplexity Academic
                           ↓
Images médicales → o4-mini → Analyse d'images
                           ↓
                    o3 (avec toutes les données) → Analyse complète en 7 sections
```

## API Responses vs Chat Completions

### Changements majeurs

Les modèles o3 et o4-mini utilisent l'API **Responses** (`/v1/responses`) et non l'API Chat Completions :

```javascript
// Ancien format (GPT)
{
  model: "gpt-4",
  messages: [...],
  temperature: 0.3,
  max_tokens: 1500
}

// Nouveau format (o3/o4-mini)
{
  model: "o3-2025-04-16",
  reasoning: { effort: "medium" },
  input: [...],
  max_output_tokens: 25000
}
```

### Paramètres importants

- **reasoning.effort** : `"low"`, `"medium"`, ou `"high"`
  - Low : Rapide, économique
  - Medium : Équilibre (recommandé)
  - High : Analyse approfondie

- **max_output_tokens** : Réserver au moins 25 000 tokens pour o3
- **temperature** : Non supporté (utilise toujours 1.0)

## Types d'images supportés

Le système détecte automatiquement le type d'image basé sur le nom du fichier :

- **biology** : bio, lab, sang
- **ecg** : ecg, ekg
- **medical** : radio, rx, irm, scan, echo
- **other** : autres images médicales

## Analyse d'images avec o4-mini

o4-mini analyse les images médicales avec un reasoning effort élevé pour :
- Identifier les anomalies
- Comparer aux valeurs de référence
- Fournir une interprétation clinique

## Intégration avec o3

o3 reçoit :
1. Le cas clinique original
2. Les résultats de recherche Perplexity
3. Les analyses d'images de o4-mini

Et produit une analyse structurée en 7 sections avec citations des sources.

## Gestion des erreurs

### Erreurs courantes

1. **"Unsupported parameter"** : Utiliser les bons paramètres pour o3/o4-mini
2. **"max_output_tokens reached"** : Augmenter la limite (25000+ recommandé)
3. **CORS** : Nécessite un backend en production

### Limites de contexte

- o3 : 200K tokens de contexte
- o4-mini : 128K tokens de contexte
- Réserver suffisamment d'espace pour le reasoning interne 