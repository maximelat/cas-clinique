# Historique et Transcription - Guide Complet

## 1. Historique des Analyses ✅

### Fonctionnalités implémentées

1. **Service d'historique** (`src/services/history.ts`)
   - Sauvegarde automatique après chaque analyse
   - Mise à jour lors de la recherche de maladies rares
   - Recherche dans l'historique
   - Suppression avec confirmation

2. **Page historique** (`src/app/history/page.tsx`)
   - Liste des analyses avec titre, date, ID
   - Barre de recherche
   - Suppression avec confirmation
   - Accès rapide à chaque analyse

3. **Page de visualisation** (`src/app/analysis/[id]/page.tsx`)
   - Affichage complet de l'analyse sauvegardée
   - Tous les boutons d'export (PDF, TXT, etc.)
   - Vérification de propriété (seul le propriétaire peut voir)

4. **Intégration dans la navigation**
   - Bouton "Historique" visible pour les utilisateurs connectés
   - Sauvegarde automatique après analyse
   - Mise à jour lors de l'ajout de maladies rares

### Structure des données sauvegardées
```typescript
{
  id: string,              // ID unique
  userId: string,          // Propriétaire
  title: string,           // 100 premiers caractères du cas
  date: Timestamp,         // Date Firebase
  caseText: string,        // Texte original
  sections: any[],         // 7 sections d'analyse
  references: any[],       // Références bibliographiques
  perplexityReport?: any,  // Rapport de recherche
  rareDiseaseData?: any,   // Recherche maladies rares
  images?: any[]           // Images médicales
}
```

## 2. Transcription Audio 🎤

### Problème identifié
L'erreur "Invalid file format" indique que le fichier webm n'est pas correctement envoyé.

### Solution implémentée
1. **Essai avec gpt-4o-transcribe d'abord** (meilleure qualité)
   - `response_format: 'json'` obligatoire
   - Supporte le français nativement

2. **Fallback sur whisper-1** si échec
   - Plus robuste avec différents formats
   - Pas de response_format obligatoire

### Configuration Firebase Functions
```javascript
// Essai 1 : gpt-4o-transcribe
formData.append('file', audioBuffer, {
  filename: 'audio.webm',
  contentType: 'audio/webm'
});
formData.append('model', 'gpt-4o-transcribe');
formData.append('language', 'fr');
formData.append('response_format', 'json'); // Obligatoire

// Si échec, essai 2 : whisper-1
formData2.append('model', 'whisper-1');
formData2.append('language', 'fr');
// Pas de response_format
```

### Secret GitHub
- **Nom** : `OPENAI`
- **Utilisation** : 
  - GitHub Actions : `${{ secrets.OPENAI }}`
  - Firebase : `functions.config().openai.key`
- **Déploiement** : `firebase functions:config:set openai.key="$OPENAI"`

## 3. Mode d'emploi

### Pour l'utilisateur

1. **Historique**
   - Cliquer sur "Historique" dans la navigation
   - Rechercher par titre ou contenu
   - Cliquer sur une analyse pour la revoir
   - Supprimer avec l'icône poubelle

2. **Transcription**
   - Cliquer sur "Dicter"
   - Parler clairement en français
   - Cliquer sur "Arrêter"
   - Attendre la transcription

### Pour le développeur

1. **Tester la transcription**
   ```bash
   # Voir les logs Firebase
   firebase functions:log --project cas-clinique
   ```

2. **Vérifier la configuration**
   ```bash
   # Vérifier les secrets
   firebase functions:config:get --project cas-clinique
   ```

## 4. Déploiement

Les modifications sont déployées automatiquement via GitHub Actions :
- Push sur `main` → Déploiement automatique
- Firebase Functions mises à jour
- Site web mis à jour sur OVH

## 5. Prochaines étapes possibles

1. **Historique**
   - Export de tout l'historique
   - Partage d'analyses
   - Tags et catégories

2. **Transcription**
   - Support d'autres langues
   - Amélioration de la qualité avec prompts
   - Indicateur de niveau sonore 