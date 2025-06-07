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
          model: 'pplx-7b-online',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant médical expert. Fais une recherche académique exhaustive sur le cas clinique fourni. Donne des réponses détaillées avec des citations complètes (titre, auteurs, DOI/PMID, lien).'
            },
            {
              role: 'user',
              content: query
            }
          ],
          stream: false,
          search_recency_filter: 'month'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
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

  async analyzeWithOpenAI(caseText: string, perplexityReport: string, sectionType: string): Promise<string> {
    const sectionPrompts = {
      CLINICAL_CONTEXT: "Analyse et rédige le contexte clinique de ce cas. Inclus l'anamnèse, les antécédents pertinents et la présentation clinique actuelle.",
      KEY_DATA: "Identifie et structure les données clés du cas : facteurs de risque, signes vitaux, résultats d'examens, valeurs biologiques importantes.",
      DIAGNOSTIC_HYPOTHESES: "Formule les hypothèses diagnostiques principales et différentielles. Justifie chaque hypothèse avec les éléments cliniques.",
      COMPLEMENTARY_EXAMS: "Liste les examens complémentaires recommandés en urgence et à distance. Justifie leur pertinence.",
      THERAPEUTIC_DECISIONS: "Détaille les décisions thérapeutiques immédiates et à long terme. Inclus médicaments, posologies et surveillances.",
      PROGNOSIS_FOLLOWUP: "Évalue le pronostic et propose un plan de suivi adapté avec les échéances.",
      PATIENT_EXPLANATIONS: "Rédige une explication claire et empathique pour le patient (niveau B1/B2). Évite le jargon médical."
    };

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Tu es un médecin expert. Voici le cas clinique et le rapport de recherche académique. 
              ${sectionPrompts[sectionType as keyof typeof sectionPrompts]}
              Utilise les références du rapport en les citant avec [num]. Sois précis et structuré.`
            },
            {
              role: 'user',
              content: `Cas clinique:\n${caseText}\n\nRapport de recherche:\n${perplexityReport}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      throw new Error('Erreur lors de l\'analyse OpenAI');
    }
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