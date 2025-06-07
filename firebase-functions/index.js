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

      console.log('Appel OpenAI Vision avec o3-2025-04-16 (Responses API)...');
      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: 'o3-2025-04-16',
          reasoning: { effort: 'high' }, // High effort pour l'analyse d'images
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: prompt
                },
                {
                  type: 'input_image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                  }
                }
              ]
            }
          ],
          max_output_tokens: 5000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Même structure pour l'API Responses avec images
      let text = '';
      
      if (response.data.output && Array.isArray(response.data.output)) {
        const messageOutput = response.data.output.find(o => o.type === 'message');
        if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
          const textContent = messageOutput.content.find(c => c.type === 'output_text');
          if (textContent && textContent.text) {
            text = textContent.text;
          }
        }
      }
      
      if (!text) {
        text = response.data.output_text || '';
      }
      
      console.log('Réponse o3 Vision reçue, longueur:', text.length);
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

      // Convertir base64 en Buffer
      const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Créer FormData
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      formData.append('model', 'gpt-4o-transcribe');
      formData.append('language', 'fr');
      formData.append('prompt', 'Transcription d\'un cas clinique médical en français avec termes médicaux.');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            ...formData.getHeaders()
          }
        }
      );

      return { text: response.data.text || '' };
    } catch (error) {
      console.error('Erreur transcription:', error);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de la transcription: ' + error.message
      );
    }
  }); 