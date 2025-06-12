import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

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

// Initialiser Firebase Functions
let functionsInstance: any = null;

function getFunctionsInstance() {
  if (!functionsInstance) {
    const app = getFirebaseApp();
    if (app) {
      functionsInstance = getFunctions(app, 'us-central1'); // Changé de europe-west1 à us-central1
    }
  }
  return functionsInstance;
}

// Fonctions exportées
export async function analyzeWithO3ViaFunction(prompt: string): Promise<string> {
  const functions = getFunctionsInstance();
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

export async function analyzeImageWithMedGemmaViaFunction(imageBase64: string, imageType?: string): Promise<string> {
  const functions = getFunctionsInstance();
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzeImage = httpsCallable<{ imageBase64: string; imageType?: string }, AnalyzeWithO3Response>(
    functions, 
    'analyzeImageWithMedGemma'
  );

  try {
    console.log('Appel Firebase analyzeImageWithMedGemma...');
    const result = await analyzeImage({ imageBase64, imageType });
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
  const functions = getFunctionsInstance();
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
  const functions = getFunctionsInstance();
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
  const functions = getFunctionsInstance();
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
  const functions = getFunctionsInstance();
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
  const functions = getFunctionsInstance();
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