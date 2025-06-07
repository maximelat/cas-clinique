import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

export async function POST(req: NextRequest) {
  try {
    const { caseText, useRealAPI } = await req.json();

    if (!caseText) {
      return NextResponse.json(
        { error: 'Le contenu du cas est requis' },
        { status: 400 }
      );
    }

    // Mode démo
    if (!useRealAPI) {
      // Retourner les données de démo après un délai simulé
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Analyse simulée terminée'
      });
    }

    // Mode réel avec APIs
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!perplexityApiKey || !openaiApiKey) {
      return NextResponse.json(
        { error: 'Les clés API ne sont pas configurées' },
        { status: 500 }
      );
    }

    const aiService = new AIService(perplexityApiKey, openaiApiKey);
    
    try {
      const result = await aiService.analyzeClinicalCase(caseText);
      
      return NextResponse.json({
        success: true,
        isDemo: false,
        data: result
      });
    } catch (aiError: any) {
      console.error('Erreur AI:', aiError);
      return NextResponse.json(
        { error: `Erreur lors de l'analyse: ${aiError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
} 