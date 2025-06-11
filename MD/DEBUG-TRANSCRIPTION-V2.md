# Debug Transcription V2

## Approche simplifiée basée sur la documentation OpenAI

### 1. Configuration Firebase Functions
```javascript
// Étapes :
1. Extraire le type MIME de l'audio base64
2. Déterminer l'extension correcte (.webm, .mp3, etc.)
3. Créer FormData avec le bon filename et contentType
4. Utiliser gpt-4o-transcribe avec response_format: 'json'
5. Si échec, fallback avec whisper-1 et fichier temporaire
```

### 2. Formats supportés par OpenAI
- `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`
- Le navigateur enregistre en `audio/webm` ou `audio/webm;codecs=opus`

### 3. Points clés de la nouvelle approche
- **Extraction correcte du MIME type** : `audioBase64.match(/^data:(.+);base64,(.+)$/)`
- **Nom de fichier avec extension** : `audio.${extension}`
- **Fallback avec fichier temporaire** : Si le buffer direct ne fonctionne pas

### 4. Pour tester
1. Vérifier les logs Firebase :
   ```bash
   firebase functions:log --project cas-clinique -n 50
   ```

2. Vérifier dans la console du navigateur :
   - Type du blob audio
   - Taille du blob
   - Début du base64

### 5. Erreurs communes et solutions
- **"Invalid file format"** : Le fichier n'est pas reconnu
  → Solution : Utiliser le fallback avec fichier temporaire
  
- **"Audio file might be corrupted"** : Le buffer est mal formé
  → Solution : Vérifier l'extraction du base64

### 6. Alternative si rien ne fonctionne
Si webm continue de poser problème, on pourrait :
1. Convertir côté client en WAV avant envoi
2. Utiliser une librairie comme RecordRTC qui permet d'autres formats
3. Essayer d'enregistrer directement en mp3/wav 