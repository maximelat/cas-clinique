import axios from 'axios';

interface MedGemmaResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MedGemmaClient {
  private apiKey: string | undefined;
  private endpoint = 'https://khynx9ujxzvwk5rb.us-east4.gcp.endpoints.huggingface.cloud/v1/chat/completions';

  constructor() {
    // En production, utiliser la variable d'environnement
    // En développement, utiliser la clé locale si disponible
    this.apiKey = process.env.MEDGEMMA_API_KEY || process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY;
    
    if (!this.apiKey && typeof window !== 'undefined') {
      // Essayer de récupérer depuis le localStorage en développement
      const storedKey = localStorage.getItem('medgemma_api_key');
      if (storedKey) {
        this.apiKey = storedKey;
      }
    }
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('medgemma_api_key', key);
    }
  }

  async analyzeImage(imageBase64: string, imageType: string = 'medical'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API MedGemma non configurée');
    }

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

    const prompt = imageTypePrompts[imageType as keyof typeof imageTypePrompts] || imageTypePrompts.other;

    try {
      console.log('Analyse d\'image avec MedGemma...');
      console.log('Type d\'image:', imageType);

      // Nettoyer le base64 si nécessaire
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await axios.post<MedGemmaResponse>(
        this.endpoint,
        {
          model: 'tgi',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${cleanBase64}`
                  }
                },
                {
                  type: 'text',
                  text: prompt
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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 secondes de timeout
        }
      );

      console.log('Réponse MedGemma reçue');
      
      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse vide de MedGemma');
      }

      console.log('Analyse terminée, longueur:', content.length);
      return content;

    } catch (error: any) {
      console.error('Erreur MedGemma:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Clé API MedGemma invalide');
      } else if (error.response?.status === 429) {
        throw new Error('Limite de requêtes MedGemma atteinte');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout lors de l\'analyse de l\'image');
      }
      
      throw new Error('Erreur lors de l\'analyse de l\'image avec MedGemma: ' + (error.response?.data?.error || error.message));
    }
  }

  // Méthode pour analyser plusieurs images en parallèle
  async analyzeMultipleImages(
    images: { base64: string; type: string }[],
    progressCallback?: (current: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      progressCallback?.(i + 1, images.length);
      
      try {
        const analysis = await this.analyzeImage(images[i].base64, images[i].type);
        results.push(analysis);
      } catch (error) {
        console.error(`Erreur analyse image ${i + 1}:`, error);
        results.push(`Erreur lors de l'analyse de l'image ${i + 1}`);
      }
      
      // Petit délai entre les requêtes pour éviter le rate limiting
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }
}

// Export d'une instance singleton
export const medGemmaClient = new MedGemmaClient(); 