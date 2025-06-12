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

// Configuration Functions v1 - comme avant
const OPENAI_API_KEY = functions.config().openai?.key;
const MEDGEMMA_API_KEY = functions.config().medgemma?.key;

// Fonction pour analyser avec o3
exports.analyzeWithO3 = functions.https.onCall(async (data, context) => {
  try {
    const { prompt } = data;
    
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt requis');
    }

    if (!OPENAI_API_KEY) {
      console.error('ERREUR: Clé OpenAI non configurée dans Firebase Functions');
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée sur le serveur');
    }

    console.log('Appel OpenAI avec o3-2025-04-16...');
    
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
      text = response.data.output_text || response.data.content || response.data.text || '';
    }
              
    console.log('Réponse o3 reçue, longueur:', text.length);
    
    return { text };
  } catch (error) {
    console.error('Erreur o3:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse o3: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Fonction pour analyser une image avec MedGemma
exports.analyzeImageWithMedGemma = functions.https.onCall(async (data, context) => {
  try {
    const { imageBase64, imageType = 'medical' } = data;
    
    if (!imageBase64) {
      throw new functions.https.HttpsError('invalid-argument', 'Image requise');
    }

    if (!MEDGEMMA_API_KEY) {
      console.error('ERREUR: Clé MedGemma non configurée');
      throw new functions.https.HttpsError('failed-precondition', 'Clé API MedGemma non configurée');
    }

    const timestamp = new Date().toISOString();
    const startTime = Date.now();
    
    console.log('=== ANALYSE IMAGE MEDGEMMA ===');
    console.log('Timestamp:', timestamp);
    console.log('Clé MedGemma configurée:', !!MEDGEMMA_API_KEY);
    console.log('Longueur clé MedGemma:', MEDGEMMA_API_KEY?.length);

    const medgemmaPrompt = imageType === 'dermatology' 
      ? "Analysez cette image dermatologique en détail. Décrivez les lésions observées, les caractéristiques cliniques importantes, et proposez un diagnostic différentiel avec justification."
      : "Analysez cette image médicale en détail. Décrivez les éléments pathologiques visibles, les structures anatomiques concernées, et proposez une interprétation clinique.";

    // Utiliser l'endpoint HuggingFace spécifique pour MedGemma
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
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: medgemmaPrompt
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${MEDGEMMA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('=== RÉPONSE MEDGEMMA REÇUE ===');
    console.log('Temps de réponse:', responseTime, 'ms');
    console.log('Status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    
    const text = response.data.choices?.[0]?.message?.content || '';
    console.log('Longueur texte analysé:', text.length, 'caractères');
    console.log('Début de la réponse:', text.substring(0, 200), '...');
    console.log('Usage tokens:', response.data.usage);
    console.log('=== FIN ANALYSE MEDGEMMA ===');

    if (!text) {
      console.error('ERREUR: Réponse vide de MedGemma');
      console.error('Structure complète:', JSON.stringify(response.data, null, 2));
      throw new functions.https.HttpsError('internal', 'Réponse vide de MedGemma');
    }

    return { text };
  } catch (error) {
    console.error('=== ERREUR MEDGEMMA ===');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Config utilisée:', {
      hasKey: !!MEDGEMMA_API_KEY,
      keyLength: MEDGEMMA_API_KEY?.length,
      endpoint: 'https://khynx9ujxzvwk5rb.us-east4.gcp.endpoints.huggingface.cloud/v1/chat/completions'
    });
    
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse d\'image MedGemma: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Compatibilité - redirection vers MedGemma
exports.analyzeImageWithO3 = functions.https.onCall(async (data, context) => {
  console.log('ATTENTION: analyzeImageWithO3 redirige vers MedGemma');
  return exports.analyzeImageWithMedGemma.handler(data, context);
});

// Fonction pour analyser avec GPT-4o-mini
exports.analyzePerplexityWithGPT4Mini = functions.https.onCall(async (data, context) => {
  try {
    const { perplexityData } = data;
    
    if (!perplexityData) {
      throw new functions.https.HttpsError('invalid-argument', 'Données Perplexity requises');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    const prompt = `Analysez ces données provenant de Perplexity et fournissez un résumé structuré:\n\n${perplexityData}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    return { text };
  } catch (error) {
    console.error('Erreur Perplexity:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse Perplexity: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Fonction pour analyser les références avec GPT-4o
exports.analyzeReferencesWithGPT4 = functions.https.onCall(async (data, context) => {
  try {
    const { prompt } = data;
    
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt requis');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
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
    console.error('Erreur GPT-4o:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse GPT-4o: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Fonction pour transcrire l'audio
exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  try {
    const { audioBase64 } = data;
    
    if (!audioBase64) {
      throw new functions.https.HttpsError('invalid-argument', 'Audio requis');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    const FormData = require('form-data');
    const formData = new FormData();
    
    const base64Data = audioBase64.split(',')[1] || audioBase64;
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 120000
      }
    );

    const transcription = response.data.text || '';
    return { text: transcription };
      
  } catch (error) {
    console.error('Erreur transcription:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de la transcription: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Fonction pour extraire les données structurées
exports.extractStructuredData = functions.https.onCall(async (data, context) => {
  try {
    const { caseText } = data;
    
    if (!caseText) {
      throw new functions.https.HttpsError('invalid-argument', 'Texte du cas clinique requis');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    const prompt = `Analyse ce cas clinique et extrais les informations structurées suivantes:

CAS CLINIQUE:
${caseText}

Format de réponse OBLIGATOIRE:
CONTEXTE_PATIENT: [contenu]
ANAMNESE: [contenu]
ANTECEDENTS: [contenu]
EXAMEN_CLINIQUE: [contenu]
EXAMENS_COMPLEMENTAIRES: [contenu]`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
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
    
    const extractValue = (key) => {
      const regex = new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
      const match = text.match(regex);
      return match ? match[1].trim() : 'Non précisé';
    };

    return {
      contextePatient: extractValue('CONTEXTE_PATIENT'),
      anamnese: extractValue('ANAMNESE'),
      antecedents: extractValue('ANTECEDENTS'),
      examenClinique: extractValue('EXAMEN_CLINIQUE'),
      examensComplementaires: extractValue('EXAMENS_COMPLEMENTAIRES')
    };
  } catch (error) {
    console.error('Erreur extraction:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'extraction des données: ' + (error.response?.data?.error?.message || error.message)
    );
  }
});

// Fonction pour enrichir les références
exports.enrichReferences = functions.https.onCall(async (data, context) => {
  try {
    const { references } = data;
    
    if (!references || !Array.isArray(references)) {
      throw new functions.https.HttpsError('invalid-argument', 'Références requises');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    const prompt = `Enrichis ces références avec les métadonnées manquantes. Retourne UNIQUEMENT du JSON valide:

${JSON.stringify(references, null, 2)}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu retournes UNIQUEMENT du JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = response.data.choices?.[0]?.message?.content || '[]';
    
    let enrichedRefs;
    try {
      const parsed = JSON.parse(responseText);
      enrichedRefs = Array.isArray(parsed) ? parsed : (parsed.references || references);
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      enrichedRefs = references;
    }
    
    return { references: enrichedRefs };
    
  } catch (error) {
    console.error('Erreur enrichissement références:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'enrichissement des références: ' + error.message
    );
  }
});

// Fonction pour analyser et améliorer les résultats Perplexity
exports.analyzePerplexityResults = functions.https.onCall(async (data, context) => {
  try {
    const { perplexityResponse } = data;
    
    if (!perplexityResponse) {
      throw new functions.https.HttpsError('invalid-argument', 'Réponse Perplexity requise');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    console.log('Analyse des résultats Perplexity...');
    
    // Extraire les search_results avec les dates
    const searchResults = JSON.parse(perplexityResponse).search_results || [];
    console.log('Search results trouvés:', searchResults.length);
    
    // Analyser le contenu avec GPT-4o pour améliorer l'extraction des références
    const prompt = `Analyse cette réponse Perplexity et améliore l'extraction des références en utilisant les dates disponibles:

RÉPONSE PERPLEXITY:
${typeof perplexityResponse === 'string' ? perplexityResponse : JSON.stringify(perplexityResponse, null, 2)}

SEARCH RESULTS AVEC DATES:
${JSON.stringify(searchResults, null, 2)}

INSTRUCTIONS:
1. Identifie toutes les références utilisées dans le texte (format [1], [2], etc.)
2. Pour chaque référence, associe-la au search_result correspondant
3. Extrait les informations suivantes pour chaque référence:
   - title: Titre exact de l'article
   - url: URL de la source
   - date: Date de publication si disponible dans search_results
   - authors: Auteurs si déductibles de l'URL ou du titre
   - journal: Journal ou source si déductible
   - keyPoints: Points clés en rapport avec le cas clinique analysé

4. Retourne un JSON avec les sections suivantes:
   - analysisText: Le texte de l'analyse avec les références correctement placées
   - references: Array des références enrichies avec toutes les métadonnées

IMPORTANT: 
- Utilise les dates exactes des search_results quand disponibles
- Ne place les références que là où elles sont pertinentes
- Si une référence [X] est mentionnée, elle doit correspondre à un search_result
- Retourne UNIQUEMENT du JSON valide

Format de sortie:
{
  "analysisText": "Texte analysé avec références [1], [2], etc.",
  "references": [
    {
      "label": "1",
      "title": "Titre exact",
      "url": "URL exacte",
      "date": "2024-01-01",
      "authors": "Auteurs si disponibles",
      "journal": "Journal ou source",
      "keyPoints": "Points clés pertinents"
    }
  ]
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en analyse de littérature médicale. Tu retournes UNIQUEMENT du JSON valide, bien formaté.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseText = response.data.choices?.[0]?.message?.content || '{}';
    console.log('Réponse GPT-4o brute:', responseText);
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      console.error('Réponse brute:', responseText);
      
      // Fallback: retourner la structure de base
      analysisResult = {
        analysisText: typeof perplexityResponse === 'string' ? perplexityResponse : JSON.stringify(perplexityResponse),
        references: searchResults.map((result, index) => ({
          label: String(index + 1),
          title: result.title || `Source ${index + 1}`,
          url: result.url || '#',
          date: result.date || null,
          authors: '',
          journal: '',
          keyPoints: ''
        }))
      };
    }
    
    console.log('Analyse terminée:', JSON.stringify(analysisResult, null, 2));
    return analysisResult;
    
  } catch (error) {
    console.error('Erreur analyse Perplexity:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse Perplexity: ' + error.message
    );
  }
}); 