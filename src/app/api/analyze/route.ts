import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === 'perplexity') {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant médical expert. Fais une recherche académique exhaustive sur le cas clinique fourni en te concentrant sur les publications médicales récentes, les guidelines et les études cliniques. Fournis des réponses détaillées avec les sources.'
            },
            {
              role: 'user',
              content: data.query
            }
          ],
          stream: false,
          search_mode: 'academic',
          web_search_options: {
            search_context_size: 'high'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return NextResponse.json(response.data);
    }

    if (action === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'o3',
          messages: [
            {
              role: 'system',
              content: data.systemPrompt
            },
            {
              role: 'user',
              content: data.userPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return NextResponse.json(response.data);
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur API:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || error.message },
      { status: error.response?.status || 500 }
    );
  }
} 