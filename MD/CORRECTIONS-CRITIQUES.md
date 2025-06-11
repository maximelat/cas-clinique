# Corrections Critiques - 4 Points

## 1. ✅ Suppression des balises <think> dans searchRareDiseases
- **Problème** : Les réponses de Perplexity contiennent parfois des balises `<think>...</think>`
- **Solution** : Ajout du nettoyage dans `searchRareDiseases()` comme dans `searchWithPerplexity()`
- **Fichier** : `src/services/ai-client.ts` ligne 821

## 2. ✅ Ajout titre et ID à l'analyse complète
- **Problème** : Pas d'identifiant unique pour retrouver l'analyse plus tard
- **Solution** : 
  - ID unique : `cas-${timestamp}-${random}`
  - Titre : 100 premiers caractères du cas clinique
  - Date : Horodatage ISO
- **Fichier** : `src/app/demo/page.tsx` lignes 343-352
- **Affichage** : Ajouté dans l'interface lignes 1056-1068

## 3. 🔄 Transcription audio - Format webm non supporté
- **Problème** : "Audio file might be corrupted or unsupported"
- **Cause** : L'API OpenAI a des problèmes avec le format webm
- **Solution proposée** : Utiliser whisper-1 au lieu de gpt-4o-transcribe

### Correction dans Firebase Functions :

```javascript
// firebase-functions/index.js
exports.transcribeAudio = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(async (data, context) => {
    try {
      const { audioBase64 } = data;
      
      if (!audioBase64) {
        throw new functions.https.HttpsError('invalid-argument', 'Audio requis');
      }

      if (!OPENAI_API_KEY) {
        console.error('Clé OpenAI non configurée');
        throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée sur le serveur');
      }

      console.log('Transcription audio avec whisper-1...');

      // Convertir base64 en Buffer
      const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      console.log('Taille du buffer audio:', audioBuffer.length, 'bytes');

      // Créer FormData pour whisper-1 (plus robuste)
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      formData.append('model', 'whisper-1'); // Changer pour whisper-1
      formData.append('language', 'fr');

      console.log('Envoi à l\'API OpenAI (whisper-1)...');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            ...formData.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log('Réponse reçue, status:', response.status);
      const text = response.data.text || '';
      console.log('Transcription terminée, longueur:', text.length);

      return { text };
    } catch (error) {
      console.error('Erreur transcription détaillée:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de la transcription: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  });
```

## 4. ✅ Amélioration des titres de sources
- **Problème** : Les sources affichent parfois "Source 1", "Source 2" au lieu des vrais titres
- **Solution** : Méthode `extractReferences()` améliorée avec extraction en 3 étapes :
  1. Extraction depuis la section Sources formatée
  2. Extraction depuis les citations inline
  3. Enrichissement via GPT-4o
- **Fichier** : `src/services/ai-client.ts` lignes 554-614

## Déploiement

1. Pour la transcription :
```bash
cd firebase-functions
npm run deploy
```

2. Pour le reste :
```bash
git add -A
git commit -m "fix: corrections critiques - think tags, ID analyse, transcription whisper-1"
git push
```

## Vérification
- ✅ Les balises `<think>` sont supprimées dans toutes les réponses
- ✅ Chaque analyse a un ID unique et un titre
- 🔄 La transcription utilise whisper-1 (plus robuste que gpt-4o-transcribe)
- ✅ Les titres des sources sont correctement extraits et enrichis 