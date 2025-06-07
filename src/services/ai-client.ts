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
    // Clés API exposées côté client - À utiliser uniquement pour des projets de démonstration
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
      // Utiliser l'API Perplexity directement sans proxy (ils supportent CORS)
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

      console.log('Réponse Perplexity complète:', response.data);

      // Extraire la réponse et les citations
      const messageContent = response.data.choices[0].message.content;
      
      // Nettoyer le contenu en retirant les balises <think>...</think>
      const cleanContent = messageContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      // Les citations peuvent être dans différents formats selon la réponse
      let citations = [];
      
      // Vérifier d'abord si les citations sont directement dans la réponse
      if (response.data.citations) {
        citations = response.data.citations;
      } 
      // Sinon, vérifier dans le message
      else if (response.data.choices[0].message.citations) {
        citations = response.data.choices[0].message.citations;
      }
      // Sinon, essayer d'extraire les URLs du texte
      else {
        const urlRegex = /\[(\d+)\]\s*(https?:\/\/[^\s\)]+)/g;
        const matches = [...cleanContent.matchAll(urlRegex)];
        citations = matches.map((match, index) => ({
          number: match[1],
          url: match[2],
          title: `Source ${match[1]}`
        }));
      }

      return {
        answer: cleanContent,
        citations: citations
      };
    } catch (error: any) {
      console.error('Erreur Perplexity détaillée:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        throw new Error('Erreur de configuration Perplexity. Vérifiez votre clé API.');
      }
      throw new Error('Erreur lors de la recherche Perplexity: ' + (error.response?.data?.error || error.message));
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

    const systemPrompt = `Tu es un médecin expert spécialisé dans l'analyse de cas cliniques. 
              Tu as accès à une recherche académique approfondie sur ce cas.
              ${sectionPrompts[sectionType as keyof typeof sectionPrompts]}
              
              IMPORTANT : 
              - Utilise les informations de la recherche académique pour enrichir ton analyse
              - Cite les sources pertinentes en utilisant [num] quand tu fais référence à des études ou guidelines
              - Sois précis, structuré et evidence-based
              - Adapte le niveau de détail technique selon la section
              - Utilise le formatage Markdown pour structurer ta réponse (titres, listes, gras, etc.)`;

    const userPrompt = `CAS CLINIQUE:\n${caseText}\n\nRECHERCHE ACADÉMIQUE:\n${perplexityReport}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
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
      
      // Si c'est une erreur CORS, suggérer d'utiliser un backend
      if (error.message.includes('CORS') || error.message.includes('Network Error')) {
        throw new Error('Erreur CORS avec OpenAI. Pour la production, utilisez un backend sécurisé (voir SECURE-OPTIONS.md)');
      }
      
      throw new Error('Erreur lors de l\'analyse OpenAI: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async analyzeClinicalCase(
    caseText: string, 
    onProgress?: (message: string) => void,
    onSectionComplete?: (section: SectionContent, index: number, total: number) => void
  ): Promise<{
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
      
      const section = { type, content };
      sections.push(section);
      
      // Appeler le callback pour afficher la section immédiatement
      onSectionComplete?.(section, i, sectionTypes.length);
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
        // Si c'est une simple URL string
        if (typeof citation === 'string') {
          references.push({
            label: String(index + 1),
            title: `Source ${index + 1}`,
            url: citation,
            authors: '',
            year: null,
            journal: ''
          });
        } 
        // Si c'est un objet structuré
        else if (typeof citation === 'object') {
          const label = citation.number || String(index + 1);
          const title = citation.title || citation.name || citation.text || `Source ${label}`;
          const url = citation.url || citation.link || citation;
          
          references.push({
            label: label,
            title: title,
            url: url,
            authors: citation.authors?.join?.(', ') || citation.author || '',
            year: citation.year || citation.date ? new Date(citation.date).getFullYear() : null,
            doi: citation.doi || '',
            pmid: citation.pmid || '',
            journal: citation.journal || citation.source || ''
          });
        }
      });
    }

    // Si pas de citations structurées, essayer d'extraire du texte
    if (references.length === 0 && perplexityReport.answer) {
      // Rechercher des patterns de citations dans le texte nettoyé
      // Pattern: [1][5][9] dans le texte
      const citationNumbersRegex = /\[(\d+)\]/g;
      const citationNumbers = new Set<string>();
      
      let match;
      while ((match = citationNumbersRegex.exec(perplexityReport.answer)) !== null) {
        citationNumbers.add(match[1]);
      }
      
      // Créer des références pour chaque numéro trouvé
      Array.from(citationNumbers).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
        references.push({
          label: num,
          title: `Source ${num}`,
          url: '#', // URL placeholder
          authors: '',
          year: null,
          journal: ''
        });
      });
    }

    return references;
  }
} 