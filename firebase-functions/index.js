const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ 
  origin: [
    'https://latry.consulting',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ]
});

// Configuration
const OPENAI_API_KEY = functions.config().openai?.key || process.env.OPENAI_API_KEY;

// Fonction pour analyser avec o3
exports.analyzeWithO3 = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onCall(async (data, context) => {
    // CORS est géré automatiquement par onCall
    try {
      const { prompt } = data;
      
      if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Prompt requis');
      }

      // Vérifier la configuration de la clé API
      if (!OPENAI_API_KEY) {
        console.error('ERREUR: Clé OpenAI non configurée dans Firebase Functions');
        throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée sur le serveur. Vérifiez la configuration Firebase.');
      }

      console.log('Appel OpenAI avec o3-2025-04-16 (Responses API)...');
      console.log('Clé API présente:', !!OPENAI_API_KEY, 'Longueur:', OPENAI_API_KEY?.length);
      console.log('Longueur du prompt:', prompt.length);
      console.log('Début du prompt:', prompt.substring(0, 200) + '...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: 'o3-2025-04-16',
          reasoning: { effort: 'medium' },
          input: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_output_tokens: 25000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // L'API Responses retourne une structure différente
      let text = '';
      
      // La réponse est dans output[1].content[0].text pour l'API Responses
      if (response.data.output && Array.isArray(response.data.output)) {
        const messageOutput = response.data.output.find(o => o.type === 'message');
        if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
          const textContent = messageOutput.content.find(c => c.type === 'output_text');
          if (textContent && textContent.text) {
            text = textContent.text;
            console.log('Texte extrait de output[].content[].text:', text.length, 'caractères');
          }
        }
      }
      
      // Fallback au cas où la structure change
      if (!text) {
        text = response.data.output_text || 
               response.data.content || 
               response.data.text ||
               '';
      }
                  
      console.log('Réponse o3 reçue, longueur totale:', text.length);
      console.log('Usage:', response.data.usage);
      
      if (!text || text.length === 0) {
        console.error('ATTENTION: Réponse vide de l\'API o3');
        console.error('Structure de response.data.output:', JSON.stringify(response.data.output, null, 2).substring(0, 500));
      }
      
      return { text };
    } catch (error) {
      console.error('Erreur o3 détaillée:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Config:', { 
        hasKey: !!OPENAI_API_KEY, 
        keyLength: OPENAI_API_KEY?.length,
        model: 'o3-2025-04-16',
        endpoint: '/v1/responses'
      });
      
      // Gérer spécifiquement les erreurs de l'API Responses
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        console.error('Erreur API Responses:', apiError);
        
        if (apiError.message?.includes('max_tokens')) {
          throw new functions.https.HttpsError(
            'invalid-argument', 
            'Erreur de paramètre: utilisez max_output_tokens au lieu de max_tokens'
          );
        }
      }
      
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse o3: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  });

// Fonction pour analyser une image avec o3
exports.analyzeImageWithO3 = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onCall(async (data, context) => {
    try {
      const { prompt, imageBase64 } = data;
      
      if (!prompt || !imageBase64) {
        throw new functions.https.HttpsError('invalid-argument', 'Prompt et image requis');
      }

      // Fallback sur GPT-4o pour l'analyse d'images car o3 Responses API ne supporte pas encore les images
      console.log('Utilisation de GPT-4o pour l\'analyse d\'image (o3 ne supporte pas encore les images)...');
      
      const cleanImageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${cleanImageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 5000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // GPT-4o utilise une structure différente
      const text = response.data.choices?.[0]?.message?.content || '';
      
      console.log('Réponse GPT-4o Vision reçue, longueur:', text.length);
      console.log('Usage Vision:', response.data.usage);
      
      return { text };
    } catch (error) {
      console.error('Erreur analyse image o3:', error);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse d\'image: ' + error.message
      );
    }
  });

// Fonction pour analyser les données Perplexity avec GPT-4o-mini
exports.analyzePerplexityWithGPT4Mini = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    try {
      const { perplexityData } = data;
      
      if (!perplexityData) {
        throw new functions.https.HttpsError('invalid-argument', 'Données Perplexity requises');
      }

      if (!OPENAI_API_KEY) {
        console.error('Clé OpenAI non configurée');
        throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée sur le serveur');
      }

      const prompt = `Analyse ces données de recherche académique et extrais les points clés, les références importantes et les conclusions principales. Sois concis mais exhaustif.

DONNÉES DE RECHERCHE:
${perplexityData}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.choices?.[0]?.message?.content || '';
      return { text };
    } catch (error) {
      console.error('Erreur GPT-4o-mini détaillée:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse Perplexity: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  });

// Fonction pour analyser les références avec GPT-4o
exports.analyzeReferencesWithGPT4 = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    try {
      const { prompt } = data;
      
      if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Prompt requis');
      }

      if (!OPENAI_API_KEY) {
        console.error('Clé OpenAI non configurée');
        throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée sur le serveur');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.choices?.[0]?.message?.content || '';
      return { text };
    } catch (error) {
      console.error('Erreur GPT-4o détaillée:', error.response?.data || error.message);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse GPT-4o: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  });

// Fonction pour transcrire l'audio
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

      console.log('Transcription audio...');

      // Convertir base64 en Buffer
      const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      console.log('Taille du buffer audio:', audioBuffer.length, 'bytes');

      // Vérifier que le buffer n'est pas vide
      if (audioBuffer.length < 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Fichier audio trop court ou vide');
      }

      // Créer FormData
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Selon la doc OpenAI, on doit envoyer le fichier avec un nom approprié
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      
      // Essayer d'abord avec gpt-4o-transcribe (meilleure qualité)
      let model = 'gpt-4o-transcribe';
      let response_format = 'json'; // Obligatoire pour gpt-4o-transcribe
      
      formData.append('model', model);
      formData.append('language', 'fr');
      formData.append('response_format', response_format);

      console.log('Envoi à l\'API OpenAI avec', model);

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              ...formData.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 120000 // 2 minutes timeout
          }
        );

        console.log('Réponse reçue, status:', response.status);
        const text = response.data.text || '';
        console.log('Transcription terminée, longueur:', text.length);

        return { text };
        
      } catch (error) {
        // Si gpt-4o-transcribe échoue, essayer avec whisper-1
        console.error('Erreur avec gpt-4o-transcribe, essai avec whisper-1:', error.response?.data || error.message);
        
        // Recréer le formData pour whisper-1
        const formData2 = new FormData();
        formData2.append('file', audioBuffer, {
          filename: 'audio.webm',
          contentType: 'audio/webm'
        });
        formData2.append('model', 'whisper-1');
        formData2.append('language', 'fr');
        // whisper-1 n'a pas besoin de response_format obligatoire

        const response2 = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData2,
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              ...formData2.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 120000
          }
        );

        console.log('Réponse whisper-1 reçue, status:', response2.status);
        const text = response2.data.text || '';
        console.log('Transcription whisper-1 terminée, longueur:', text.length);

        return { text };
      }
      
    } catch (error) {
      console.error('Erreur transcription détaillée:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Headers de la réponse:', error.response?.headers);
      
      // Si l'erreur indique un problème de format, donner plus de détails
      if (error.response?.data?.error?.message?.includes('Invalid file format')) {
        console.error('Problème de format de fichier détecté');
        console.error('Taille du buffer:', data.audioBase64?.length);
        console.error('Début du base64:', data.audioBase64?.substring(0, 100));
      }
      
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de la transcription: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  }); 