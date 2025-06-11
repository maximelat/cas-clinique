# Fonctionnalités de l'Analyseur de Cas Cliniques

## 🎯 Vue d'ensemble

Application web complète pour l'analyse de cas cliniques médicaux utilisant l'IA, avec authentification, système de crédits et analyse multimodale.

## 🚀 Fonctionnalités principales

### 1. **Analyse IA avancée**
- **Perplexity Academic** : Recherche dans la littérature médicale récente
- **o3-2025-04-16** : Analyse complète et structuration en 7 sections
- **o4-mini-2025-04-16** : Analyse d'images médicales (radiographies, IRM, biologie, ECG)

### 2. **7 sections d'analyse**
1. Contexte clinique
2. Données clés
3. Hypothèses diagnostiques
4. Examens complémentaires
5. Décisions thérapeutiques
6. Pronostic et suivi
7. Explications patient

### 3. **Transcription audio** 🎤
- Dictée vocale des cas cliniques
- Modèle `gpt-4o-transcribe` optimisé pour le français médical
- Contrôles : enregistrer, pause, reprendre, arrêter

### 4. **Analyse d'images médicales** 🏥
- Upload multiple d'images
- Détection automatique du type :
  - Biologie (analyses sanguines)
  - ECG (électrocardiogrammes)
  - Imagerie (radio, IRM, scanner, écho)
- Analyse par o4-mini avant intégration

### 5. **Authentification Google SSO** 🔐
- Connexion sécurisée avec compte Google
- Session persistante
- Profil utilisateur avec statistiques

### 6. **Système de crédits** 💳
- **3 crédits gratuits** à l'inscription
- **1 crédit** par analyse en mode réel
- **Mode démo** gratuit et illimité

### 7. **Interface d'administration** 👨‍💼
- Réservée à maxime.latry@gmail.com
- Gestion des utilisateurs
- Ajout/réinitialisation de crédits
- Historique des transactions

### 8. **Export et partage** 📤
- Export PDF de l'analyse complète
- Copie dans le presse-papier
- Téléchargement du rapport Perplexity
- Références bibliographiques complètes

## 🛠️ Architecture technique

### Frontend
- **Next.js 14** avec App Router
- **TypeScript** pour la sécurité du typage
- **Tailwind CSS** + **shadcn/ui** pour l'interface
- **React Markdown** pour le rendu des analyses

### Backend/Services
- **Firebase Authentication** : Google SSO
- **Firebase Firestore** : Base de données
- **GitHub Actions** : CI/CD automatisé
- **FTP Deploy** : Déploiement sur OVH

### APIs utilisées
- **OpenAI** : o3, o4-mini, gpt-4o-transcribe
- **Perplexity** : sonar-reasoning-pro (recherche académique)

## 📱 Modes d'utilisation

### Mode Démo
- ✅ Accès libre sans connexion
- ✅ Analyse simulée avec exemple préformaté
- ✅ Toutes les fonctionnalités UI disponibles
- ✅ Pas de consommation de crédits

### Mode Réel
- 🔐 Connexion requise
- 💳 Consomme 1 crédit par analyse
- 🧠 Analyse IA complète en temps réel
- 📚 Recherche académique actualisée
- 🖼️ Analyse d'images médicales

## 🔒 Sécurité et conformité

- Authentification OAuth 2.0
- Données stockées dans Firestore sécurisé
- Pas de stockage des cas cliniques analysés
- Transactions auditées et traçables
- Clés API sécurisées dans GitHub Secrets

## 📊 Statistiques utilisateur

- Nombre de crédits restants
- Total d'analyses effectuées
- Dernière utilisation
- Historique des transactions (admin)

## 🌐 Déploiement

- URL : https://latry.consulting/projet/clinical-case-analyzer/
- Déploiement automatique sur push vers `main`
- Build statique Next.js optimisé
- Compatible tous navigateurs modernes

## 📖 Documentation disponible

1. **AUTHENTICATION-GUIDE.md** : Guide utilisateur pour l'authentification
2. **AUDIO-TRANSCRIPTION.md** : Guide de la transcription vocale
3. **IMAGE-ANALYSIS-GUIDE.md** : Guide pour l'analyse d'images
4. **FIREBASE-SETUP.md** : Configuration Firebase
5. **O3-O4-ARCHITECTURE.md** : Architecture des modèles IA
6. **SECURE-OPTIONS.md** : Options de déploiement sécurisé
7. **KNOWN-ISSUES.md** : Problèmes connus et solutions

## 🚧 Évolutions futures possibles

- [ ] Application mobile
- [ ] Plus de langues (anglais, espagnol)
- [ ] Intégration avec dossiers médicaux
- [ ] API pour intégration tierce
- [ ] Abonnements mensuels
- [ ] Analyses spécialisées par spécialité 