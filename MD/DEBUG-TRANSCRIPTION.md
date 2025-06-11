# Guide de débogage - Transcription audio

## Problème : La transcription ne fonctionne plus avec gpt-4o-transcribe

### Contraintes API (Documentation officielle)

1. **Modèles disponibles** :
   - `gpt-4o-transcribe` (nouveau)
   - `gpt-4o-mini-transcribe` (nouveau)
   - `whisper-1` (stable)

2. **Format de réponse** :
   - `gpt-4o-transcribe` et `gpt-4o-mini-transcribe` : **UNIQUEMENT JSON**
   - `whisper-1` : json, text, srt, verbose_json, vtt

3. **Nouveaux paramètres** :
   - `chunking_strategy`: "auto" ou objet server_vad
   - `stream`: true/false (pas pour whisper-1)

### Solutions à tester :

#### 1. Changer temporairement de modèle

```javascript
// Dans src/services/ai-client.ts
const aiService = new AIClientService();
aiService.setTranscriptionModel('whisper-1'); // Plus stable
// ou
aiService.setTranscriptionModel('gpt-4o-mini-transcribe'); // Alternative
```

#### 2. Vérifier les logs détaillés
La console affichera maintenant :
- Taille du blob audio
- Type du blob
- Modèle utilisé
- Status de la réponse
- Données reçues

#### 3. Format audio et limitations
| Modèle | Durée max | Formats supportés |
|--------|-----------|-------------------|
| gpt-4o-transcribe | 1500s (25min) | flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm |
| whisper-1 | 25MB | Idem |

#### 4. Tester avec curl

```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@test.mp3" \
  -F model="gpt-4o-transcribe" \
  -F response_format="json" \
  -F language="fr" \
  -F temperature="0.2"
```

#### 5. Problèmes connus avec gpt-4o-transcribe
- Peut retourner des transcriptions vides
- Peut répéter le même texte
- Sensible aux métadonnées audio

## Recommandation

Si `gpt-4o-transcribe` ne fonctionne pas :
1. Essayer `gpt-4o-mini-transcribe`
2. Revenir à `whisper-1` (le plus fiable)
3. Vérifier les logs pour identifier le problème exact 