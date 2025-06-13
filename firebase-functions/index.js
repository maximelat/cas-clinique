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
    const { imageBase64, imageType = 'general', promptType = 'general' } = data;
    
    if (!imageBase64) {
      throw new functions.https.HttpsError('invalid-argument', 'Image requise');
    }

    if (!MEDGEMMA_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API MedGemma non configurée');
    }

    const timestamp = new Date().toISOString();
    const startTime = Date.now();
    
    console.log('=== ANALYSE IMAGE MEDGEMMA ===');
    console.log('Timestamp:', timestamp);
    console.log('Type d\'image:', imageType);
    console.log('Type de prompt:', promptType);
    console.log('Clé MedGemma configurée:', !!MEDGEMMA_API_KEY);

    // Sélection du prompt selon le type choisi par l'utilisateur
    const prompts = {
      general: "Analysez cette image médicale. Décrivez brièvement les éléments pathologiques visibles et donnez vos conclusions principales pour l'analyse clinique. Soyez concis et orienté diagnostic.",
      dermatology: "Analysez cette lésion dermatologique. Décrivez les caractéristiques cliniques importantes et proposez un diagnostic différentiel avec justification courte.",
      radiology: "Analysez cette imagerie médicale. Identifiez les anomalies visibles, les structures anatomiques concernées et vos conclusions radiologiques principales.",
      pathology: "Analysez cette lame histologique/cytologique. Décrivez les éléments morphologiques significatifs et vos conclusions anatomopathologiques.",
      cardiology: "Analysez cette imagerie cardiaque (ECG/Echo/Angio). Identifiez les anomalies et donnez vos conclusions cardiologiques principales.",
      ophthalmology: "Analysez cette imagerie ophtalmologique. Décrivez les anomalies du fond d'œil/segment antérieur et vos conclusions diagnostiques.",
      emergency: "Analyse rapide d'urgence. Identifiez immédiatement les signes critiques et donnez vos conclusions prioritaires pour la prise en charge."
    };

    const medgemmaPrompt = prompts[promptType] || prompts.general;
    console.log('Prompt utilisé:', promptType);

    // Détecter le format de l'image depuis les premiers bytes en base64
    let imageFormat = 'jpeg'; // par défaut
    try {
      const buffer = Buffer.from(imageBase64.substring(0, 8), 'base64');
      const header = buffer.toString('hex');
      
      if (header.startsWith('89504e47')) {
        imageFormat = 'png';
        console.log('Format détecté: PNG');
      } else if (header.startsWith('ffd8ff')) {
        imageFormat = 'jpeg';
        console.log('Format détecté: JPEG');
      } else if (header.startsWith('47494638')) {
        imageFormat = 'gif';
        console.log('Format détecté: GIF');
      } else if (header.startsWith('424d')) {
        imageFormat = 'bmp';
        console.log('Format détecté: BMP');
      } else {
        console.log('Format non reconnu, utilisation de JPEG par défaut. Header:', header);
      }
    } catch (e) {
      console.log('Erreur détection format, utilisation de JPEG par défaut:', e.message);
    }

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
                  url: `data:image/${imageFormat};base64,${imageBase64}`
                  }
              },
              {
                type: 'text',
                text: medgemmaPrompt
                }
              ]
            }
          ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.1,
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

    console.log('Analyse des résultats Perplexity (version simplifiée)...');
    
    // Parser la réponse Perplexity
    let parsedResponse;
    try {
      parsedResponse = typeof perplexityResponse === 'string' ? JSON.parse(perplexityResponse) : perplexityResponse;
    } catch (e) {
      console.error('Erreur parsing Perplexity response:', e);
      throw new functions.https.HttpsError('invalid-argument', 'Format de réponse Perplexity invalide');
    }
    
    // Extraire les search_results avec les dates
    const searchResults = parsedResponse.search_results || [];
    console.log('Search results trouvés:', searchResults.length);
    
    // Créer directement les références depuis search_results
    const references = searchResults.map((result, index) => {
      const ref = {
        label: String(index + 1),
        title: result.title || `Source ${index + 1}`,
        url: result.url || '#',
        date: result.date || null,
        authors: 'À enrichir',
        journal: 'À déterminer',
        keyPoints: '',
        year: null
      };
      
      // Extraire l'année si date disponible
      if (result.date) {
        const yearMatch = result.date.match(/\b(19|20)\d{2}\b/);
        ref.year = yearMatch ? parseInt(yearMatch[0]) : null;
      }
      
      return ref;
    });
    
    console.log(`${references.length} références créées depuis search_results`);
    
    // Retourner le résultat simplifié
    return {
      analysisText: parsedResponse.choices?.[0]?.message?.content || parsedResponse.answer || '',
      references: references
    };
    
  } catch (error) {
    console.error('Erreur analyse Perplexity:', error.message);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'analyse Perplexity: ' + error.message
    );
  }
});

// Fonction pour enrichir les références avec Web Search
exports.enrichReferencesWithWebSearch = functions.https.onCall(async (data, context) => {
  try {
    const { references, perplexityContent } = data;
    
    if (!references || !Array.isArray(references)) {
      throw new functions.https.HttpsError('invalid-argument', 'Références requises');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    console.log(`=== ENRICHISSEMENT WEB SEARCH (AUTEURS & JOURNAL) ===`);
    console.log(`Nombre de références à enrichir: ${references.length}`);
    
    // Traiter par batches de 3 pour éviter les timeouts
    const batchSize = 3;
    const enrichedRefs = [...references];
    const webSearchLogs = [];
    
    for (let i = 0; i < references.length; i += batchSize) {
      const batch = references.slice(i, i + batchSize);
      console.log(`Traitement batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(references.length/batchSize)}`);
      
      for (const ref of batch) {
        try {
          const startTime = Date.now();
          console.log(`\n--- Enrichissement référence ${ref.label}: ${ref.title?.substring(0, 50)}...`);
          
          const prompt = `Visite cette URL académique et extrais UNIQUEMENT les auteurs et le journal :

URL: ${ref.url}
Titre de l'article: ${ref.title}

INSTRUCTIONS:
1. Utilise l'outil web_search pour visiter l'URL
2. Extrais UNIQUEMENT :
   - Les noms des auteurs (liste complète)
   - Le nom du journal/revue de publication
3. Si une information n'est pas trouvée, indique "Non disponible"
4. Sois TRÈS CONCIS dans ta réponse

Format de réponse souhaité:
Auteurs: [Liste des auteurs]
Journal: [Nom du journal]`;

          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini-search-preview-2025-03-11',
              messages: [
                {
                  role: 'system',
                  content: 'Tu es un assistant qui extrait les métadonnées d\'articles académiques. Utilise web_search pour visiter l\'URL et extraire UNIQUEMENT les auteurs et le journal. Sois très concis.'
                },
                { 
                  role: 'user', 
                  content: prompt 
                }
              ],
              tools: [{ 
                type: 'web_search',
                web_search: {
                  enable_retrieval: true
                }
              }],
              tool_choice: 'required',
              max_tokens: 500, // Réduit car on veut juste auteurs et journal
              temperature: 0.1
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 20000 // 20 secondes
            }
          );

          const responseTime = Date.now() - startTime;
          console.log(`Temps de réponse: ${responseTime}ms`);
          
          // Extraire les données de la réponse
          const message = response.data.choices?.[0]?.message;
          let authors = ref.authors || 'Non disponible';
          let journal = ref.journal || 'Non disponible';
          
          if (message?.content) {
            const content = message.content;
            
            // Extraire les auteurs
            const authorsMatch = content.match(/[Aa]uteur[s]?\s*:\s*([^\n]+)/);
            if (authorsMatch && authorsMatch[1] && authorsMatch[1] !== 'Non disponible') {
              authors = authorsMatch[1].trim();
            }
            
            // Extraire le journal
            const journalMatch = content.match(/[Jj]ournal\s*:\s*([^\n]+)/);
            if (journalMatch && journalMatch[1] && journalMatch[1] !== 'Non disponible') {
              journal = journalMatch[1].trim();
            }
            
            console.log(`✅ Métadonnées extraites:`);
            console.log(`   - Auteurs: ${authors}`);
            console.log(`   - Journal: ${journal}`);
          }
          
          // Mettre à jour la référence
          const refIndex = enrichedRefs.findIndex(r => r.url === ref.url);
          if (refIndex !== -1) {
            enrichedRefs[refIndex] = {
              ...enrichedRefs[refIndex],
              authors: authors,
              journal: journal,
              webSearchEnriched: true
            };
          }
          
          webSearchLogs.push({
            referenceLabel: ref.label,
            url: ref.url,
            authors: authors,
            journal: journal,
            enrichmentSuccess: true,
            responseTime: responseTime
          });
          
        } catch (refError) {
          console.error(`❌ Erreur enrichissement ref ${ref.url}:`, refError.message);
          webSearchLogs.push({
            referenceLabel: ref.label,
            url: ref.url,
            error: refError.message,
            enrichmentSuccess: false
          });
        }
        
        // Délai entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n=== RÉSUMÉ ENRICHISSEMENT ===`);
    console.log(`Total références: ${enrichedRefs.length}`);
    console.log(`Enrichies avec succès: ${webSearchLogs.filter(l => l.enrichmentSuccess).length}`);
    console.log(`Échecs: ${webSearchLogs.filter(l => !l.enrichmentSuccess).length}`);
    
    return { 
      references: enrichedRefs,
      webSearchLogs: webSearchLogs
    };
    
  } catch (error) {
    console.error('Erreur enrichissement Web Search:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'enrichissement avec Web Search: ' + error.message
    );
  }
});

// Fonction pour l'analyse vocale longue avec Google Gemini
exports.analyzeLongAudioWithGemini = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB'
  })
  .https.onCall(async (data, context) => {
    try {
      const { audioBase64, audioType = 'audio/webm', analysisType = 'transcription' } = data;

      // ➜ Conserve le codec éventuel après le « ; »
      const audioParts = (audioType || 'audio/webm').split(';');
      const mimeType   = audioParts.length >= 2
        ? `${audioParts[0]};${audioParts[1]}`
        : audioParts[0];
      
      if (!audioBase64) {
        throw new functions.https.HttpsError('invalid-argument', 'Audio base64 requis');
      }

      // Clé API Google (à stocker dans les variables d'environnement)
      const GOOGLE_API_KEY = functions.config().google?.api_key || 'AIzaSyAtV6E_LrLrZln2BfcR8ngomMzhywDvSf_Y';
      
      if (!GOOGLE_API_KEY) {
        throw new functions.https.HttpsError('failed-precondition', 'Clé API Google non configurée');
      }

      console.log('=== ANALYSE AUDIO LONGUE AVEC GEMINI ===');
      console.log(`Type audio: ${mimeType}`);
      console.log(`Type d'analyse: ${analysisType}`);
      
      // Extraire les données base64 (enlever le préfixe data:audio/...;base64,)
      const base64Data = audioBase64.includes(',') 
        ? audioBase64.split(',')[1] 
        : audioBase64;
      
      // Calculer la taille approximative
      const audioSizeBytes = Buffer.from(base64Data, 'base64').length;
      const audioSizeMB = (audioSizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`Taille audio: ${audioSizeMB} MB`);
      
      // Vérifier la taille (max 20MB pour inline)
      if (audioSizeBytes > 20 * 1024 * 1024) {
        console.log('Audio trop volumineux, utilisation de l\'API Files');
        
        // TODO: Implémenter l'upload via Files API si nécessaire
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Audio trop volumineux (>20MB). Veuillez utiliser un enregistrement plus court.'
        );
      }
      
      // Préparer le prompt selon le type d'analyse
      let prompt = '';
      switch (analysisType) {
        case 'transcription':
          // Après consultation - transcription structurée du cas clinique
          prompt = `Écoute cette consultation médicale et transcris le cas clinique de façon structurée.

INSTRUCTIONS:
1. Transcris d'abord l'INTÉGRALITÉ de l'enregistrement
2. Puis structure les informations en sections médicales claires :
   - Contexte patient (âge, sexe, profession)
   - Motif de consultation principal
   - Anamnèse détaillée
   - Antécédents médicaux et chirurgicaux
   - Traitements en cours
   - Examen clinique
   - Examens complémentaires
   - Hypothèses diagnostiques
   - Conduite à tenir

Format de sortie : d'abord la transcription complète, puis les sections structurées.`;
          break;
        case 'medical_consultation':
          // Pendant consultation - séparer patient/médecin
          prompt = `Écoute cette consultation médicale et sépare clairement les éléments décrits par le patient de ceux du médecin.

INSTRUCTIONS:
1. Transcris l'INTÉGRALITÉ du dialogue
2. Identifie et sépare :
   
   PAROLES DU PATIENT :
   - Symptômes décrits avec leurs propres mots
   - Chronologie des troubles
   - Impact sur la vie quotidienne
   - Questions et inquiétudes
   
   PAROLES DU MÉDECIN :
   - Questions posées
   - Explications données
   - Examen clinique décrit
   - Diagnostic évoqué
   - Plan de traitement proposé
   
3. Mets en évidence les éléments cliniques importants

Format : Transcription complète avec [PATIENT] et [MÉDECIN] pour identifier qui parle, puis résumé structuré.`;
          break;
        case 'patient_dictation':
          // Avant consultation - préparer la consultation
          prompt = `Écoute cet enregistrement du patient et transcris-le pour préparer la consultation d'un point de vue médical.

INSTRUCTIONS:
1. Transcris l'INTÉGRALITÉ de ce que dit le patient
2. Extrais et organise les informations médicales pertinentes :
   
   MOTIF DE CONSULTATION :
   - Symptôme principal
   - Durée d'évolution
   
   ANAMNÈSE :
   - Description détaillée des symptômes
   - Facteurs déclenchants/aggravants/soulageants
   - Horaire et fréquence
   - Symptômes associés
   
   CONTEXTE :
   - Antécédents similaires
   - Traitements essayés
   - Impact fonctionnel
   
   POINTS D'ATTENTION pour la consultation :
   - Questions à approfondir
   - Examens à envisager
   - Diagnostics différentiels possibles

Format : Transcription complète suivie de l'analyse structurée pour le médecin.`;
          break;
        default:
          prompt = 'Transcris et analyse cet enregistrement audio.';
      }
      
      console.log('Appel à Gemini 2.0 Flash...');
      
      // Appeler l'API Gemini
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        { 
          contents: [{
            role: 'user',
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes
        }
      );
      
      console.log('Réponse Gemini reçue');
      
      // Extraire le texte de la réponse
      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!generatedText) {
        throw new functions.https.HttpsError('internal', 'Aucune transcription générée');
      }
      
      console.log(`Transcription générée: ${generatedText.length} caractères`);
      
      // Retourner le résultat structuré
      return {
        transcription: generatedText,
        metadata: {
          audioSizeMB: audioSizeMB,
          analysisType: analysisType,
          model: 'gemini-2.0-flash',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Erreur Gemini:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'Format audio non supporté ou données corrompues'
        );
      }
      
      throw new functions.https.HttpsError(
        'internal', 
        'Erreur lors de l\'analyse audio: ' + error.message
      );
    }
  }); 
