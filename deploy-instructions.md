# Instructions de déploiement sur OVH

## 📋 Étapes pour déployer votre site

### 1. Repository GitHub déjà créé ✅

Le repository est disponible à : https://github.com/maximelat/cas-clinique/

### 2. Secrets GitHub configurés ✅

Les secrets suivants sont déjà configurés :
- **FTP_USERNAME** : Votre identifiant FTP OVH
- **FTP_PASSWORD** : Votre mot de passe FTP OVH  
- **SERVER** : L'adresse de votre serveur FTP

### 3. Push initial et déploiement

```bash
# Initialiser git et faire le premier push
git init
git add .
git commit -m "Initial commit - Clinical Case Analyzer Demo"
git branch -M main
git remote add origin https://github.com/maximelat/cas-clinique.git
git push -u origin main
```

### 4. Vérifier le déploiement

Après le push, le déploiement se lancera automatiquement :
1. Allez sur https://github.com/maximelat/cas-clinique/actions
2. Vous verrez le workflow "Deploy to OVH" en cours
3. Attendez 5-10 minutes

Le site sera accessible à :
**https://latry.consulting/projet/clinical-case-analyzer/**

## 🔧 Dépannage

### Le workflow échoue

1. **Vérifiez les logs** : Cliquez sur le workflow dans l'onglet Actions
2. **Permissions FTP** : Vérifiez que l'utilisateur FTP a les droits d'écriture

### Le site affiche une erreur 404

1. Vérifiez que les fichiers sont bien dans `/www/projet/clinical-case-analyzer/`
2. Le fichier `.htaccess` doit être présent
3. Videz le cache de votre navigateur

## 📝 Notes

- C'est une **version de démonstration** sans authentification
- L'analyse est simulée côté client
- Aucune donnée n'est stockée

## 🚀 Déploiements futurs

Tout nouveau push sur la branche `main` déclenchera automatiquement un nouveau déploiement. 