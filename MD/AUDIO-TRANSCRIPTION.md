# Guide de la transcription audio

## Vue d'ensemble

La fonctionnalité de transcription audio permet aux utilisateurs de dicter oralement leurs cas cliniques au lieu de les taper. Cette fonction utilise l'API OpenAI Audio avec le modèle `gpt-4o-transcribe` optimisé pour le français médical.

## Utilisation

### 1. Accéder à la fonctionnalité

- Rendez-vous sur la page de démonstration : https://latry.consulting/projet/clinical-case-analyzer/demo
- Le bouton "Dicter" apparaît à droite du label "Cas clinique"

### 2. Commencer l'enregistrement

1. Cliquez sur le bouton **"Dicter"** 🎤
2. Autorisez l'accès au microphone dans votre navigateur
3. Un compteur de temps s'affiche pour indiquer la durée d'enregistrement
4. Parlez clairement pour dicter votre cas clinique

### 3. Contrôles disponibles pendant l'enregistrement

- **Pause** ⏸️ : Met l'enregistrement en pause
- **Reprendre** ▶️ : Reprend l'enregistrement après une pause
- **Arrêter** 🎤 : Termine l'enregistrement et lance la transcription

### 4. Transcription

- Après avoir cliqué sur "Arrêter", la transcription démarre automatiquement
- Un message "Transcription en cours..." s'affiche
- Le texte transcrit apparaît automatiquement dans le champ de texte

## Modes de fonctionnement

### Mode Démo
- Simule la transcription sans appel API
- Insère un exemple de cas clinique prédéfini
- Idéal pour tester l'interface

### Mode Réel
- Utilise l'API OpenAI pour une vraie transcription
- Nécessite une clé API OpenAI configurée
- Optimisé pour les termes médicaux français

## Configuration technique

### Paramètres audio
- Suppression du bruit activée
- Annulation d'écho activée
- Contrôle automatique du gain
- Format : WebM avec codec Opus

### Modèle de transcription
- Modèle : `gpt-4o-transcribe`
- Langue : Français
- Prompt optimisé : "Transcription d'un cas clinique médical en français avec termes médicaux."

## Compatibilité navigateur

La fonctionnalité nécessite :
- Un navigateur moderne supportant l'API MediaRecorder
- Chrome/Edge : ✅ Pleinement supporté
- Firefox : ✅ Pleinement supporté
- Safari : ✅ Supporté (iOS 14.3+)
- Opera : ✅ Pleinement supporté

## Résolution des problèmes

### "Impossible d'accéder au microphone"
- Vérifiez les permissions du navigateur
- Assurez-vous qu'aucune autre application n'utilise le microphone
- Essayez de rafraîchir la page

### "Erreur CORS avec la transcription"
- En mode réel, l'API OpenAI peut avoir des restrictions CORS
- Solution : Utiliser un backend proxy (voir SECURE-OPTIONS.md)

### Pas de bouton "Dicter" visible
- Vérifiez que votre navigateur supporte l'enregistrement audio
- Mettez à jour votre navigateur vers la dernière version

## Conseils pour une meilleure transcription

1. **Environnement calme** : Minimisez le bruit de fond
2. **Parlez clairement** : Articulez bien, surtout pour les termes médicaux
3. **Débit régulier** : Évitez de parler trop vite
4. **Pauses naturelles** : Faites des pauses entre les phrases
5. **Termes techniques** : Prononcez distinctement les termes médicaux

## Limitations

- Taille maximale d'enregistrement : 25 MB
- Durée recommandée : < 10 minutes pour de meilleures performances
- Formats supportés : WebM (automatique)
- Une seule langue par transcription (français configuré) 