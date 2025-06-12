# Flux d'analyse - Clinical Case Analyzer

## 🔵 ANALYSE INITIALE (1ère fois)

### Étapes séquentielles :

1. **Analyse d'images** (si images présentes)
   - Modèle : GPT-4o Vision (dev) / o3 (production)
   - Input : Images uploadées en base64
   - Output : Description médicale des images

2. **Recherche académique**
   - Modèle : Perplexity sonar
   - Input : Cas clinique initial + Résultats analyse images
   - Output : Rapport de recherche avec sources

3. **Analyse des références**
   - Modèle : GPT-4o
   - Input : Sources extraites du rapport Perplexity
   - Output : Références enrichies (titre, auteurs, journal, année)

4. **Analyse clinique complète**
   - Modèle : o3
   - Input : TOUT (Rapport Perplexity + Références analysées + Images analysées + Cas clinique)
   - Output : 7 sections structurées

## 🟣 REPRISE APPROFONDIE (2 crédits)

### Étapes séquentielles :

1. **Analyse nouvelles images** (si ajoutées)
   - Modèle : GPT-4o Vision / o3
   - Input : Nouvelles images uniquement

2. **Recherche exhaustive**
   - Modèle : Perplexity sonar
   - Input : 
     - Cas initial
     - Modifications (texte et images)
     - Analyse précédente complète
     - Instructions spéciales pour approfondir
   - Output : Nouveau rapport enrichi

3. **Analyse des nouvelles références**
   - Modèle : GPT-4o
   - Input : Nouvelles sources Perplexity
   - Output : Nouvelles références enrichies

4. **Analyse approfondie**
   - Modèle : o3
   - Input : Tout le nouveau contenu + historique complet
   - Output : Analyse plus détaillée avec arbres décisionnels

## 🟠 RELANCE ANALYSE (1 crédit)

### Une seule étape :

- **Analyse clinique mise à jour**
  - Modèle : o3 UNIQUEMENT
  - Input :
    - Résultats actuellement affichés
    - Références actuelles
    - Modifications récentes (texte ou images)
  - Output : Sections mises à jour
  - ⚠️ PAS de nouvelle recherche Perplexity

## 🔍 RECHERCHE MALADIES RARES

### Recherche initiale (1 crédit) :

- **Recherche spécialisée**
  - Modèle : Perplexity sonar-deep-research
  - Input : Cas clinique + Analyse o3 complète
  - Filtres : 
    - Domaines : Orphanet, OMIM, GeneReviews
    - Sources < 5 ans
  - Output : Maladies rares identifiées avec références

### Relance recherche maladies rares :

- **Option A** : Bouton dédié dans la section
  - Même processus que recherche initiale
  - Input additionnel : Résultats précédents

- **Option B** : Inclus dans reprise approfondie
  - Automatiquement intégré dans la recherche exhaustive

## 📊 Résumé des coûts

- Analyse initiale : 1 crédit
- Reprise approfondie : 2 crédits  
- Relance analyse : 1 crédit
- Recherche maladies rares : 1 crédit 


___ UPDATE 

graph TD
    A["1. Analyse Image MedGemma<br/>(promptType sélectionné)"] --> B["2. Analyse o3 avec image<br/>(structure 7 sections)"]
    B --> C["3. Perplexity Search<br/>(basé sur o3, structure 7 sections)"]
    C --> D["4. Parse sections Perplexity<br/>(REMPLACE o3 si succès)"]
    D --> E["5. Extract références<br/>(TOUTES les 10 sources)"]
    E --> F["6. Web Search GPT-4o mini<br/>(métadonnées RÉELLES)"]
    F --> G["7. Ajout citations intelligentes<br/>(placement précis [1], [2])"]
    G --> H["8. Affichage final<br/>(sections Perplexity + références enrichies)"]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#fff3e0


Flux final validé :
MedGemma → Analyse image avec prompt sélectionné
o3 → Structure en 7 sections avec imagerie
Perplexity → Recherche académique structurée
Parser → Sections Perplexity remplacent o3
Extract → TOUTES les 10 sources Perplexity
Web Search → Métadonnées réelles (auteurs, journaux, années)
Citations → Placement intelligent [1], [2] dans les sections
Affichage → Sections enrichies + références complètes