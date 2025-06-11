# Transcription Audio - Approche Simplifiée

## Nouvelle approche avec whisper-1

### Pourquoi whisper-1 ?
- **Plus robuste** avec différents formats audio
- **Pas de response_format obligatoire** contrairement à gpt-4o-transcribe
- **Meilleure gestion** des fichiers webm du navigateur

### Configuration actuelle

#### Firebase Functions (`transcribeAudio`)
```javascript
// 1. Extraction simple du base64
const base64Data = audioBase64.split(',')[1] || audioBase64;
const audioBuffer = Buffer.from(base64Data, 'base64');

// 2. FormData avec whisper-1
formData.append('file', audioBuffer, {
  filename: 'audio.webm',
  contentType: 'audio/webm'
});
formData.append('model', 'whisper-1');
formData.append('language', 'fr'); // Améliore la reconnaissance

// 3. Appel API
POST https://api.openai.com/v1/audio/transcriptions
```

#### Client (`ai-client.ts`)
- Conversion du blob audio en base64
- Envoi à Firebase Functions
- Logs détaillés pour debug

### Pour tester

1. **Console navigateur** : Vérifier
   - Type du blob: `audio/webm` ou `audio/webm;codecs=opus`
   - Taille du blob en bytes
   - Début du base64

2. **Logs Firebase** :
   ```bash
   firebase functions:log --project cas-clinique --limit 50
   ```

3. **Messages d'erreur à surveiller** :
   - "Invalid file format" → Le fichier n'est pas reconnu
   - "Audio file might be corrupted" → Problème de conversion base64

### Si ça ne fonctionne toujours pas

Options alternatives :
1. **Enregistrer en WAV** au lieu de webm (plus de compatibilité)
2. **Utiliser une librairie** comme RecordRTC qui offre plus de formats
3. **Conversion côté client** avant envoi

### Test rapide
1. Cliquer sur "Dicter"
2. Parler quelques secondes
3. Cliquer sur "Arrêter"
4. Vérifier la console pour les logs
5. Si erreur, vérifier les logs Firebase

La simplification maximale devrait résoudre la plupart des problèmes de format. 