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
}

interface AnalyzePerplexityRequest {
  perplexityData: string;
}

interface TranscribeAudioRequest {
  audioBase64: string;
}

// Initialiser Firebase Functions
let functionsInstance: any = null;

function getFunctionsInstance() {
  if (!functionsInstance) {
    const app = getFirebaseApp();
    if (app) {
      functionsInstance = getFunctions(app, 'europe-west1'); // ou votre région
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
    const result = await analyzeO3({ prompt });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function:', error);
    throw new Error('Erreur lors de l\'analyse: ' + error.message);
  }
}

export async function analyzeImageWithO3ViaFunction(prompt: string, imageBase64: string): Promise<string> {
  const functions = getFunctionsInstance();
  if (!functions) {
    throw new Error('Firebase Functions non configuré');
  }

  const analyzeImage = httpsCallable<AnalyzeImageRequest, AnalyzeWithO3Response>(
    functions, 
    'analyzeImageWithO3'
  );

  try {
    const result = await analyzeImage({ prompt, imageBase64 });
    if (result.data.error) {
      throw new Error(result.data.error);
    }
    return result.data.text;
  } catch (error: any) {
    console.error('Erreur Firebase Function image:', error);
    throw new Error('Erreur lors de l\'analyse d\'image: ' + error.message);
  }
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