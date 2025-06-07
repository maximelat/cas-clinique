# 🚀 Guide de Démarrage Rapide Firebase

## Configuration en 3 étapes

### 1. Obtenir le Token Firebase (une seule fois)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Générer le token pour GitHub Actions
firebase login:ci
```

### 2. Ajouter les Secrets à GitHub

1. Allez dans votre repo GitHub → **Settings** → **Secrets** → **Actions**
2. Ajoutez ces secrets :
   - `FIREBASE_TOKEN` = [votre token Firebase]
   - `FIREBASE_PROJECT_ID` = [ID de votre projet Firebase]
3. Vérifiez que `openai` est déjà configuré (votre clé OpenAI)

### 3. Déployer

**Option A - Déploiement automatique** (recommandé)
- Les fonctions se déploient automatiquement lors d'un push sur `main`
- Ou déclenchez manuellement dans l'onglet **Actions** de GitHub

**Option B - Déploiement local**
```bash
cd firebase-functions
./deploy-local.sh
```

## ✅ C'est tout !

Vos fonctions Firebase utilisent maintenant votre clé OpenAI depuis GitHub.

## 🔍 Vérification

1. Console Firebase → Functions → Vérifier que les 4 fonctions sont déployées
2. Logs Firebase → Vérifier qu'il n'y a pas d'erreurs
3. Tester depuis votre application

## 📝 Notes

- La clé OpenAI est récupérée depuis `functions.config().openai.key`
- En local, elle est dans `.runtimeconfig.json` (ignoré par git)
- En production, elle vient du secret GitHub `openai` 