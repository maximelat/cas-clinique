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
    const prompt = `Analyse cette réponse Perplexity et créé des références enrichies pour TOUTES les sources disponibles:

RÉPONSE PERPLEXITY:
${typeof perplexityResponse === 'string' ? perplexityResponse : JSON.stringify(perplexityResponse, null, 2)}

SEARCH RESULTS AVEC DATES (TOUTES LES SOURCES À INCLURE):
${JSON.stringify(searchResults, null, 2)}

INSTRUCTIONS:
1. Crée une référence pour CHAQUE source dans search_results (même si elle n'est pas citée dans le texte)
2. Pour chaque référence, utilise les informations exactes de search_results:
   - title: Titre exact de l'article
   - url: URL de la source
   - date: Date de publication exacte depuis search_results
   - authors: "Non disponible" (sauf si déductible de l'URL/titre)
   - journal: Déduis depuis l'URL ou mets "Non disponible"
   - keyPoints: Point clé de cette source en rapport avec le cas clinique

3. Retourne un JSON avec les sections suivantes:
   - analysisText: Le texte de l'analyse Perplexity (inchangé)
   - references: Array avec TOUTES les références enrichies (une par search_result)

RÈGLES IMPORTANTES:
- NE PAS filtrer les références selon le texte - inclure TOUTES les sources de search_results
- Utilise les dates exactes des search_results
- Pour les auteurs : mets "Non disponible" sauf si clairement identifiable
- Pour les journaux : déduis depuis l'URL si possible, sinon "Non disponible"
- Numérote les références [1], [2], etc. dans l'ordre des search_results

Format de sortie OBLIGATOIRE:
{
  "analysisText": "Texte analysé Perplexity inchangé...",
  "references": [
    {
      "label": "1",
      "title": "Titre exact du search_result",
      "url": "URL exacte",
      "date": "Date exacte depuis search_results",
      "authors": "Non disponible",
      "journal": "Journal déduit ou Non disponible",
      "keyPoints": "Points clés de cette source"
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

    console.log(`Enrichissement de ${references.length} références avec Web Search...`);
    
    // Traiter par batches de 3 pour éviter les timeouts
    const batchSize = 3;
    const enrichedRefs = [...references];
    
    for (let i = 0; i < references.length; i += batchSize) {
      const batch = references.slice(i, i + batchSize);
      console.log(`Traitement batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(references.length/batchSize)}`);
      
      for (const ref of batch) {
        try {
          const prompt = `Lis cette source académique et extrais les métadonnées précises :

URL: ${ref.url}
Titre actuel: ${ref.title || 'Non disponible'}

INSTRUCTIONS STRICTES:
1. Visite l'URL et lis le contenu de l'article
2. Extrais UNIQUEMENT les informations VISIBLES sur la page
3. Ne JAMAIS inventer d'informations
4. Si une information n'est pas trouvée, marque "Non disponible"

Format JSON obligatoire:
{
  "title": "Titre exact de l'article",
  "authors": "Auteur(s) exact(s) ou Non disponible", 
  "journal": "Nom exact du journal ou Non disponible",
  "year": "Année de publication ou null",
  "doi": "DOI si disponible ou null",
  "abstract": "Résumé de 2-3 lignes du contenu pertinent"
}`;

          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              tools: [{ type: 'web_search_preview' }],
              tool_choice: { type: 'web_search_preview' },
              max_tokens: 1000,
              temperature: 0.1,
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
          
          try {
            const enrichedData = JSON.parse(responseText);
            
            // Mettre à jour la référence avec les données enrichies
            const refIndex = enrichedRefs.findIndex(r => r.url === ref.url);
            if (refIndex !== -1) {
              enrichedRefs[refIndex] = {
                ...enrichedRefs[refIndex],
                title: enrichedData.title || ref.title,
                authors: enrichedData.authors || 'Non disponible',
                journal: enrichedData.journal || 'Non disponible', 
                year: enrichedData.year || null,
                doi: enrichedData.doi || null,
                abstract: enrichedData.abstract || ''
              };
            }
            
            console.log(`Référence enrichie: ${enrichedData.title?.substring(0, 50)}...`);
            
          } catch (parseError) {
            console.error('Erreur parsing JSON pour ref:', ref.url, parseError);
            // Garder la référence originale en cas d'erreur
          }
          
        } catch (refError) {
          console.error(`Erreur enrichissement ref ${ref.url}:`, refError.message);
          // Continuer avec la référence non enrichie
        }
        
        // Délai entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Enrichissement terminé: ${enrichedRefs.length} références`);
    return { references: enrichedRefs };
    
  } catch (error) {
    console.error('Erreur enrichissement Web Search:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'enrichissement avec Web Search: ' + error.message
    );
  }
});

// Fonction pour ajouter les citations aux sections
exports.addCitationsToSections = functions.https.onCall(async (data, context) => {
  try {
    const { sections, references, originalPerplexityText } = data;
    
    if (!sections || !Array.isArray(sections)) {
      throw new functions.https.HttpsError('invalid-argument', 'Sections requises');
    }

    if (!OPENAI_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Clé API OpenAI non configurée');
    }

    console.log('Ajout intelligent des citations aux sections...');
    
    const prompt = `Tu es un expert médical. Ajoute intelligemment les références [1], [2], etc. dans ces sections analysées.

SECTIONS ANALYSÉES:
${sections.map((s, i) => `## ${s.type}:\n${s.content}`).join('\n\n')}

RÉFÉRENCES DISPONIBLES:
${references.map(ref => `[${ref.label}] "${ref.title}" - ${ref.journal || 'Journal non spécifié'} (${ref.year || 'Année non spécifiée'})`).join('\n')}

INSTRUCTIONS:
1. Pour chaque affirmation médicale dans les sections, ajoute la référence [X] la plus pertinente
2. Ajoute les références UNIQUEMENT là où le contenu correspond vraiment à la source
3. Ne force PAS les références si elles ne correspondent pas
4. Préserve exactement la structure des sections avec ## TYPE:
5. Retourne les sections modifiées en JSON

Format de réponse OBLIGATOIRE:
{
  "sections": [
    {
      "type": "CLINICAL_CONTEXT",
      "content": "Contenu avec références [1] ajoutées..."
    }
  ]
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 6000,
        temperature: 0.1,
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
    
    try {
      const result = JSON.parse(responseText);
      const updatedSections = result.sections || sections;
      
      console.log(`Citations ajoutées à ${updatedSections.length} sections`);
      return { sections: updatedSections };
      
    } catch (parseError) {
      console.error('Erreur parsing citations:', parseError);
      return { sections }; // Retourner les sections originales
    }
    
  } catch (error) {
    console.error('Erreur ajout citations:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal', 
      'Erreur lors de l\'ajout des citations: ' + error.message
    );
  }
}); 