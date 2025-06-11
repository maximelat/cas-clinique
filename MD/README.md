# Clinical Case Analyzer

Application web pour l'analyse de cas cliniques médicaux utilisant l'intelligence artificielle.

🌐 **Démo en ligne** : [http://latry.consulting/projet/clinical-case-analyzer](http://latry.consulting/projet/clinical-case-analyzer)

## Fonctionnalités

- 🧠 **Analyse IA simulée** en mode démo
- 📊 **7 sections structurées** pour une analyse complète
- 📚 **Références scientifiques** avec citations cliquables
- 📱 **Interface responsive** moderne avec Tailwind CSS
- 🚀 **Déploiement automatique** via GitHub Actions

## Mode Démo

La version actuellement déployée est une démonstration qui :
- Simule l'analyse d'un cas clinique
- Affiche un exemple complet d'analyse structurée
- Illustre l'interface et les fonctionnalités

## Installation locale

1. **Cloner le repository**
```bash
git clone [votre-repo]
cd clinical-case-analyzer
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer en développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Déploiement sur OVH

### Prérequis

1. Un hébergement web OVH avec accès FTP
2. Un repository GitHub
3. Les secrets GitHub configurés (voir ci-dessous)

### Configuration des secrets GitHub

Dans votre repository GitHub → Settings → Secrets → Actions, ajoutez :

- **FTP_USERNAME** : Votre nom d'utilisateur FTP OVH
- **FTP_PASSWORD** : Votre mot de passe FTP OVH  
- **serveur-ovh-url** : L'URL du serveur FTP (ex: ftp.cluster0XX.hosting.ovh.net)

### Déploiement automatique

Le déploiement se fait automatiquement :
- À chaque push sur la branche `main`
- Ou manuellement via Actions → Deploy to OVH → Run workflow

Le site sera déployé dans `/www/projet/clinical-case-analyzer/`

### Structure du déploiement

```
/www/projet/clinical-case-analyzer/
├── index.html
├── demo/
├── _next/
├── .htaccess (configuration Apache)
└── ... autres fichiers statiques
```

## Architecture technique

### Frontend (Version démo)
- **Framework** : Next.js 14 avec export statique
- **UI** : Tailwind CSS + shadcn/ui
- **Routing** : Côté client uniquement
- **État** : React hooks (useState)

### Pour la version complète

La version complète nécessiterait :

1. **Backend API** (Node.js/Express ou Next.js API Routes)
   - Authentification Google OAuth
   - Gestion des crédits utilisateurs
   - Intégration Perplexity Academic
   - Intégration OpenAI o3

2. **Base de données** PostgreSQL
   - Stockage des cas cliniques
   - Gestion des utilisateurs
   - Audit logs

3. **Services externes**
   - Google Cloud (OAuth)
   - Perplexity API
   - OpenAI API

## Évolutions possibles

1. **Version API complète**
   - Déployer le backend sur un service cloud (Render, Railway, Vercel)
   - Connecter le frontend statique à l'API

2. **Authentification**
   - Implémenter l'authentification côté client avec Firebase Auth
   - Ou utiliser un service comme Auth0

3. **Stockage**
   - Utiliser Supabase pour la base de données et l'authentification
   - Ou Firebase pour une solution tout-en-un

## Support

Pour toute question ou demande de fonctionnalité, contactez-nous via le site.

## Licence

Propriétaire - Tous droits réservés
