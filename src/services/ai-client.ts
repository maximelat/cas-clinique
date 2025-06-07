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

  private async analyzeWithOpenAI(perplexityData: string, clinicalCase: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    const prompt = `Tu es un médecin expert. Analyse ce cas clinique en te basant sur les données de recherche académique fournies.

CAS CLINIQUE :
${clinicalCase}

DONNÉES DE RECHERCHE ACADÉMIQUE :
${perplexityData}

Instructions :
- Analyse le cas en 7 sections exactement
- Cite les sources entre crochets [1], [2], etc.
- Sois précis et exhaustif
- Utilise les données de recherche pour appuyer ton analyse
- Structure ta réponse en markdown avec les titres de sections

Les 7 sections obligatoires sont :
1. CLINICAL_CONTEXT : Contexte clinique et résumé du cas
2. KEY_DATA : Données cliniques importantes (antécédents, symptômes, signes vitaux)
3. DIAGNOSTIC_HYPOTHESES : Hypothèses diagnostiques différentielles
4. COMPLEMENTARY_EXAMS : Examens complémentaires recommandés
5. THERAPEUTIC_DECISIONS : Décisions thérapeutiques et traitement
6. PROGNOSIS_FOLLOWUP : Pronostic et suivi
7. PATIENT_EXPLANATIONS : Explications pour le patient (langage simple)`;

    try {
      console.log('Appel API OpenAI o3 via route API...');
      
      // Utiliser la route API au lieu de l'appel direct
      const response = await axios.post('/api/openai', {
        action: 'analyze',
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
      });

      console.log('Réponse OpenAI reçue:', response.data);
      
      // Gérer différents formats de réponse possibles
      let outputText = '';
      
      if (response.data.output_text) {
        outputText = response.data.output_text;
      } else if (response.data.output && Array.isArray(response.data.output) && response.data.output[0]?.text) {
        outputText = response.data.output[0].text;
      } else if (response.data.choices && response.data.choices[0]?.message?.content) {
        outputText = response.data.choices[0].message.content;
      } else {
        console.error('Format de réponse OpenAI non reconnu:', response.data);
        throw new Error('Format de réponse OpenAI non reconnu');
      }
      
      console.log('Texte extrait de la réponse OpenAI, longueur:', outputText.length);
      return outputText;
    } catch (error: any) {
      console.error('Erreur OpenAI détaillée:', error.response?.data || error);
      console.error('Status:', error.response?.status);
      
      if (error.response?.data?.error) {
        throw new Error('Erreur OpenAI: ' + error.response.data.error);
      }
      
      throw new Error('Erreur lors de l\'analyse OpenAI: ' + error.message);
    }
  }

  async analyzeClinicalCase(
    caseText: string, 
    progressCallback?: (message: string) => void,
    sectionCallback?: (section: any, index: number, total: number) => void,
    images?: { base64: string, type: string }[]
  ): Promise<{ sections: any[], references: any[], perplexityReport: any }> {
    if (!this.hasApiKeys()) {
      throw new Error('Les clés API ne sont pas configurées');
    }

    try {
      // Étape 1 : Recherche Perplexity
      progressCallback?.('Recherche dans la littérature médicale...');
      console.log('Début recherche Perplexity...');
      const perplexityReport = await this.searchWithPerplexity(caseText);
      console.log('Recherche Perplexity terminée, rapport:', perplexityReport);
      
      // Étape 2 : Analyser les images avec o4-mini si présentes
      let imageAnalyses = '';
      if (images && images.length > 0) {
        progressCallback?.('Analyse des images médicales...');
        console.log(`Analyse de ${images.length} images...`);
        for (let i = 0; i < images.length; i++) {
          progressCallback?.(`Analyse de l'image ${i + 1}/${images.length}...`);
          const imageAnalysis = await this.analyzeImageWithO4Mini(images[i].base64, images[i].type);
          imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\n${imageAnalysis}`;
        }
        console.log('Analyse des images terminée');
      }

      // Étape 3 : Construire le prompt complet pour o3
      const completeData = perplexityReport.answer + (imageAnalyses ? `\n\nANALYSES D'IMAGERIE:${imageAnalyses}` : '');
      console.log('Données complètes préparées, longueur:', completeData.length);
      
      // Étape 4 : Analyser avec o3 toutes les sections en une fois
      progressCallback?.('Analyse médicale complète en cours...');
      console.log('Début analyse OpenAI o3...');
      const fullAnalysis = await this.analyzeWithOpenAI(completeData, caseText);
      console.log('Analyse OpenAI terminée, longueur de la réponse:', fullAnalysis.length);
      
      // Étape 5 : Parser la réponse pour extraire les sections
      console.log('Parsing des sections...');
      const sections = this.parseSections(fullAnalysis);
      console.log('Sections parsées:', sections.length);
      
      // Étape 6 : Extraire les références du rapport Perplexity
      const references = this.extractReferences(perplexityReport);
      console.log('Références extraites:', references.length);
      
      // Appeler le callback pour chaque section
      sections.forEach((section, index) => {
        sectionCallback?.(section, index, sections.length);
      });
      
      return {
        sections,
        references,
        perplexityReport
      };
    } catch (error: any) {
      console.error('Erreur complète dans analyzeClinicalCase:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  private parseSections(analysis: string): any[] {
    const sectionTypes = [
      'CLINICAL_CONTEXT',
      'KEY_DATA', 
      'DIAGNOSTIC_HYPOTHESES',
      'COMPLEMENTARY_EXAMS',
      'THERAPEUTIC_DECISIONS',
      'PROGNOSIS_FOLLOWUP',
      'PATIENT_EXPLANATIONS'
    ];

    const sections: any[] = [];
    
    // Rechercher chaque section dans le texte
    for (let i = 0; i < sectionTypes.length; i++) {
      const currentType = sectionTypes[i];
      const nextType = sectionTypes[i + 1];
      
      // Patterns pour trouver les sections
      const patterns = [
        new RegExp(`#+ *${currentType}[\\s\\S]*?(?=#|$)`, 'i'),
        new RegExp(`${currentType}[\\s:]*\\n([\\s\\S]*?)(?=${nextType || '$'})`, 'i'),
        new RegExp(`\\d+\\.\\s*${currentType}[\\s:]*\\n([\\s\\S]*?)(?=\\d+\\.|$)`, 'i')
      ];
      
      let content = '';
      for (const pattern of patterns) {
        const match = analysis.match(pattern);
        if (match) {
          content = match[1] || match[0];
          // Nettoyer le contenu
          content = content
            .replace(new RegExp(`#*\\s*${currentType}\\s*:?`, 'i'), '')
            .replace(/^\d+\.\s*/, '')
            .trim();
          break;
        }
      }
      
      if (content) {
        sections.push({
          type: currentType,
          content: content
        });
      }
    }
    
    // Si on n'a pas trouvé toutes les sections, essayer une approche plus simple
    if (sections.length < 7) {
      // Diviser le texte en paragraphes et assigner aux sections manquantes
      const paragraphs = analysis.split(/\n\n+/);
      const missingSections = sectionTypes.filter(type => 
        !sections.find(s => s.type === type)
      );
      
      missingSections.forEach((type, index) => {
        if (paragraphs[sections.length + index]) {
          sections.push({
            type: type,
            content: paragraphs[sections.length + index].trim()
          });
        }
      });
    }
    
    return sections;
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

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    try {
      // Convertir le blob en base64 pour l'envoyer via JSON
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Utiliser la route API
      const response = await axios.post('/api/openai', {
        action: 'transcribe',
        audioBase64: audioBase64
      });

      return response.data.text || '';
    } catch (error: any) {
      console.error('Erreur de transcription:', error);
      
      if (error.response?.data?.error) {
        throw new Error('Erreur de transcription: ' + error.response.data.error);
      }
      
      throw new Error('Erreur lors de la transcription: ' + error.message);
    }
  }

  // Méthode helper pour vérifier si le navigateur supporte l'enregistrement audio
  static isAudioRecordingSupported(): boolean {
    // Vérifier si on est côté client
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Analyser une image avec o4-mini
  private async analyzeImageWithO4Mini(imageBase64: string, imageType: string = 'medical'): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    const imageTypePrompts = {
      medical: "Analyse cette image médicale (radiographie, IRM, scanner, échographie, etc.) et décris précisément ce que tu observes.",
      biology: "Analyse ces résultats biologiques et identifie les valeurs anormales, en les comparant aux valeurs de référence.",
      ecg: "Analyse cet ECG : rythme, fréquence, intervalles, anomalies éventuelles.",
      other: "Analyse cette image clinique et décris ce que tu observes de pertinent."
    };

    const prompt = `${imageTypePrompts[imageType as keyof typeof imageTypePrompts] || imageTypePrompts.other}
    
    Sois précis et méthodique. Liste toutes les anomalies observées et leur signification clinique potentielle.`;

    try {
      // Utiliser la route API au lieu de l'appel direct
      const response = await axios.post('/api/openai', {
        action: 'analyze-image',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt
              },
              {
                type: 'input_image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      // Gérer la réponse
      let outputText = '';
      
      if (response.data.output_text) {
        outputText = response.data.output_text;
      } else if (response.data.output && Array.isArray(response.data.output) && response.data.output[0]?.text) {
        outputText = response.data.output[0].text;
      } else {
        console.error('Format de réponse o4-mini non reconnu:', response.data);
        throw new Error('Format de réponse non reconnu');
      }
      
      return outputText;
    } catch (error: any) {
      console.error('Erreur analyse image o4-mini:', error);
      throw new Error('Erreur lors de l\'analyse de l\'image: ' + (error.response?.data?.error || error.message));
    }
  }
} 