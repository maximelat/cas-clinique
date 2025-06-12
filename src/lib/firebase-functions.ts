import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

// Utiliser l'app Firebase existante
const app = getFirebaseApp();

// Fonctions v1 déployées en us-central1
const functions = app ? getFunctions(app, 'us-central1') : null;

// Connexion à l'émulateur en développement
if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && functions) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // L'émulateur est peut-être déjà connecté
    console.log('Émulateur Functions déjà connecté ou non disponible');
  }
}

// Types pour les fonctions
interface AnalyzeWithO3Request {
  prompt: string;
}

interface AnalyzeWithO3Response {
  text: string;
  error?: string;
}

interface AnalyzeImageRequest {
  prompt: string;
  imageBase64: string;
  imageType?: string;
}

interface AnalyzePerplexityRequest {
  perplexityData: string;
}

interface TranscribeAudioRequest {
  audioBase64: string;
}

interface ExtractStructuredDataRequest {
  caseText: string;
}

interface ExtractStructuredDataResponse {
  anamnese: string;
  antecedents: string;
  examenClinique: string;
  examensComplementaires: string;
  contextePatient: string;
  error?: string;
}

interface EnrichReferencesRequest {
  references: any[];
}

interface EnrichReferencesResponse {
  references: any[];
  error?: string;
}

// Fonctions exportées
export async function analyzeWithO3ViaFunction(prompt: string): Promise<string> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzeO3 = httpsCallable<AnalyzeWithO3Request, AnalyzeWithO3Response>(
    functions, 
    'analyzeWithO3'
  );

  try {
    console.log('Appel Firebase analyzeWithO3, prompt longueur:', prompt.length);
    const result = await analyzeO3({ prompt });
    console.log('Réponse Firebase o3:', result.data);
    
    if (result.data.error) {
      console.error('Erreur dans la réponse:', result.data.error);
      throw new Error(result.data.error);
    }
    
    const text = result.data.text || '';
    console.log('Texte extrait de la réponse o3:', text.length, 'caractères');
    return text;
  } catch (error: any) {
    console.error('Erreur Firebase Function o3 complète:', error);
    console.error('Détails erreur:', error.code, error.message, error.details);
    throw new Error('Erreur lors de l\'analyse: ' + error.message);
  }
}

export async function analyzeImageWithMedGemmaViaFunction(imageBase64: string, imageType?: string, promptType?: string): Promise<string> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzeImage = httpsCallable<{ imageBase64: string; imageType?: string; promptType?: string }, AnalyzeWithO3Response>(
    functions, 
    'analyzeImageWithMedGemma'
  );

  try {
    console.log('Appel Firebase analyzeImageWithMedGemma...', { imageType, promptType });
    const result = await analyzeImage({ imageBase64, imageType, promptType });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    console.log('Réponse MedGemma reçue via Firebase Functions');
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function MedGemma:', error);
    throw new Error('Erreur lors de l\'analyse d\'image avec MedGemma: ' + error.message);
  }
}

export async function analyzeImageWithO3ViaFunction(prompt: string, imageBase64: string, imageType?: string): Promise<string> {
  console.log('analyzeImageWithO3ViaFunction redirige maintenant vers MedGemma');
  // Rediriger vers la nouvelle fonction MedGemma
  return analyzeImageWithMedGemmaViaFunction(imageBase64, imageType);
}

export async function analyzePerplexityWithGPT4MiniViaFunction(perplexityData: string): Promise<string> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzePerplexity = httpsCallable<AnalyzePerplexityRequest, AnalyzeWithO3Response>(
    functions, 
    'analyzePerplexityWithGPT4Mini'
  );

  try {
    const result = await analyzePerplexity({ perplexityData });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function Perplexity:', error);
    throw new Error('Erreur lors de l\'analyse Perplexity: ' + error.message);
  }
}

export async function analyzeReferencesWithGPT4ViaFunction(prompt: string): Promise<string> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzeRefs = httpsCallable<{ prompt: string }, { text: string; error?: string }>(
    functions, 
    'analyzeReferencesWithGPT4'
  );

  try {
    const result = await analyzeRefs({ prompt });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function GPT-4o:', error);
    throw new Error('Erreur lors de l\'analyse GPT-4o: ' + error.message);
  }
}

export async function transcribeAudioViaFunction(audioBase64: string): Promise<string> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const transcribe = httpsCallable<TranscribeAudioRequest, { text: string; error?: string }>(
    functions, 
    'transcribeAudio'
  );

  try {
    const result = await transcribe({ audioBase64 });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function transcription:', error);
    throw new Error('Erreur lors de la transcription: ' + error.message);
  }
}

export async function extractStructuredDataViaFunction(caseText: string): Promise<ExtractStructuredDataResponse> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const extractData = httpsCallable<ExtractStructuredDataRequest, ExtractStructuredDataResponse>(
    functions, 
    'extractStructuredData'
  );

  try {
    const result = await extractData({ caseText });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data;
  } catch (error: any) {
    console.error('Erreur Firebase Function extraction:', error);
    throw new Error('Erreur lors de l\'extraction des données: ' + error.message);
  }
}

export async function enrichReferencesViaFunction(references: any[]): Promise<any[]> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const enrichRefs = httpsCallable<EnrichReferencesRequest, EnrichReferencesResponse>(
    functions, 
    'enrichReferences'
  );

  try {
    console.log('Appel Firebase enrichReferences avec', references.length, 'références');
    const result = await enrichRefs({ references });
    
    if (result.data.error) {
      console.error('Erreur dans la réponse:', result.data.error);
      throw new Error(result.data.error);
    }
    
    console.log('Références enrichies reçues:', result.data.references?.length);
    return result.data.references || references;
  } catch (error: any) {
    console.error('Erreur Firebase Function enrichissement références:', error);
    throw new Error('Erreur lors de l\'enrichissement des références: ' + error.message);
  }
}

export async function analyzePerplexityViaFunction(perplexityResponse: any): Promise<{ analysisText: string, references: any[] }> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzePerplexityResults = httpsCallable(functions, 'analyzePerplexityResults');
  
  try {
    console.log('Appel analyzePerplexityResults via Firebase...');
    const result = await analyzePerplexityResults({ perplexityResponse });
    console.log('Résultat analyse Perplexity:', result.data);
    return result.data as { analysisText: string, references: any[] };
  } catch (error: any) {
    console.error('Erreur analyse Perplexity via Firebase:', error);
    throw error;
  }
}

export async function enrichReferencesWithWebSearchViaFunction(references: any[], perplexityContent: string): Promise<any[]> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const enrichRefs = httpsCallable<{ references: any[], perplexityContent: string }, { references: any[], webSearchLogs?: any[] }>(
    functions, 
    'enrichReferencesWithWebSearch'
  );

  try {
    console.log('Appel Firebase enrichReferencesWithWebSearch...');
    const result = await enrichRefs({ references, perplexityContent });
    
    // Logger les détails du web search si disponibles
    if (result.data.webSearchLogs) {
      console.log('=== LOGS WEB SEARCH ===');
      result.data.webSearchLogs.forEach((log: any) => {
        console.log(`Ref [${log.referenceLabel}]: ${log.enrichmentSuccess ? '✅' : '❌'} ${log.url}`);
        if (log.webSearchResult) {
          console.log(`  - Auteurs: ${log.webSearchResult.authors || 'Non trouvé'}`);
          console.log(`  - Journal: ${log.webSearchResult.journal || 'Non trouvé'}`);
          console.log(`  - Année: ${log.webSearchResult.year || 'Non trouvé'}`);
        }
      });
    }
    
    console.log('Références enrichies reçues via Firebase Functions');
    return result.data.references;
  } catch (error: any) {
    console.error('Erreur Firebase Function Web Search:', error);
    // Fallback : retourner les références originales
    return references;
  }
}

export async function addCitationsToSectionsViaFunction(sections: any[], references: any[], originalPerplexityText: string): Promise<any[]> {
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const addCitations = httpsCallable<{ sections: any[], references: any[], originalPerplexityText: string }, { sections: any[], citationPlacements?: any[] }>(
    functions, 
    'addCitationsToSections'
  );

  try {
    console.log('Appel Firebase addCitationsToSections...');
    const result = await addCitations({ sections, references, originalPerplexityText });
    
    // Logger les détails du placement des citations si disponibles
    if (result.data.citationPlacements) {
      console.log('=== LOGS PLACEMENT CITATIONS ===');
      result.data.citationPlacements.forEach((placement: any) => {
        console.log(`[${placement.referenceLabel}] → ${placement.sectionType}: ${placement.placementReason}`);
      });
    }
    
    console.log('Citations ajoutées via Firebase Functions');
    return result.data.sections;
  } catch (error: any) {
    console.error('Erreur Firebase Function Citations:', error);
    // Fallback : retourner les sections originales
    return sections;
  }
} 