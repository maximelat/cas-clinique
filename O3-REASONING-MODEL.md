# 🧠 o3-2025-04-16 : Modèle de Raisonnement

## Changement Important

o3 n'est pas un modèle GPT classique mais un **modèle de raisonnement** qui utilise l'**API Responses** (pas l'API Chat Completions).

## Différences Clés

### API Chat Completions (GPT) vs API Responses (o3)

| Aspect | GPT (Chat API) | o3 (Responses API) |
|--------|----------------|--------------------|
| Endpoint | `/v1/chat/completions` | `/v1/responses` |
| Paramètre tokens | `max_tokens` | `max_output_tokens` |
| Format input | `messages` | `input` |
| Raisonnement | Non | Oui (`reasoning.effort`) |
| Format output | `choices[0].message.content` | `output_text` |

## Configuration o3

```javascript
// ✅ CORRECT - API Responses
const response = await axios.post(
  'https://api.openai.com/v1/responses',
  {
    model: 'o3-2025-04-16',
    reasoning: { effort: 'medium' }, // low, medium, high
    input: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_output_tokens: 25000 // PAS max_tokens !
  }
);

const text = response.data.output_text;
```

## Analyse d'Images avec o3

```javascript
{
  model: 'o3-2025-04-16',
  reasoning: { effort: 'high' },
  input: [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: prompt
        },
        {
          type: 'input_image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64WithoutPrefix
          }
        }
      ]
    }
  ],
  max_output_tokens: 5000
}
```

## Reasoning Tokens

o3 génère des "reasoning tokens" invisibles pour réfléchir avant de répondre :

```json
{
  "usage": {
    "input_tokens": 75,
    "output_tokens": 1186,
    "output_tokens_details": {
      "reasoning_tokens": 1024  // Tokens de raisonnement
    }
  }
}
```

## Bonnes Pratiques pour o3

1. **Instructions de haut niveau** : o3 est comme un expert senior, donnez l'objectif général
2. **Moins de micro-instructions** : Laissez o3 raisonner sur la meilleure approche
3. **Effort adapté** :
   - `low` : Réponses rapides
   - `medium` : Équilibre (défaut)
   - `high` : Analyse approfondie (images, cas complexes)

## État Actuel

✅ **Déployé** sur Firebase Functions
✅ **API Responses** configurée correctement
✅ **Gestion des erreurs** adaptée
✅ **Support images** avec format correct

## Flux Actuel

1. **Perplexity** → Recherche académique
2. **GPT-4o** → Analyse des liens (reste sur Chat API)
3. **o3** → Analyse images (Responses API)
4. **o3** → Analyse finale (Responses API) 