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
              content: 'Tu es un assistant médical expert. Fais une recherche académique exhaustive sur le cas clinique fourni. INSTRUCTIONS IMPORTANTES: 1) Concentre-toi UNIQUEMENT sur les publications médicales datant de moins de 5 ans (2020-2025), les guidelines récentes et les études cliniques actuelles. 2) Pour CHAQUE affirmation, cite OBLIGATOIREMENT la source avec [1], [2], etc. 3) Fournis l\'URL complète de chaque source citée. 4) Structure ta réponse de manière claire avec des sections bien définies.'
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
    try {
      const prompt = `Cas clinique: ${clinicalCase}

${perplexityDataProcessed}

Analyse ce cas clinique en utilisant EXACTEMENT ce format avec ces 7 sections OBLIGATOIRES. IMPORTANT: Commence chaque section par "## SECTION_NAME:" sur une nouvelle ligne.

## CLINICAL_CONTEXT:
Résume le contexte clinique du patient.

## KEY_DATA:
Identifie les données clés importantes du cas.

## DIAGNOSTIC_HYPOTHESES:
Liste les hypothèses diagnostiques principales et différentielles.

## COMPLEMENTARY_EXAMS:
Recommande les examens complémentaires nécessaires.

## THERAPEUTIC_DECISIONS:
Propose les décisions thérapeutiques appropriées.

## PROGNOSIS_FOLLOWUP:
Évalue le pronostic et le plan de suivi.

## PATIENT_EXPLANATIONS:
Formule les explications à donner au patient.

RÈGLES IMPÉRATIVES:
1. Utilise EXACTEMENT le format "## SECTION_NAME:" pour chaque section
2. NE PAS numéroter les sections (pas de "1.", "2.", etc.)
3. Cite TOUTES les références avec [1], [2], etc.
4. Si des images sont mentionnées, intègre leurs résultats dans les sections appropriées
5. Assure-toi que CHAQUE section est présente et bien formatée`;

      if (this.useFirebaseFunctions) {
        console.log('Analyse avec o3 via Firebase Functions...');
        const { analyzeWithO3ViaFunction } = await import('@/lib/firebase-functions');
        return await analyzeWithO3ViaFunction(prompt);
      } else {
        // Mode développement - appel direct o3
        console.log('Appel API o3 direct (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/responses',
          {
            model: 'o3-2025-04-16',
            prompt: prompt,
            max_output_tokens: 10000,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // L'API Responses retourne la structure correcte
        const outputText = response.data.output[1].content[0].text || '';
        console.log('Réponse o3 dev, usage:', response.data.usage);
        
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
      console.log('Résultat analyse GPT-4o:', referencesAnalysis.analysis?.substring(0, 200) + '...');
      
      // Étape 3 : Analyser les images avec o3 si présentes
      let imageAnalyses = '';
      if (images && images.length > 0) {
        progressCallback?.('Analyse des images médicales avec o3...');
        console.log(`Analyse de ${images.length} images avec o3...`);
        for (let i = 0; i < images.length; i++) {
          try {
            progressCallback?.(`Analyse de l'image ${i + 1}/${images.length}...`);
            const imageAnalysis = await this.analyzeImageWithO3(images[i].base64, images[i].type);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\n${imageAnalysis}`;
          } catch (imageError: any) {
            console.error(`Erreur lors de l'analyse de l'image ${i + 1}:`, imageError.message);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\nErreur lors de l'analyse de cette image.`;
            // Continuer avec les autres images sans bloquer tout le processus
          }
        }
        console.log('Analyse des images terminée (avec erreurs possibles)');
      }

      // Étape 4 : Analyser avec o3 le cas clinique + rapport Perplexity + analyse des liens + images
      progressCallback?.('Analyse médicale complète avec o3...');
      console.log('Début analyse principale avec o3...');
      const completeData = `RAPPORT DE RECHERCHE ACADÉMIQUE:\n${perplexityReport.answer}\n\n` +
                          `ANALYSE DES RÉFÉRENCES ET LIENS:\n${referencesAnalysis.analysis}` +
                          (imageAnalyses ? `\n\nANALYSES D'IMAGERIE:${imageAnalyses}` : '');
      
      console.log('Longueur des données complètes:', completeData.length);
      const fullAnalysis = await this.analyzeWithO3(completeData, caseText);
      console.log('Analyse o3 terminée');
      console.log('Longueur réponse o3:', fullAnalysis?.length || 0);
      console.log('Début réponse o3:', fullAnalysis?.substring(0, 500) || 'RÉPONSE VIDE');
      
      // Étape 5 : Parser la réponse pour extraire les sections
      console.log('Parsing des sections...');
      const sections = this.parseSections(fullAnalysis);
      console.log('Sections parsées:', sections.length);
      console.log('Sections trouvées:', sections.map(s => s.type).join(', '));
      
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
    console.log('parseSections - Analyse reçue:', analysis ? `${analysis.length} caractères` : 'VIDE');
    
    if (!analysis || analysis.trim().length === 0) {
      console.error('parseSections - Analyse vide ou invalide');
      return [];
    }
    
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
    
    // Nouvelle approche : chercher le pattern exact "## SECTION_NAME:"
    for (let i = 0; i < sectionTypes.length; i++) {
      const currentType = sectionTypes[i];
      const nextType = sectionTypes[i + 1];
      
      // Pattern principal pour le nouveau format
      const sectionPattern = new RegExp(
        `##\\s*${currentType}\\s*:\\s*\\n([\\s\\S]*?)(?=##\\s*${nextType || '$'}|$)`, 
        'i'
      );
      
      const match = analysis.match(sectionPattern);
      
      if (match && match[1]) {
        const content = match[1].trim();
        console.log(`Section ${currentType} trouvée, longueur: ${content.length}`);
        
        sections.push({
          type: currentType,
          content: content
        });
      } else {
        console.warn(`Section ${currentType} non trouvée avec le pattern principal`);
        
        // Patterns de fallback
        const fallbackPatterns = [
          new RegExp(`${currentType}\\s*:\\s*\\n([\\s\\S]*?)(?=${nextType || '$'}|##)`, 'i'),
          new RegExp(`\\b${currentType}\\b[\\s:]*\\n([\\s\\S]*?)(?=\\b${nextType || '$'}\\b|##|$)`, 'i')
        ];
        
        let found = false;
        for (const pattern of fallbackPatterns) {
          const fallbackMatch = analysis.match(pattern);
          if (fallbackMatch && fallbackMatch[1]) {
            const content = fallbackMatch[1].trim();
            console.log(`Section ${currentType} trouvée avec pattern de fallback, longueur: ${content.length}`);
            
            sections.push({
              type: currentType,
              content: content
            });
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.error(`Section ${currentType} introuvable dans l'analyse`);
          // Ajouter une section vide pour maintenir la structure
          sections.push({
            type: currentType,
            content: 'Section non disponible dans l\'analyse.'
          });
        }
      }
    }
    
    console.log(`Nombre total de sections parsées: ${sections.length}`);
    console.log('Sections avec contenu:', sections.filter(s => s.content && s.content.length > 50).length);
    
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
      const prompt = `Analyse ces références et liens issus d'une recherche médicale. Pour chaque référence, structure EXACTEMENT selon ce format :

RAPPORT DE RECHERCHE:
${perplexityReport.answer}

RÉFÉRENCES À ANALYSER:
${rawReferences.map((ref, i) => `[${ref.label}] ${ref.url}`).join('\n')}

FORMAT DE RÉPONSE OBLIGATOIRE pour chaque référence :

[1] "Titre complet de l'article"
Auteurs: Nom A, Nom B, et al.
Journal: Nom du journal, année
Points clés: 
- Point important 1
- Point important 2
Pertinence: Haute/Moyenne/Faible - Explication

[2] "Titre du deuxième article"
Auteurs: ...
(même format)

IMPORTANT:
- Commence chaque référence par son numéro entre crochets [1], [2], etc.
- Mets le titre entre guillemets
- Si une information n'est pas disponible, écris "Non disponible"
- Résume en 2-3 points clés maximum par référence
- Évalue la pertinence pour ce cas clinique spécifique`;

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
    // Enrichir les références avec les informations extraites de l'analyse GPT-4o
    const enrichedRefs = [...references];
    
    // Pour chaque référence, essayer d'extraire plus d'infos depuis l'analyse structurée
    enrichedRefs.forEach((ref, index) => {
      // Pattern pour trouver le bloc de cette référence dans l'analyse
      const refBlockPattern = new RegExp(
        `\\[${ref.label}\\]\\s*"([^"]+)"[\\s\\S]*?(?=\\[\\d+\\]|$)`, 
        'i'
      );
      const blockMatch = analysis.match(refBlockPattern);
      
      if (blockMatch) {
        // Extraire le titre depuis les guillemets
        if (blockMatch[1]) {
          ref.title = blockMatch[1];
        }
        
        const blockContent = blockMatch[0];
        
        // Extraire les auteurs
        const authorsMatch = blockContent.match(/Auteurs?:\s*([^\n]+)/i);
        if (authorsMatch && authorsMatch[1] !== 'Non disponible') {
          ref.authors = authorsMatch[1].trim();
        }
        
        // Extraire le journal et l'année
        const journalMatch = blockContent.match(/Journal:\s*([^,\n]+)(?:,\s*(\d{4}))?/i);
        if (journalMatch) {
          if (journalMatch[1] && journalMatch[1] !== 'Non disponible') {
            ref.journal = journalMatch[1].trim();
          }
          if (journalMatch[2]) {
            ref.year = parseInt(journalMatch[2]);
          }
        }
        
        // Extraire les points clés
        const pointsMatch = blockContent.match(/Points? clés?:\s*([^\n]+(?:\n\s*-[^\n]+)*)/i);
        if (pointsMatch) {
          ref.keyPoints = pointsMatch[1].trim();
        }
        
        // Extraire la pertinence
        const pertinenceMatch = blockContent.match(/Pertinence:\s*([^\n]+)/i);
        if (pertinenceMatch) {
          ref.relevance = pertinenceMatch[1].trim();
        }
      }
      
      ref.analyzed = true;
    });
    
    console.log('Références enrichies:', enrichedRefs);
    return enrichedRefs;
  }

  private extractReferences(perplexityReport: PerplexityResponse): any[] {
    const references: any[] = [];
    console.log('Extraction des références...');

    // D'abord essayer d'extraire depuis la section Sources du texte
    const sourcesMatch = perplexityReport.answer.match(/###\s*\*?\*?Sources?\*?\*?:?\s*\n([\s\S]*?)(?=###|$)/i);
    
    if (sourcesMatch) {
      // Pattern pour extraire chaque source de la section Sources
      const sourcePattern = /\[(\d+)\]\s*(?:\[([^\]]+)\])?\s*\(([^)]+)\)/g;
      let match;
      
      while ((match = sourcePattern.exec(sourcesMatch[1])) !== null) {
        const num = match[1];
        const title = match[2] || `Source ${num}`;
        const url = match[3];
        
        references.push({
          label: num,
          title: title.trim(),
          url: url.trim(),
          authors: '',
          year: null,
          journal: ''
        });
      }
    }
    
    // Si on n'a pas trouvé de section Sources, chercher les citations inline
    if (references.length === 0 && perplexityReport.answer) {
      // Extraire tous les numéros de citation utilisés dans le texte
      const citationNumbersRegex = /\[(\d+)\]/g;
      const citationNumbers = new Set<string>();
      let match;
      
      while ((match = citationNumbersRegex.exec(perplexityReport.answer)) !== null) {
        citationNumbers.add(match[1]);
      }
      
      // Pour chaque numéro, créer une référence
      Array.from(citationNumbers).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
        references.push({
          label: num,
          title: `Source ${num}`,
          url: '#',
          authors: '',
          year: null,
          journal: ''
        });
      });
    }
    
    // Si on a des citations dans le format API Perplexity
    if (perplexityReport.citations && Array.isArray(perplexityReport.citations)) {
      perplexityReport.citations.forEach((citation: any, index: number) => {
        const refIndex = references.findIndex(ref => ref.label === String(index + 1));
        
        if (typeof citation === 'string') {
          // URL simple
          if (refIndex >= 0) {
            references[refIndex].url = citation;
          } else {
            references.push({
              label: String(index + 1),
              title: `Source ${index + 1}`,
              url: citation,
              authors: '',
              year: null,
              journal: ''
            });
          }
        } else if (typeof citation === 'object' && citation !== null) {
          // Objet structuré
          const newRef = {
            label: String(index + 1),
            title: citation.title || citation.name || citation.text || `Source ${index + 1}`,
            url: citation.url || citation.link || '#',
            authors: citation.authors?.join?.(', ') || citation.author || '',
            year: citation.year || null,
            journal: citation.journal || citation.source || ''
          };
          
          if (refIndex >= 0) {
            references[refIndex] = { ...references[refIndex], ...newRef };
          } else {
            references.push(newRef);
          }
        }
      });
    }
    
    console.log(`${references.length} références extraites`);
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
        // Mode développement - utiliser GPT-4o pour les images (o3 ne supporte pas encore)
        console.log('Analyse d\'image avec GPT-4o (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, '')}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 5000,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const outputText = response.data.choices?.[0]?.message?.content || '';
        console.log('Réponse GPT-4o Vision dev, usage:', response.data.usage);
        
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
        // Mode développement - appel direct SIMPLIFIÉ
        if (!this.openaiApiKey) {
          throw new Error('Clé API OpenAI non configurée');
        }
        
        console.log('Transcription audio simplifiée...');
        
        // Simple FormData avec les paramètres essentiels
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1'); // Utiliser whisper-1 (plus robuste)
        formData.append('language', 'fr');
        
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



  // Recherche de maladies rares avec sonar-deep-research
  async searchRareDiseases(
    clinicalCase: string, 
    o3Analysis: string,
    progressCallback?: (message: string) => void
  ): Promise<{ disease: string, report: string, references: any[] }> {
    if (!this.perplexityApiKey) {
      throw new Error('Clé API Perplexity non configurée');
    }

    progressCallback?.('Recherche de maladies rares avec Perplexity Deep Research...');
    
    const prompt = `En te basant sur ce cas clinique et cette analyse médicale, recherche spécifiquement les MALADIES RARES qui pourraient correspondre aux symptômes et données présentés.

CAS CLINIQUE INITIAL:
${clinicalCase}

ANALYSE MÉDICALE:
${o3Analysis}

INSTRUCTIONS SPÉCIFIQUES:
1. Identifie UNIQUEMENT des maladies rares (prévalence < 1/2000)
2. Pour chaque maladie rare identifiée, fournis :
   - Nom de la maladie (avec code ORPHA si disponible)
   - Prévalence exacte
   - Critères diagnostiques qui correspondent au cas
   - Examens spécifiques pour confirmer
   - Traitements spécialisés disponibles
   - Centres de référence en France
3. Utilise UNIQUEMENT des sources de moins de 5 ans (2020-2025)
4. Cite OBLIGATOIREMENT chaque affirmation avec [1], [2], etc.
5. Privilégie Orphanet, GeneReviews, ERN (European Reference Networks)

Si aucune maladie rare ne semble correspondre, explique pourquoi et reste sur les diagnostics communs.`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-deep-research',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en maladies rares. Fais une recherche approfondie dans les bases de données spécialisées (Orphanet, OMIM, GeneReviews) pour identifier des maladies rares correspondant au cas présenté. Cite toutes tes sources.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 8000,
          search_domain_filter: ['orphanet.org', 'omim.org', 'ncbi.nlm.nih.gov', 'genereviews.org', 'ern-net.eu'],
          search_recency_filter: 'month',
          return_citations: true,
          return_images: false,
          search_recency_days: 1825 // 5 ans
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Réponse Perplexity Deep Research complète:', response.data);
      
      const perplexityReport = {
        answer: response.data.choices?.[0]?.message?.content || '',
        citations: response.data.citations || []
      };

      // Nettoyer le contenu en retirant les balises <think>...</think>
      perplexityReport.answer = perplexityReport.answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // Extraire et analyser les références
      const references = this.extractReferences(perplexityReport);
      
      // Parser le rapport pour identifier la maladie rare principale
      const diseaseMatch = perplexityReport.answer.match(/(?:maladie rare principale|diagnostic principal)[\s:]*([^\n]+)/i);
      const mainDisease = diseaseMatch ? diseaseMatch[1].trim() : 'Analyse des maladies rares';

      progressCallback?.('Analyse des maladies rares terminée');

      return {
        disease: mainDisease,
        report: perplexityReport.answer,
        references: references
      };
    } catch (error: any) {
      console.error('Erreur recherche maladies rares:', error);
      throw new Error('Erreur lors de la recherche de maladies rares: ' + error.message);
    }
  }
} 