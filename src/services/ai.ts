import axios from 'axios';

interface PerplexityResponse {
  citations: string[];
  answer: string;
}

interface SectionContent {
  type: string;
  content: string;
}

export class AIService {
  private perplexityApiKey: string;
  private openaiApiKey: string;

  constructor(perplexityApiKey: string, openaiApiKey: string) {
    this.perplexityApiKey = perplexityApiKey;
    this.openaiApiKey = openaiApiKey;
  }

  async searchWithPerplexity(query: string): Promise<PerplexityResponse> {
    try {
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
              content: query
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
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        answer: response.data.choices[0].message.content,
        citations: response.data.citations || []
      };
    } catch (error) {
      console.error('Erreur Perplexity:', error);
      throw new Error('Erreur lors de la recherche Perplexity');
    }
  }

  private async analyzeWithOpenAI(caseText: string, perplexityReport: string, sectionType: string): Promise<string> {
    const sectionPrompts = {
      CLINICAL_CONTEXT: "Analyse et rédige le contexte clinique de ce cas. Inclus l'anamnèse, les antécédents pertinents et la présentation clinique actuelle. Base-toi sur les informations de la recherche académique pour enrichir ton analyse.",
      KEY_DATA: "Identifie et structure les données clés du cas : facteurs de risque, signes vitaux, résultats d'examens, valeurs biologiques importantes. Mets en perspective avec les valeurs de référence issues de la littérature.",
      DIAGNOSTIC_HYPOTHESES: "Formule les hypothèses diagnostiques principales et différentielles. Justifie chaque hypothèse avec les éléments cliniques ET les données de la littérature médicale fournie.",
      COMPLEMENTARY_EXAMS: "Liste les examens complémentaires recommandés en urgence et à distance. Justifie leur pertinence en citant les guidelines et recommandations de la recherche.",
      THERAPEUTIC_DECISIONS: "Détaille les décisions thérapeutiques immédiates et à long terme. Base-toi sur les protocoles et recommandations issus de la recherche. Inclus médicaments, posologies et surveillances.",
      PROGNOSIS_FOLLOWUP: "Évalue le pronostic en te basant sur les données épidémiologiques de la recherche. Propose un plan de suivi adapté avec les échéances selon les recommandations actuelles.",
      PATIENT_EXPLANATIONS: "Rédige une explication claire et empathique pour le patient (niveau B1/B2). Évite le jargon médical. Intègre des éléments rassurants basés sur les données scientifiques."
    };

    const prompt = `Tu es un médecin expert spécialisé dans l'analyse de cas cliniques. 
Tu as accès à une recherche académique approfondie sur ce cas.
${sectionPrompts[sectionType as keyof typeof sectionPrompts]}

IMPORTANT : 
- Utilise les informations de la recherche académique pour enrichir ton analyse
- Cite les sources pertinentes en utilisant [num] quand tu fais référence à des études ou guidelines
- Sois précis, structuré et evidence-based
- Adapte le niveau de détail technique selon la section
- Utilise le formatage Markdown pour structurer ta réponse (titres, listes, gras, etc.)

CAS CLINIQUE:
${caseText}

RECHERCHE ACADÉMIQUE:
${perplexityReport}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16',
        reasoning: { 
          effort: 'medium'
        },
        input: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_output_tokens: 25000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur OpenAI: ${error.error?.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    return data.output_text || data.output?.[0]?.text || '';
  }

  async analyzeClinicalCase(caseText: string): Promise<{
    perplexityReport: PerplexityResponse;
    sections: SectionContent[];
    references: any[];
  }> {
    // 1. Recherche Perplexity
    const perplexityReport = await this.searchWithPerplexity(caseText);

    // 2. Analyse des sections avec OpenAI
    const sectionTypes = [
      'CLINICAL_CONTEXT',
      'KEY_DATA',
      'DIAGNOSTIC_HYPOTHESES',
      'COMPLEMENTARY_EXAMS',
      'THERAPEUTIC_DECISIONS',
      'PROGNOSIS_FOLLOWUP',
      'PATIENT_EXPLANATIONS'
    ];

    const sections: SectionContent[] = [];
    
    for (const type of sectionTypes) {
      const content = await this.analyzeWithOpenAI(
        caseText, 
        perplexityReport.answer, 
        type
      );
      sections.push({ type, content });
    }

    // 3. Extraire les références
    const references = this.extractReferences(perplexityReport);

    return {
      perplexityReport,
      sections,
      references
    };
  }

  private extractReferences(perplexityReport: PerplexityResponse): any[] {
    // Parser les citations de Perplexity
    const references: any[] = [];
    let refIndex = 1;

    // Cette fonction devrait parser le format spécifique de Perplexity
    // Pour l'instant, on retourne un format simplifié
    if (perplexityReport.citations && perplexityReport.citations.length > 0) {
      perplexityReport.citations.forEach((citation: any, index: number) => {
        references.push({
          label: String(index + 1),
          title: citation.title || 'Source non titrée',
          url: citation.url || '#',
          authors: citation.authors || '',
          year: citation.year || new Date().getFullYear()
        });
      });
    }

    return references;
  }
} 