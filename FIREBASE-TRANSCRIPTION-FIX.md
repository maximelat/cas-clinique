# Correction de la transcription audio Firebase

## Problème identifié
La fonction Firebase `transcribeAudio` utilisait des paramètres non supportés par l'API OpenAI, causant une erreur 400.

## Paramètres supprimés (non supportés)
- `prompt` - Non nécessaire pour la transcription
- `temperature` - Non supporté pour l'API transcription  
- `chunking_strategy` - Paramètre inexistant dans l'API

## Paramètres conservés (essentiels)
```javascript
formData.append('file', audioBuffer, {...});
formData.append('model', 'gpt-4o-transcribe');
formData.append('language', 'fr');
formData.append('response_format', 'json'); // Obligatoire pour gpt-4o-transcribe
```

## Améliorations ajoutées
1. **Vérification de la clé API** avant tout appel
2. **Logs détaillés** pour le debug
3. **Gestion d'erreur améliorée** avec plus de contexte
4. **Limites de taille** : `maxBodyLength: Infinity` pour les gros fichiers audio

## Déploiement
La fonction a été déployée avec succès sur Firebase Functions (région europe-west1).

## Test
Pour tester la correction :
1. Aller sur https://latry.consulting/projet/clinical-case-analyzer/
2. Cliquer sur "Dicter"
3. Enregistrer un cas clinique
4. Arrêter et vérifier que la transcription fonctionne

## Notes
- Le modèle `gpt-4o-transcribe` nécessite obligatoirement `response_format: 'json'`
- La fonction accepte les fichiers audio en format webm (format par défaut du navigateur)
- La taille maximale est gérée côté Firebase (limites de la fonction) 