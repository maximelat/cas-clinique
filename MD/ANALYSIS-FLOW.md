# Flow d'Analyse Clinique - Documentation Technique

## Vue d'ensemble

L'application utilise une architecture en cascade combinant trois services d'IA pour produire une analyse clinique complète :
1. **Perplexity** (sonar-reasoning-pro) : Recherche académique
2. **OpenAI o4-mini** : Analyse d'images médicales
3. **OpenAI o3** : Synthèse et structuration finale

## Enchaînement des Requêtes

### 1. Initialisation de l'Analyse

```typescript
analyzeClinicalCase(
  caseText: string,
  images?: { base64: string, type: string }[]
) 
```

L'utilisateur soumet :
- Un texte décrivant le cas clinique
- Des images médicales optionnelles (radiographies, IRM, résultats biologiques, etc.)

### 2. Recherche Académique (Perplexity)

**Endpoint** : `https://api.perplexity.ai/chat/completions`

**Configuration** :
```json
{
  "model": "sonar-reasoning-pro",
  "search_mode": "academic",
  "web_search_options": {
    "search_context_size": "high"
  }
}
```

**Traitement de la réponse** :
1. Extraction du contenu principal
2. Nettoyage des balises `<think>...</think>`
3. Extraction des citations (URLs académiques)

### 3. Analyse des Images (o4-mini)

Si des images sont présentes :

**Endpoint** : `https://api.openai.com/v1/responses`

**Format de requête** :
```json
{
  "model": "o4-mini",
  "reasoning": { "effort": "high" },
  "input": [{
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Analyse cette image médicale..."
      },
      {
        "type": "input_image",
        "source": {
          "type": "base64",
          "media_type": "image/jpeg",
          "data": "base64_data"
        }
      }
    ]
  }]
}
```

Chaque image est analysée individuellement avec un prompt spécialisé selon le type :
- **medical** : Radiographies, IRM, scanners
- **biology** : Résultats de laboratoire
- **ecg** : Électrocardiogrammes
- **other** : Autres images cliniques

### 4. Synthèse Finale (o3)

**Données combinées** :
- Résultats de recherche Perplexity
- Analyses d'images o4-mini
- Cas clinique original

**Prompt structuré** demandant 7 sections obligatoires :
1. **CLINICAL_CONTEXT** : Contexte et résumé
2. **KEY_DATA** : Données cliniques importantes
3. **DIAGNOSTIC_HYPOTHESES** : Hypothèses diagnostiques
4. **COMPLEMENTARY_EXAMS** : Examens complémentaires
5. **THERAPEUTIC_DECISIONS** : Décisions thérapeutiques
6. **PROGNOSIS_FOLLOWUP** : Pronostic et suivi
7. **PATIENT_EXPLANATIONS** : Explications patient

### 5. Parsing et Structuration

#### Extraction des Sections
```typescript
parseSections(analysis: string): Section[]
```

Utilise plusieurs patterns regex pour identifier les sections :
- Headers markdown (`## SECTION_NAME`)
- Patterns numérotés (`1. SECTION_NAME`)
- Patterns directs (`SECTION_NAME:`)

#### Extraction des Références
```typescript
extractReferences(perplexityReport): Reference[]
```

Extrait et structure les citations académiques :
- URLs des sources
- Numérotation [1], [2], etc.
- Métadonnées si disponibles (titre, auteurs, année)

## Gestion des Erreurs

### Points de défaillance potentiels :
1. **CORS** : Les API sont appelées directement depuis le navigateur
2. **Limites de tokens** : o3 a un max de 25,000 tokens de sortie
3. **Format d'image** : o4-mini nécessite le format base64 avec type MIME

### Solutions mises en place :
- Mode démo pour tester sans API
- Messages d'erreur détaillés
- Fallback si parsing échoue

## Optimisations

1. **Callbacks de progression** : L'utilisateur voit l'état en temps réel
2. **Traitement parallèle** : Les images sont analysées séquentiellement mais pourraient être parallélisées
3. **Cache** : Pas de cache actuellement, chaque analyse est unique

## Exemple de Flow Complet

1. **Input** : "Homme 67 ans, dyspnée progressive..." + Radio thorax
2. **Perplexity** : Trouve 10 articles sur BPCO, insuffisance cardiaque
3. **o4-mini** : "Cardiomégalie, épanchement pleural bilatéral..."
4. **o3** : Synthétise en 7 sections structurées avec citations
5. **Output** : Interface accordéon avec analyse complète et références

## Variables d'Environnement Requises

```env
NEXT_PUBLIC_PERPLEXITY_API_KEY=pplx-xxxxx
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxx
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
# ... autres variables Firebase
```

Note : Le préfixe `NEXT_PUBLIC_` est obligatoire pour les variables accessibles côté client dans Next.js. 