import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Vérifier la clé API
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée' },
        { status: 500 }
      );
    }

    // Gérer différentes actions
    if (action === 'analyze') {
      // Appel pour l'analyse o3
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: params.model || 'o3-2025-04-16',
          reasoning: params.reasoning || { effort: 'medium' },
          input: params.input,
          max_output_tokens: params.max_output_tokens || 25000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur OpenAI:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Erreur OpenAI' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
      
    } else if (action === 'analyze-image') {
      // Appel pour l'analyse d'image o4-mini
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'o4-mini',
          reasoning: { effort: 'high' },
          input: params.input,
          max_output_tokens: 5000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur OpenAI o4-mini:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Erreur OpenAI' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
      
    } else if (action === 'transcribe') {
      // Appel pour la transcription audio
      const formData = new FormData();
      
      // Convertir la base64 en blob si nécessaire
      if (params.audioBase64) {
        const audioBlob = await fetch(params.audioBase64).then(r => r.blob());
        formData.append('file', audioBlob, 'audio.webm');
      } else if (params.audioBlob) {
        formData.append('file', params.audioBlob, 'audio.webm');
      }
      
      formData.append('model', 'gpt-4o-transcribe');
      formData.append('language', 'fr');
      formData.append('prompt', 'Transcription d\'un cas clinique médical en français avec termes médicaux.');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur transcription:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Erreur de transcription' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Erreur API route:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
} 