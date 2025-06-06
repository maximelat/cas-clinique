import axios from 'axios';

interface PerplexityResponse {
  citations: any[];
  answer: string;
}

interface SectionContent {
  type: string;
  content: string;
}

export class AIClientService {
  private perplexityApiKey: string | undefined;
  private openaiApiKey: string | undefined;

  constructor() {
    // En production, ces clés seront exposées côté client - À UTILISER AVEC PRUDENCE
    // Pour une vraie application, utilisez un backend sécurisé
    this.perplexityApiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  }

  hasApiKeys(): boolean {
    return !!(this.perplexityApiKey && this.openaiApiKey);
  }

  async searchWithPerplexity(query: string): Promise<PerplexityResponse> {
    if (!this.perplexityApiKey) {
      throw new Error('Clé API Perplexity non configurée');
    }

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

      // Extraire la réponse et les citations
      const messageContent = response.data.choices[0].message.content;
      const citations = response.data.citations || [];

      return {
        answer: messageContent,
        citations: citations
      };
    } catch (error: any) {
      console.error('Erreur Perplexity détaillée:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        throw new Error('Erreur de configuration Perplexity. Vérifiez votre clé API.');
      }
      throw new Error('Erreur lors de la recherche Perplexity: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async analyzeWithOpenAI(caseText: string, perplexityReport: string, sectionType: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    const sectionPrompts = {
      CLINICAL_CONTEXT: "Analyse et rédige le contexte clinique de ce cas. Inclus l'anamnèse, les antécédents pertinents et la présentation clinique actuelle. Base-toi sur les informations de la recherche académique pour enrichir ton analyse.",
      KEY_DATA: "Identifie et structure les données clés du cas : facteurs de risque, signes vitaux, résultats d'examens, valeurs biologiques importantes. Mets en perspective avec les valeurs de référence issues de la littérature.",
      DIAGNOSTIC_HYPOTHESES: "Formule les hypothèses diagnostiques principales et différentielles. Justifie chaque hypothèse avec les éléments cliniques ET les données de la littérature médicale fournie.",
      COMPLEMENTARY_EXAMS: "Liste les examens complémentaires recommandés en urgence et à distance. Justifie leur pertinence en citant les guidelines et recommandations de la recherche.",
      THERAPEUTIC_DECISIONS: "Détaille les décisions thérapeutiques immédiates et à long terme. Base-toi sur les protocoles et recommandations issus de la recherche. Inclus médicaments, posologies et surveillances.",
      PROGNOSIS_FOLLOWUP: "Évalue le pronostic en te basant sur les données épidémiologiques de la recherche. Propose un plan de suivi adapté avec les échéances selon les recommandations actuelles.",
      PATIENT_EXPLANATIONS: "Rédige une explication claire et empathique pour le patient (niveau B1/B2). Évite le jargon médical. Intègre des éléments rassurants basés sur les données scientifiques."
    };

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Tu es un médecin expert spécialisé dans l'analyse de cas cliniques. 
              Tu as accès à une recherche académique approfondie sur ce cas.
              ${sectionPrompts[sectionType as keyof typeof sectionPrompts]}
              
              IMPORTANT : 
              - Utilise les informations de la recherche académique pour enrichir ton analyse
              - Cite les sources pertinentes en utilisant [num] quand tu fais référence à des études ou guidelines
              - Sois précis, structuré et evidence-based
              - Adapte le niveau de détail technique selon la section`
            },
            {
              role: 'user',
              content: `CAS CLINIQUE:\n${caseText}\n\nRECHERCHE ACADÉMIQUE:\n${perplexityReport}`
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
    } catch (error: any) {
      console.error('Erreur OpenAI:', error);
      throw new Error('Erreur lors de l\'analyse OpenAI: ' + error.message);
    }
  }

  async analyzeClinicalCase(caseText: string, onProgress?: (message: string) => void): Promise<{
    perplexityReport: PerplexityResponse;
    sections: SectionContent[];
    references: any[];
  }> {
    // 1. Recherche Perplexity Academic
    onProgress?.('Recherche académique en cours...');
    const perplexityReport = await this.searchWithPerplexity(caseText);

    // 2. Analyse des sections avec OpenAI en utilisant le rapport Perplexity
    const sectionTypes = [
      'CLINICAL_CONTEXT',
      'KEY_DATA',
      'DIAGNOSTIC_HYPOTHESES',
      'COMPLEMENTARY_EXAMS',
      'THERAPEUTIC_DECISIONS',
      'PROGNOSIS_FOLLOWUP',
      'PATIENT_EXPLANATIONS'
    ];

    const sectionNames: { [key: string]: string } = {
      'CLINICAL_CONTEXT': 'Contexte clinique',
      'KEY_DATA': 'Données clés',
      'DIAGNOSTIC_HYPOTHESES': 'Hypothèses diagnostiques',
      'COMPLEMENTARY_EXAMS': 'Examens complémentaires',
      'THERAPEUTIC_DECISIONS': 'Décisions thérapeutiques',
      'PROGNOSIS_FOLLOWUP': 'Pronostic et suivi',
      'PATIENT_EXPLANATIONS': 'Explications patient'
    };

    const sections: SectionContent[] = [];
    
    for (let i = 0; i < sectionTypes.length; i++) {
      const type = sectionTypes[i];
      onProgress?.(`Analyse ${i + 1}/7: ${sectionNames[type]}...`);
      
      const content = await this.analyzeWithOpenAI(
        caseText, 
        perplexityReport.answer, 
        type
      );
      sections.push({ type, content });
    }

    // 3. Extraire les références de Perplexity
    const references = this.extractReferences(perplexityReport);

    return {
      perplexityReport,
      sections,
      references
    };
  }

  private extractReferences(perplexityReport: PerplexityResponse): any[] {
    const references: any[] = [];

    // Parser les citations de Perplexity si elles sont disponibles
    if (perplexityReport.citations && Array.isArray(perplexityReport.citations)) {
      perplexityReport.citations.forEach((citation: any, index: number) => {
        references.push({
          label: String(index + 1),
          title: citation.title || citation.name || 'Source non titrée',
          url: citation.url || '#',
          authors: citation.authors?.join(', ') || '',
          year: citation.year || citation.date ? new Date(citation.date).getFullYear() : new Date().getFullYear(),
          doi: citation.doi || '',
          pmid: citation.pmid || ''
        });
      });
    }

    // Si pas de citations structurées, essayer d'extraire du texte
    if (references.length === 0 && perplexityReport.answer) {
      // Rechercher des patterns de citations dans le texte
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = perplexityReport.answer.match(urlRegex) || [];
      
      urls.forEach((url, index) => {
        references.push({
          label: String(index + 1),
          title: `Source ${index + 1}`,
          url: url,
          authors: '',
          year: new Date().getFullYear()
        });
      });
    }

    return references;
  }
} 