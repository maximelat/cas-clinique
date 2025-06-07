const functions = require('firebase-functions');
const axios = require('axios');

// Configuration
const OPENAI_API_KEY = functions.config().openai?.key || process.env.OPENAI_API_KEY;

// Fonction pour analyser avec o3
exports.analyzeWithO3 = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onCall(async (data, context) => {
    try {
      const { prompt } = data;
      
      if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Prompt requis');
      }

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

      const text = response.data.output_text || 
                   response.data.output?.[0]?.text || 
                   response.data.choices?.[0]?.message?.content || '';

      return { text };
    } catch (error) {
      console.error('Erreur o3:', error);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse: ' + error.message
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

      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: 'o3-2025-04-16',
          reasoning: { effort: 'high' },
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
                    data: imageBase64
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

      const text = response.data.output_text || 
                   response.data.output?.[0]?.text || '';

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
      console.error('Erreur GPT-4o-mini:', error);
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse Perplexity: ' + error.message
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