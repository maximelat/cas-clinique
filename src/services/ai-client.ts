import axios from 'axios';
import { isFirebaseConfigured } from '@/lib/firebase';
import { 
  analyzeWithO3ViaFunction, 
  analyzeImageWithO3ViaFunction,
  analyzePerplexityWithGPT4MiniViaFunction,
  transcribeAudioViaFunction 
} from '@/lib/firebase-functions';

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
  private isProduction: boolean = false;
  private useFirebaseFunctions: boolean = false;

  constructor() {
    // Clés API exposées côté client - À utiliser uniquement pour des projets de démonstration
    this.perplexityApiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    // Détecter si on est en production
    if (typeof window !== 'undefined') {
      this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    }
    
    // Utiliser Firebase Functions si Firebase est configuré et qu'on est en production
    this.useFirebaseFunctions = this.isProduction && isFirebaseConfigured();
    
    if (this.useFirebaseFunctions) {
      console.log('Mode production détecté - Utilisation de Firebase Functions pour OpenAI');
    }
  }

  hasApiKeys(): boolean {
    return !!(this.perplexityApiKey && (this.openaiApiKey || this.useFirebaseFunctions));
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

  private async analyzeWithO3(perplexityDataProcessed: string, clinicalCase: string): Promise<string> {
    const prompt = `Tu es un médecin expert. Analyse ce cas clinique en te basant sur les données de recherche académique fournies.

CAS CLINIQUE :
${clinicalCase}

SYNTHÈSE DE LA RECHERCHE ACADÉMIQUE :
${perplexityDataProcessed}

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
      if (this.useFirebaseFunctions) {
        console.log('Utilisation de Firebase Functions pour o3...');
        return await analyzeWithO3ViaFunction(prompt);
      } else {
        // Mode développement - appel direct
        console.log('Appel API OpenAI o3 direct (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/responses',
          {
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
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Gérer différents formats de réponse possibles
        let outputText = '';
        
        if (response.data.output_text) {
          outputText = response.data.output_text;
        } else if (response.data.output && Array.isArray(response.data.output) && response.data.output[0]?.text) {
          outputText = response.data.output[0].text;
        } else if (response.data.choices && response.data.choices[0]?.message?.content) {
          outputText = response.data.choices[0].message.content;
        } else {
          throw new Error('Format de réponse OpenAI non reconnu');
        }
        
        return outputText;
      }
    } catch (error: any) {
      console.error('Erreur OpenAI détaillée:', error);
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
      
      // Étape 2 : Analyser les liens/références avec GPT-4o
      progressCallback?.('Analyse des références avec GPT-4o...');
      console.log('Analyse des liens avec GPT-4o...');
      const referencesAnalysis = await this.analyzeReferencesWithGPT4(perplexityReport);
      console.log('Analyse GPT-4o terminée');
      
      // Étape 3 : Analyser les images avec o3 si présentes
      let imageAnalyses = '';
      if (images && images.length > 0) {
        progressCallback?.('Analyse des images médicales avec o3...');
        console.log(`Analyse de ${images.length} images avec o3...`);
        for (let i = 0; i < images.length; i++) {
          progressCallback?.(`Analyse de l'image ${i + 1}/${images.length}...`);
          const imageAnalysis = await this.analyzeImageWithO3(images[i].base64, images[i].type);
          imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\n${imageAnalysis}`;
        }
        console.log('Analyse des images terminée');
      }

      // Étape 4 : Analyser avec o3 le cas clinique + rapport Perplexity + analyse des liens + images
      progressCallback?.('Analyse médicale complète avec o3...');
      console.log('Début analyse principale avec o3...');
      const completeData = `RAPPORT DE RECHERCHE ACADÉMIQUE:\n${perplexityReport.answer}\n\n` +
                          `ANALYSE DES RÉFÉRENCES ET LIENS:\n${referencesAnalysis.analysis}` +
                          (imageAnalyses ? `\n\nANALYSES D'IMAGERIE:${imageAnalyses}` : '');
      
      const fullAnalysis = await this.analyzeWithO3(completeData, caseText);
      console.log('Analyse o3 terminée');
      
      // Étape 5 : Parser la réponse pour extraire les sections
      console.log('Parsing des sections...');
      const sections = this.parseSections(fullAnalysis);
      console.log('Sections parsées:', sections.length);
      
      // Appeler le callback pour chaque section
      sections.forEach((section, index) => {
        sectionCallback?.(section, index, sections.length);
      });
      
      return {
        sections,
        references: referencesAnalysis.references,
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

  private async analyzeReferencesWithGPT4(perplexityReport: PerplexityResponse): Promise<{ analysis: string, references: any[] }> {
    try {
      // D'abord extraire les références brutes
      const rawReferences = this.extractReferences(perplexityReport);
      
      // Si pas de références, retourner vide
      if (rawReferences.length === 0) {
        return {
          analysis: "Aucune référence trouvée dans le rapport.",
          references: []
        };
      }
      
      // Préparer le prompt pour GPT-4o
      const prompt = `Analyse ces références et liens issus d'une recherche médicale. Pour chaque référence, extrais et structure les informations importantes (titre, auteurs, journal, année, points clés).

RAPPORT DE RECHERCHE:
${perplexityReport.answer}

RÉFÉRENCES EXTRAITES:
${rawReferences.map((ref, i) => `[${ref.label}] ${ref.url}`).join('\n')}

Instructions:
- Identifie le contenu de chaque lien/référence
- Extrais les informations bibliographiques quand disponibles
- Résume les points clés de chaque source
- Évalue la qualité et la pertinence des sources
- Structure ta réponse de manière claire`;

      if (this.useFirebaseFunctions) {
        console.log('Analyse des références avec GPT-4o via Firebase Functions...');
        // TODO: Créer une fonction Firebase pour GPT-4o
        const analysis = await this.callGPT4ViaFirebase(prompt);
        return {
          analysis,
          references: rawReferences
        };
      } else {
        // Mode développement - appel direct GPT-4o
        console.log('Appel API GPT-4o direct (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const analysis = response.data.choices?.[0]?.message?.content || '';
        
        // Enrichir les références avec l'analyse
        const enrichedReferences = this.enrichReferencesFromAnalysis(rawReferences, analysis);
        
        return {
          analysis,
          references: enrichedReferences
        };
      }
    } catch (error: any) {
      console.error('Erreur analyse références GPT-4o:', error);
      // En cas d'erreur, retourner les références brutes
      return {
        analysis: "Erreur lors de l'analyse des références.",
        references: this.extractReferences(perplexityReport)
      };
    }
  }

  private async callGPT4ViaFirebase(prompt: string): Promise<string> {
    const { analyzeReferencesWithGPT4ViaFunction } = await import('@/lib/firebase-functions');
    return await analyzeReferencesWithGPT4ViaFunction(prompt);
  }

  private enrichReferencesFromAnalysis(references: any[], analysis: string): any[] {
    // Enrichir les références avec les informations extraites de l'analyse
    // Cette méthode pourrait parser l'analyse GPT-4o pour extraire des métadonnées supplémentaires
    return references.map(ref => ({
      ...ref,
      analyzed: true
    }));
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

  // Analyser une image avec o3
  private async analyzeImageWithO3(imageBase64: string, imageType: string = 'medical'): Promise<string> {
    const imageTypePrompts = {
      medical: "Analyse cette image médicale (radiographie, IRM, scanner, échographie, etc.) et décris précisément ce que tu observes.",
      biology: "Analyse ces résultats biologiques et identifie les valeurs anormales, en les comparant aux valeurs de référence.",
      ecg: "Analyse cet ECG : rythme, fréquence, intervalles, anomalies éventuelles.",
      other: "Analyse cette image clinique et décris ce que tu observes de pertinent."
    };

    const prompt = `${imageTypePrompts[imageType as keyof typeof imageTypePrompts] || imageTypePrompts.other}
    
    Sois précis et méthodique. Liste toutes les anomalies observées et leur signification clinique potentielle.`;

    try {
      if (this.useFirebaseFunctions) {
        console.log('Analyse d\'image avec o3 via Firebase Functions...');
        return await analyzeImageWithO3ViaFunction(prompt, imageBase64);
      } else {
        // Mode développement - appel direct
        console.log('Analyse d\'image avec o3 (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/responses',
          {
            model: 'o3-2025-04-16',
            reasoning: { 
              effort: 'high'
            },
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
            ],
            max_output_tokens: 5000
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Gérer la réponse
        let outputText = '';
        
        if (response.data.output_text) {
          outputText = response.data.output_text;
        } else if (response.data.output && Array.isArray(response.data.output) && response.data.output[0]?.text) {
          outputText = response.data.output[0].text;
        } else {
          throw new Error('Format de réponse non reconnu');
        }
        
        return outputText;
      }
    } catch (error: any) {
      console.error('Erreur analyse image o3:', error);
      throw new Error('Erreur lors de l\'analyse de l\'image: ' + error.message);
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      if (this.useFirebaseFunctions) {
        console.log('Transcription audio via Firebase Functions...');
        
        // Convertir le blob en base64
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
        
        return await transcribeAudioViaFunction(audioBase64);
      } else {
        // Mode développement - appel direct
        if (!this.openaiApiKey) {
          throw new Error('Clé API OpenAI non configurée');
        }
        
        console.log('Transcription audio directe (mode dev)...');
        
        // Créer un FormData pour envoyer le fichier audio
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'gpt-4o-transcribe');
        formData.append('language', 'fr');
        formData.append('prompt', 'Transcription d\'un cas clinique médical en français avec termes médicaux.');

        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        return response.data.text || '';
      }
    } catch (error: any) {
      console.error('Erreur de transcription:', error);
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
} 