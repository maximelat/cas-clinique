# Guide d'utilisation - Mode Réel avec APIs

## 🚀 Configuration des clés API

Pour utiliser le mode réel (non-démo), vous devez configurer les clés API dans les secrets GitHub.

### 1. Obtenir les clés API

#### Perplexity API
1. Créez un compte sur [Perplexity.ai](https://www.perplexity.ai/)
2. Allez dans Settings → API
3. Générez une clé API
4. Copiez la clé (format: `pplx-xxxxx...`)

#### OpenAI API
1. Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Allez dans API Keys
3. Créez une nouvelle clé
4. Copiez la clé (format: `sk-xxxxx...`)

### 2. Ajouter les secrets GitHub

Dans votre repository GitHub :
1. Settings → Secrets and variables → Actions
2. Ajoutez ces secrets :
   - `PERPLEXITY` : Votre clé API Perplexity
   - `OPENAI` : Votre clé API OpenAI

### 3. Redéployer

Après avoir ajouté les secrets :
- Faites un petit changement et push
- Ou allez dans Actions → Re-run workflow

## 🎮 Utilisation du mode réel

### Sur le site déployé

1. Allez sur [https://latry.consulting/projet/clinical-case-analyzer/demo/](https://latry.consulting/projet/clinical-case-analyzer/demo/)
2. **Désactivez le mode démo** avec le toggle en haut à droite
3. Si les clés sont configurées, vous verrez "Mode analyse réelle" en vert
4. Collez votre cas clinique
5. Cliquez sur "Analyser le cas"

### Ce qui se passe en mode réel

1. **Recherche Perplexity** (5-10s)
   - Recherche académique sur PubMed, Google Scholar, etc.
   - Extraction des citations et références

2. **Analyse GPT-4** (30-60s)
   - 7 appels séparés pour chaque section
   - Utilisation du contexte de recherche
   - Références croisées avec les citations

3. **Résultat final**
   - Analyse médicale complète
   - Références scientifiques réelles
   - Contenu adapté au cas spécifique

## ⚠️ Important - Sécurité

**ATTENTION** : Les clés API sont exposées côté client dans cette version de démonstration !

Pour une utilisation en production :
1. **NE PAS** utiliser cette approche
2. Créer un backend sécurisé
3. Stocker les clés côté serveur uniquement
4. Implémenter une authentification

## 💰 Coûts estimés

### Par analyse complète :
- **Perplexity** : ~0.10-0.20€ (1 requête)
- **OpenAI GPT-4** : ~0.50-1.00€ (7 requêtes)
- **Total** : ~0.60-1.20€ par cas

### Recommandations :
- Définir des limites de dépenses sur OpenAI
- Surveiller l'usage via les dashboards
- Considérer GPT-3.5 pour réduire les coûts

## 🔧 Dépannage

### "Clés API manquantes"
- Vérifiez que les secrets sont bien configurés
- Redéployez après ajout des secrets

### "Erreur lors de l'analyse"
- Vérifiez le solde de vos comptes API
- Consultez la console du navigateur (F12)
- Les APIs peuvent être temporairement indisponibles

### Analyse très lente
- Normal : 30-60 secondes au total
- Perplexity : 5-10s
- GPT-4 : 5-10s par section

## 📊 Exemple de cas clinique

```
Patient de 45 ans, diabétique type 2, se présente pour fatigue intense 
depuis 3 semaines. Perte de poids de 5kg non intentionnelle. 
Polyurie et polydipsie. Glycémie à jeun : 3.2 g/L. HbA1c : 11%.
Pas d'antécédent de complications diabétiques connues.
Examen : déshydratation modérée, pas de signes d'acidose.
```

Ce type de cas génèrera une analyse complète avec :
- Contexte et urgence de la décompensation
- Recherche de facteurs déclenchants
- Examens à réaliser
- Protocole de prise en charge
- Éducation thérapeutique adaptée

## 🚀 Évolutions futures

1. **Backend sécurisé** pour protéger les clés
2. **Cache des analyses** pour économiser les API
3. **Export PDF** avec mise en page médicale
4. **Modèles spécialisés** par pathologie
5. **Intégration CIM-10** pour codification

---

Pour toute question : consultez les logs GitHub Actions ou ouvrez une issue. 