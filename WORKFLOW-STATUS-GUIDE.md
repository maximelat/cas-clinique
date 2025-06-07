# Guide - Vérifier le statut des workflows GitHub Actions

## État actuel

🎉 **Bonne nouvelle !** Vos workflows se sont déployés avec succès :
- ✅ **Deploy to OVH** : Complété avec succès
- 🔄 **Deploy Firebase Functions** : En cours d'exécution

## 1. Interface Web GitHub

Le moyen le plus simple est d'aller directement sur GitHub :
- **Tous les workflows** : https://github.com/maximelat/cas-clinique/actions
- **Workflow OVH** : https://github.com/maximelat/cas-clinique/actions/workflows/deploy.yml
- **Workflow Firebase** : https://github.com/maximelat/cas-clinique/actions/workflows/deploy-firebase.yml

## 2. Scripts de monitoring

J'ai créé deux scripts pour vous :

### Script simple : `check-workflow-status.sh`
```bash
./check-workflow-status.sh
```
Affiche un résumé rapide des derniers workflows.

### Script avancé : `monitor-workflow.sh`
```bash
# Affichage unique
./monitor-workflow.sh

# Mode surveillance continue (actualisation toutes les 30 secondes)
./monitor-workflow.sh --watch
```

## 3. GitHub CLI (recommandé)

Installez d'abord GitHub CLI :
```bash
brew install gh
```

Puis utilisez ces commandes :
```bash
# Lister les workflows récents
gh run list --repo maximelat/cas-clinique

# Voir le détail d'un workflow
gh run view <RUN_ID> --repo maximelat/cas-clinique

# Suivre un workflow en temps réel
gh run watch <RUN_ID> --repo maximelat/cas-clinique
```

## 4. API GitHub directe

```bash
# Derniers workflows
curl -s "https://api.github.com/repos/maximelat/cas-clinique/actions/runs" | jq '.workflow_runs[:5]'

# Workflows en cours uniquement
curl -s "https://api.github.com/repos/maximelat/cas-clinique/actions/runs?status=in_progress" | jq '.workflow_runs'
```

## Résumé des déploiements

Vos dernières corrections ont été déployées avec succès :

1. **Prompt Perplexity amélioré** : Sources < 5 ans avec citations obligatoires
2. **Extraction des références corrigée** : Pattern regex amélioré
3. **Réponse o3 corrigée** : Navigation dans la structure de réponse
4. **Images avec GPT-4o** : Utilisation de GPT-4o pour l'analyse d'images

## Prochaines étapes

Une fois le workflow Firebase terminé (environ 5-10 minutes), testez votre application :
1. Allez sur https://latry.consulting/projet/clinical-case-analyzer/
2. Activez le mode réel
3. Soumettez un cas clinique pour vérifier que tout fonctionne

## Dépannage

Si un workflow échoue :
1. Cliquez sur le workflow dans GitHub Actions
2. Regardez les logs détaillés
3. Les erreurs courantes :
   - Secrets manquants
   - Erreurs de syntaxe
   - Problèmes de permissions

## Notifications

Pour recevoir des notifications de statut :
1. Allez dans Settings > Notifications sur GitHub
2. Activez les notifications pour "Actions"
3. Vous recevrez un email en cas d'échec 