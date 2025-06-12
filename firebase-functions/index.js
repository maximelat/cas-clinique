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
const MEDGEMMA_API_KEY = functions.config().medgemma?.key || process.env.MEDGEMMA_API_KEY;

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

// Fonction pour analyser une image avec MedGemma
exports.analyzeImageWithO3 = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onCall(async (data, context) => {
    try {
      const { prompt, imageBase64, imageType = 'medical' } = data;
      
      if (!imageBase64) {
        throw new functions.https.HttpsError('invalid-argument', 'Image requise');
      }

      // Utiliser MedGemma si disponible
      if (MEDGEMMA_API_KEY) {
        console.log('Utilisation de MedGemma pour l\'analyse d\'image médicale...');
        
        const cleanImageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        
        // Prompts spécialisés selon le type d'image
        const imageTypePrompts = {
          medical: `En tant qu'expert en imagerie médicale, analyse cette image médicale (radiographie, IRM, scanner, échographie, etc.) avec une approche méthodique et détaillée.

Instructions spécifiques:
1. Identifie le type d'examen et la région anatomique
2. Décris la qualité technique de l'image
3. Analyse systématiquement toutes les structures visibles
4. Identifie et décris précisément toutes les anomalies
5. Compare avec l'aspect normal attendu
6. Propose des diagnostics différentiels
7. Suggère des examens complémentaires si nécessaire

Sois exhaustif et utilise la terminologie médicale appropriée.`,
          
          biology: `En tant qu'expert en biologie médicale, analyse ces résultats biologiques de manière complète.

Instructions spécifiques:
1. Identifie tous les paramètres présents
2. Compare chaque valeur aux normes de référence
3. Signale toutes les valeurs anormales (hautes ou basses)
4. Analyse les patterns et associations entre paramètres
5. Propose une interprétation clinique
6. Suggère des examens complémentaires si pertinent

Utilise les unités appropriées et sois précis dans tes observations.`,
          
          ecg: `En tant qu'expert en cardiologie, analyse cet ECG de manière systématique et complète.

Instructions spécifiques:
1. Évalue la qualité technique du tracé
2. Mesure et analyse:
   - Rythme (sinusal, arythmie, etc.)
   - Fréquence cardiaque
   - Axe électrique
   - Intervalles PR, QRS, QT/QTc
   - Morphologie des ondes P, QRS, T
3. Recherche systématiquement:
   - Troubles de conduction
   - Signes d'ischémie ou de nécrose
   - Hypertrophies
   - Troubles de repolarisation
   - Arythmies
4. Conclusion avec diagnostic ECG

Sois précis dans tes mesures et utilise la terminologie cardiologique standard.`,
          
          other: `Analyse cette image clinique en détail et décris tout ce qui est médicalement pertinent.

Instructions:
1. Identifie le type d'image et le contexte clinique
2. Décris méthodiquement ce que tu observes
3. Note toutes les anomalies ou particularités
4. Propose une interprétation clinique
5. Suggère la conduite à tenir si approprié`
        };

        const medGemmaPrompt = imageTypePrompts[imageType] || imageTypePrompts.other;
        
        const response = await axios.post(
          'https://khynx9ujxzvwk5rb.us-east4.gcp.endpoints.huggingface.cloud/v1/chat/completions',
          {
            model: 'tgi',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${cleanImageBase64}`
                    }
                  },
                  {
                    type: 'text',
                    text: medGemmaPrompt
                  }
                ]
              }
            ],
            max_tokens: 2000,
            temperature: 0.3,
            stream: false
          },
          {
            headers: {
              'Authorization': `Bearer ${MEDGEMMA_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        const text = response.data.choices?.[0]?.message?.content || '';
        
        console.log('Réponse MedGemma reçue, longueur:', text.length);
        
        return { text };
      } else {
        // Fallback sur GPT-4o si MedGemma n'est pas configuré
        console.log('MedGemma non configuré, utilisation de GPT-4o pour l\'analyse d\'image...');
        
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
                    text: prompt || 'Analyse cette image médicale en détail.'
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

        const text = response.data.choices?.[0]?.message?.content || '';
        
        console.log('Réponse GPT-4o Vision reçue, longueur:', text.length);
        console.log('Usage Vision:', response.data.usage);
        
        return { text };
      }
    } catch (error) {
      console.error('Erreur analyse image:', error.response?.data || error.message);
      
      // Si erreur avec MedGemma, essayer le fallback
      if (MEDGEMMA_API_KEY && error.response?.status !== 401) {
        console.log('Erreur MedGemma, tentative avec GPT-4o...');
        try {
          const cleanImageBase64 = data.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          
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
                      text: data.prompt || 'Analyse cette image médicale en détail.'
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

          const text = response.data.choices?.[0]?.message?.content || '';
          return { text };
        } catch (fallbackError) {
          console.error('Erreur fallback GPT-4o:', fallbackError);
        }
      }
      
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

      console.log('Début transcription audio avec whisper-1...');

      // Utiliser directement whisper-1 qui est plus robuste
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Extraire juste les données base64
      const base64Data = audioBase64.split(',')[1] || audioBase64;
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      console.log('Taille du buffer:', audioBuffer.length, 'bytes');
      
      // Ajouter le fichier - whisper-1 est moins strict sur le format
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      
      // Paramètres simples pour whisper-1
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr'); // Pour améliorer la reconnaissance en français
      
      console.log('Appel API OpenAI avec whisper-1...');
      
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
          timeout: 120000 // 2 minutes
        }
      );

      console.log('Réponse reçue:', response.status);
      
      // Whisper retourne directement le texte dans response.data.text
      const transcription = response.data.text || '';
      console.log('Transcription réussie, longueur:', transcription.length);
      console.log('Début du texte:', transcription.substring(0, 100));

      return { text: transcription };
      
    } catch (error) {
      console.error('=== ERREUR TRANSCRIPTION ===');
      console.error('Message:', error.message);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Informations de debug supplémentaires
      if (error.response?.data?.error) {
        console.error('Erreur OpenAI:', error.response.data.error);
      }
      
      // Si c'est une erreur de format, donner plus d'infos
      if (error.response?.status === 400) {
        console.error('Erreur 400 - Probablement un problème de format audio');
        console.error('Taille base64 reçue:', data.audioBase64?.length);
      }
      
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de la transcription: ' + (error.response?.data?.error?.message || error.message)
      );
    }
  }); 