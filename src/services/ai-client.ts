import axios from 'axios';
import { isFirebaseConfigured } from '@/lib/firebase';
import { 
  analyzeWithO3ViaFunction, 
  analyzeImageWithO3ViaFunction,
  analyzePerplexityWithGPT4MiniViaFunction,
  transcribeAudioViaFunction,
  enrichReferencesWithWebSearchViaFunction,
  addCitationsToSectionsViaFunction
} from '@/lib/firebase-functions';
import { medGemmaClient } from './medgemma-client';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '@/lib/firebase';

interface PerplexityResponse {
  citations: any[];
  answer: string;
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
}

interface SectionContent {
  type: string;
  content: string;
}

const sectionTitles = {
  CLINICAL_CONTEXT: "1. Contexte clinique",
  KEY_DATA: "2. Données clés",
  DIAGNOSTIC_HYPOTHESES: "3. Hypothèses diagnostiques",
  COMPLEMENTARY_EXAMS: "4. Examens complémentaires recommandés",
  THERAPEUTIC_DECISIONS: "5. Décisions thérapeutiques",
  PROGNOSIS_FOLLOWUP: "6. Pronostic & suivi",
  PATIENT_EXPLANATIONS: "7. Explications au patient"
};

export class AIClientService {
  private perplexityApiKey: string | undefined;
  private openaiApiKey: string | undefined;
  private isProduction: boolean = false;
  private useFirebaseFunctions: boolean = false;

  // Nouveau : stockage de la chaîne de requêtes/réponses
  private requestChain: Array<{
    timestamp: string;
    model: string;
    type: string;
    request: string;
    response: string;
  }> = [];

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

  // Méthode pour récupérer la chaîne de requêtes
  getRequestChain() {
    return [...this.requestChain];
  }

  // Méthode pour réinitialiser la chaîne
  clearRequestChain() {
    this.requestChain = [];
  }

  // Ajouter un élément à la chaîne de requêtes
  addToRequestChain(entry: {
    timestamp: string;
    model: string;
    requestType: string;
    request: string;
    response?: any;
  }) {
    this.requestChain.push({
      timestamp: entry.timestamp,
      model: entry.model,
      type: entry.requestType,
      request: entry.request,
      response: entry.response || ''
    });
  }

  hasApiKeys(): boolean {
    return !!this.perplexityApiKey && !!this.openaiApiKey;
  }

  getOpenAIApiKey(): string | undefined {
    return this.openaiApiKey;
  }

  async searchWithPerplexity(
    clinicalContext: string, 
    medgemmaAnalysis: string = '', 
    o3Analysis: string = ''
  ): Promise<PerplexityResponse> {
    if (!this.perplexityApiKey) {
      throw new Error('Clé API Perplexity non configurée');
    }

    // Construire le prompt structuré pour Perplexity
    const query = `Recherche académique approfondie basée sur ce cas clinique et les analyses fournies:

CAS CLINIQUE:
${clinicalContext}

${medgemmaAnalysis ? `ANALYSE D'IMAGERIE (MedGemma):
${medgemmaAnalysis}

` : ''}${o3Analysis ? `ANALYSE CLINIQUE PRÉLIMINAIRE (o3):
${o3Analysis}

` : ''}INSTRUCTIONS IMPORTANTES:
1. Fais une recherche académique exhaustive sur ce cas clinique
2. Concentre-toi sur les publications médicales récentes (2020-2025), guidelines et études cliniques
3. Structure ta réponse EXACTEMENT selon ces 7 sections avec ce format précis :

## CLINICAL_CONTEXT:
[Contexte clinique enrichi par la recherche académique - inclure les données épidémiologiques récentes, prévalence, facteurs de risque selon la littérature]

## KEY_DATA:
[Données clés validées par la littérature - critères diagnostiques actuels, biomarqueurs, signes pathognomoniques selon les guidelines récentes]

## DIAGNOSTIC_HYPOTHESES:
[Hypothèses diagnostiques appuyées par la recherche - diagnostics différentiels avec références aux études récentes, scores diagnostiques validés]

## COMPLEMENTARY_EXAMS:
[Examens recommandés selon les guidelines actuelles - protocoles d'imagerie, analyses biologiques, examens spécialisés avec niveaux de preuve]

## THERAPEUTIC_DECISIONS:
[Décisions thérapeutiques evidence-based - recommandations HAS/ESC/AHA récentes, protocoles thérapeutiques, nouveaux traitements disponibles]

## PROGNOSIS_FOLLOWUP:
[Pronostic et suivi selon la littérature - études de cohorte récentes, facteurs pronostiques, protocoles de surveillance]

## PATIENT_EXPLANATIONS:
[Explications patient basées sur les guidelines - informations validées scientifiquement, ressources éducatives recommandées]

4. Pour CHAQUE affirmation, cite la source avec [1], [2], etc.
5. Base-toi sur des sources académiques fiables (PubMed, Cochrane, guidelines officielles)
6. Fournis des informations evidence-based et actualisées
7. RESPECTE EXACTEMENT le format de sections avec "## SECTION_NAME:"`;

    const requestData = {
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
          content: 'Tu es un assistant médical expert. Fournis des informations médicales précises et actualisées basées sur la littérature scientifique récente. Cite toujours tes sources avec [1], [2], etc. Structure ta réponse selon le format demandé.'
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
    };

    try {
      // Sauvegarder la requête
      this.requestChain.push({
        timestamp: new Date().toISOString(),
        model: 'Perplexity sonar-reasoning-pro',
        type: 'Recherche académique',
        request: JSON.stringify(requestData, null, 2),
        response: '' // Sera mis à jour après la réponse
      });

      // Utiliser l'API Perplexity directement sans proxy (ils supportent CORS)
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Réponse Perplexity complète:', response.data);

      // Sauvegarder la réponse
      this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);

      // Extraire la réponse et les citations
      const messageContent = response.data.choices[0].message.content;
      
      // Nettoyer le contenu en retirant les balises <think>...</think>
      const cleanContent = messageContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      // Récupérer les données de recherche
      const citations = response.data.citations || [];
      const search_results = response.data.search_results || [];
      
      console.log('Citations Perplexity:', citations);
      console.log('Search Results Perplexity:', search_results);
      
      // Créer un mapping entre les citations et search_results
      const enhancedSearchResults = search_results.map((result: any, index: number) => {
        return {
          ...result,
          citation_index: index,
          url: result.url || (citations[index] ? citations[index] : '')
        };
      });

      return {
        answer: cleanContent,
        citations: citations,
        search_results: enhancedSearchResults.length > 0 ? enhancedSearchResults : search_results
      };
    } catch (error: any) {
      console.error('Erreur Perplexity détaillée:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        throw new Error('Erreur de configuration Perplexity. Vérifiez votre clé API.');
      }
      throw new Error('Erreur lors de la recherche Perplexity: ' + (error.response?.data?.error || error.message));
    }
  }

  private async analyzeWithO3(clinicalContext: string, medgemmaAnalysis: string): Promise<{ analysis: string }> {
    try {
      const prompt = `Tu es un expert médical. Analyse ce cas clinique de manière approfondie.

CAS CLINIQUE:
${clinicalContext}

${medgemmaAnalysis ? `ANALYSE D'IMAGERIE (MedGemma):
${medgemmaAnalysis}

` : ''}

INSTRUCTIONS:
1. Rédige une analyse clinique complète et structurée
2. Utilise OBLIGATOIREMENT le format exact ci-dessous pour chaque section
3. NE PAS ajouter de références [1], [2], etc. dans cette analyse
4. Reste factuel et basé sur les données cliniques fournies

FORMAT OBLIGATOIRE (respecte EXACTEMENT cette structure):

## CLINICAL_CONTEXT:
[Écris ici le résumé du contexte clinique en un paragraphe continu]

## KEY_DATA:
[Liste ici les données clés sous forme de points bullet avec - ]

## DIAGNOSTIC_HYPOTHESES:
[Liste les hypothèses diagnostiques principales et différentielles]

## COMPLEMENTARY_EXAMS:
[Recommande les examens complémentaires nécessaires]

## THERAPEUTIC_DECISIONS:
[Propose les décisions thérapeutiques appropriées]

## PROGNOSIS_FOLLOWUP:
[Évalue le pronostic et le plan de suivi]

## PATIENT_EXPLANATIONS:
[Formule les explications claires pour le patient]

RAPPELS IMPORTANTS:
- Commence TOUJOURS chaque section par "## SECTION_NAME:" exactement
- NE JAMAIS numéroter les sections (pas de "1.", "2.", etc.)
- Intègre les résultats d'imagerie dans les sections appropriées
- Place les références [X] UNIQUEMENT à côté des informations qu'elles supportent vraiment
- Évite les doubles sauts de ligne inutiles
- Reste concis et structuré`;

      // Sauvegarder la requête
      this.requestChain.push({
        timestamp: new Date().toISOString(),
        model: 'OpenAI o3',
        type: 'Analyse clinique complète',
        request: prompt,
        response: ''
      });

      if (this.useFirebaseFunctions) {
        console.log('Analyse avec o3 via Firebase Functions...');
        const { analyzeWithO3ViaFunction } = await import('@/lib/firebase-functions');
        const response = await analyzeWithO3ViaFunction(prompt);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = response;
        
        return { analysis: response };
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
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);
        
        return { analysis: outputText };
      }
    } catch (error: any) {
      console.error('Erreur OpenAI détaillée:', error);
      throw new Error('Erreur lors de l\'analyse OpenAI: ' + error.message);
    }
  }

  async analyzeClinicalCase(
    images: File[], 
    clinicalContext: string,
    promptType: string = 'general',
    onSectionUpdate?: (section: any) => void
  ): Promise<any> {
    try {
      const startTime = Date.now();
      console.log('🚀 Début de l\'analyse du cas clinique');
      console.log(`📋 Contexte clinique: ${clinicalContext.substring(0, 100)}...`);
      console.log(`🖼️ Nombre d\'images: ${images.length}`);
      console.log(`🎯 Type de prompt: ${promptType}`);

      // 1. Analyse des images avec MedGemma
      console.log('\n📸 1. Analyse des images avec MedGemma...');
      let imageAnalyses: string[] = [];
      
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          console.log(`Analyse de l'image ${i + 1}/${images.length}...`);
          
          // Convertir File en base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]); // Retirer le préfixe data:image/...;base64,
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(images[i]);
          const base64Data = await base64Promise;
          
          // Analyser l'image avec MedGemma
          const imageAnalysis = await this.analyzeImageWithO3(base64Data, 'medical', promptType);
          imageAnalyses.push(imageAnalysis);
        }
      }
      
      const medgemmaResult = {
        analysis: imageAnalyses.join('\n\n'),
        imageAnalyses: imageAnalyses
      };
      console.log('✅ Analyse MedGemma terminée');

      // 2. Analyse clinique avec o3
      console.log('\n🔬 2. Analyse clinique avec o3...');
      const o3Result = await this.analyzeWithO3(clinicalContext, medgemmaResult.analysis);
      console.log('✅ Analyse o3 terminée');

      // 3. Recherche académique avec Perplexity
      console.log('\n📚 3. Recherche académique avec Perplexity...');
      const perplexityResult = await this.searchWithPerplexity(
        clinicalContext, 
        medgemmaResult.analysis,
        o3Result.analysis
      );
      console.log('✅ Recherche Perplexity terminée');
      console.log(`📊 Nombre de sources trouvées: ${perplexityResult.search_results?.length || 0}`);

      // 4. Parser les sections et extraire les références
      console.log('\n📝 4. Parsing des sections et extraction des références...');
      const parsedSections = this.parseSections(perplexityResult.answer);
      console.log(`✅ ${parsedSections.length} sections parsées`);
      
      // Appeler le callback pour chaque section (une seule fois)
      if (onSectionUpdate) {
        parsedSections.forEach(section => {
          onSectionUpdate(section);
        });
      }

      // Extraire TOUTES les références de search_results
      const references = this.extractAllReferences(perplexityResult);
      console.log(`✅ ${references.length} références extraites`);

      // 5. Enrichir les références avec Web Search (auteurs et journal uniquement)
      console.log('\n🔍 5. Enrichissement des références avec Web Search...');
      let enrichedReferences = references;
      let webSearchLogs: any[] = [];
      
      try {
        const functions = getFunctions(app);
        const enrichReferencesWithWebSearch = httpsCallable(functions, 'enrichReferencesWithWebSearch');
        const enrichResult = await enrichReferencesWithWebSearch({ 
          references,
          perplexityContent: perplexityResult.answer 
        });
        
        if (enrichResult.data) {
          const enrichData = enrichResult.data as any;
          enrichedReferences = enrichData.references || references;
          webSearchLogs = enrichData.webSearchLogs || [];
          console.log('✅ Références enrichies avec Web Search:', enrichedReferences.length);
          console.log('📊 Logs Web Search:', webSearchLogs);
        }
      } catch (enrichError) {
        console.error('❌ Erreur enrichissement Web Search:', enrichError);
        // Continuer avec les références non enrichies
      }

      // 6. Retourner le résultat final avec les sections de Perplexity
      const finalResult = {
        medgemmaAnalysis: medgemmaResult,
        o3Analysis: o3Result,
        perplexityAnalysis: perplexityResult,
        sections: parsedSections, // Les sections de Perplexity avec leurs [XX]
        references: enrichedReferences,
        webSearchLogs,
        metadata: {
          totalProcessingTime: Date.now() - startTime,
          sectionsSource: 'perplexity', // Toujours Perplexity maintenant
          referencesCount: enrichedReferences.length,
          webSearchEnriched: webSearchLogs.filter((l: any) => l.enrichmentSuccess).length
        }
      };

      console.log('\n✅ Analyse complète terminée');
      console.log('📊 Métadonnées finales:', finalResult.metadata);
      
      return finalResult;

    } catch (error: any) {
      console.error('❌ Erreur analyse cas clinique:', error);
      throw error;
    }
  }

  // Nouvelle méthode simplifiée pour o3 sans références
  private async analyzeWithO3Simple(clinicalCase: string): Promise<string> {
    try {
      const prompt = `Tu es un expert médical. Analyse ce cas clinique de manière approfondie.

CAS CLINIQUE:
${clinicalCase}

INSTRUCTIONS:
1. Rédige une analyse clinique complète et structurée
2. Utilise OBLIGATOIREMENT le format exact ci-dessous pour chaque section
3. NE PAS ajouter de références [1], [2], etc. dans cette analyse
4. Reste factuel et basé sur les données cliniques fournies

FORMAT OBLIGATOIRE (respecte EXACTEMENT cette structure):

## CLINICAL_CONTEXT:
[Résume le contexte clinique en détail]

## KEY_DATA:
[Liste les données clés sous forme de points bullet avec - ]

## DIAGNOSTIC_HYPOTHESES:
[Liste et argumente les hypothèses diagnostiques principales et différentielles]

## COMPLEMENTARY_EXAMS:
[Recommande les examens complémentaires nécessaires avec justification]

## THERAPEUTIC_DECISIONS:
[Propose les décisions thérapeutiques appropriées]

## PROGNOSIS_FOLLOWUP:
[Évalue le pronostic et le plan de suivi]

## PATIENT_EXPLANATIONS:
[Formule les explications claires pour le patient]

RAPPELS IMPORTANTS:
- Commence TOUJOURS chaque section par "## SECTION_NAME:" exactement
- NE JAMAIS numéroter les sections
- Intègre les résultats d'imagerie dans les sections appropriées
- Reste concis et structuré`;

      // Sauvegarder la requête
      this.requestChain.push({
        timestamp: new Date().toISOString(),
        model: 'OpenAI o3',
        type: 'Analyse clinique initiale',
        request: prompt,
        response: ''
      });

      if (this.useFirebaseFunctions) {
        console.log('Analyse avec o3 via Firebase Functions...');
        const { analyzeWithO3ViaFunction } = await import('@/lib/firebase-functions');
        const response = await analyzeWithO3ViaFunction(prompt);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = response;
        
        return response;
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

        const outputText = response.data.output[1].content[0].text || '';
        console.log('Réponse o3 dev, usage:', response.data.usage);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);
        
        return outputText;
      }
    } catch (error: any) {
      console.error('Erreur OpenAI détaillée:', error);
      throw new Error('Erreur lors de l\'analyse OpenAI: ' + error.message);
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
      const rawReferences = await this.extractReferences(perplexityReport);
      
      // Si pas de références, retourner vide
      if (rawReferences.length === 0) {
        return {
          analysis: "Aucune référence trouvée dans le rapport.",
          references: []
        };
      }
      
      // Préparer le prompt pour GPT-4o
      const prompt = `Analyse ces références médicales issues de Perplexity. IMPORTANT: Les titres et URLs sont DÉJÀ fournis ci-dessous, utilise-les directement.

RAPPORT DE RECHERCHE PERPLEXITY:
${perplexityReport.answer}

RÉFÉRENCES FOURNIES PAR PERPLEXITY:
${rawReferences.map((ref, i) => {
  let refLine = `[${ref.label}] `;
  if (ref.title && ref.title !== `Source ${ref.label}`) {
    refLine += `TITRE: "${ref.title}" `;
  }
  refLine += `URL: ${ref.url}`;
  if (ref.date) {
    refLine += ` DATE: ${ref.date}`;
  }
  return refLine;
}).join('\n')}

INSTRUCTIONS POUR L'ANALYSE:
Pour chaque référence ci-dessus, formate EXACTEMENT selon ce modèle:

[1] "Utilise le titre fourni ci-dessus"
URL: Reprends l'URL fournie
Auteurs: Extrais depuis l'URL si possible (ex: PMC -> chercher les auteurs typiques)
Journal: Déduis depuis l'URL (ex: PMC -> journal médical, Orphanet -> base de données maladies rares)
Année: Utilise la date fournie ou déduis depuis l'URL si possible
Points clés: 
- Résume le lien avec le cas clinique
- Point pertinent extrait du rapport Perplexity
Pertinence: Haute/Moyenne/Faible - Justification basée sur le cas

RÈGLES IMPORTANTES:
1. NE JAMAIS écrire "Non disponible" pour le titre ou l'URL car ils sont fournis
2. Utilise EXACTEMENT les titres fournis entre guillemets
3. Pour les auteurs/journal, déduis depuis l'URL si pas d'info (ex: pmc.ncbi.nlm.nih.gov = article PMC)
4. Base tes points clés sur le contenu du rapport Perplexity
5. Évalue la pertinence en fonction du cas clinique analysé`;

      // Sauvegarder la requête
      this.requestChain.push({
        timestamp: new Date().toISOString(),
        model: 'GPT-4o',
        type: 'Analyse des références',
        request: prompt,
        response: ''
      });

      if (this.useFirebaseFunctions) {
        console.log('Analyse des références avec GPT-4o via Firebase Functions...');
        // TODO: Créer une fonction Firebase pour GPT-4o
        const analysis = await this.callGPT4ViaFirebase(prompt);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = analysis;
        
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
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);
        
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
        references: await this.extractReferences(perplexityReport)
      };
    }
  }

  private async callGPT4ViaFirebase(prompt: string): Promise<string> {
    const { analyzeReferencesWithGPT4ViaFunction } = await import('@/lib/firebase-functions');
    return await analyzeReferencesWithGPT4ViaFunction(prompt);
  }

  private async analyzePerplexityResults(perplexityReport: PerplexityResponse): Promise<any[]> {
    try {
      console.log('Analyse avancée des résultats Perplexity...');
      
      if (this.useFirebaseFunctions) {
        console.log('Utilisation de Firebase Functions pour analyser Perplexity...');
        const { analyzePerplexityViaFunction } = await import('@/lib/firebase-functions');
        
        try {
          const result = await analyzePerplexityViaFunction(JSON.stringify(perplexityReport));
          console.log('Analyse Perplexity terminée via Firebase Functions');
          
          // Enrichir avec Web Search si possible
          if (result.references && result.references.length > 0) {
            console.log('Enrichissement avec Web Search...');
            const enrichedRefs = await this.enrichReferencesWithWebSearch(result.references, perplexityReport.answer);
            return enrichedRefs;
          }
          
          return result.references || [];
        } catch (error: any) {
          console.error('Erreur analyse Perplexity via Firebase:', error);
          // Fallback vers l'ancienne méthode
          return await this.extractReferences(perplexityReport);
        }
      } else {
        // Mode développement - extraire puis enrichir avec Web Search
        console.log('Mode développement - extraction puis enrichissement Web Search');
        
        // D'abord extraire les références de base
        const baseReferences = await this.extractReferences(perplexityReport);
        
        if (baseReferences.length === 0) {
          console.log('Aucune référence trouvée');
          return [];
        }
        
        // Ensuite enrichir avec Web Search
        console.log('Enrichissement avec GPT-4o mini Web Search...');
        const enrichedReferences = await this.enrichReferencesWithWebSearch(baseReferences, perplexityReport.answer);
        
        return enrichedReferences;
      }
    } catch (error: any) {
      console.error('Erreur analyse Perplexity:', error);
      // Fallback vers l'ancienne méthode
      return await this.extractReferences(perplexityReport);
    }
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

  private extractAllReferences(perplexityReport: PerplexityResponse): any[] {
    console.log('Extraction de TOUTES les références de search_results...');
    
    if (!perplexityReport.search_results || perplexityReport.search_results.length === 0) {
      console.log('Aucune search_results trouvée');
      return [];
    }
    
    const references = perplexityReport.search_results.map((result, index) => {
      const refNumber = index + 1;
      return {
        label: refNumber.toString(),
        title: result.title || `Source ${refNumber}`,
        url: result.url,
        date: result.date || null,
        authors: 'Non disponible',
        journal: 'Non disponible',
        year: result.date ? new Date(result.date).getFullYear().toString() : null,
        webSearchEnriched: false
      };
    });
    
    console.log(`✅ ${references.length} références extraites de search_results`);
    return references;
  }

  private async extractReferences(perplexityReport: PerplexityResponse): Promise<any[]> {
    const references: any[] = [];
    console.log('Extraction des références...');
    console.log('Citations disponibles:', perplexityReport.citations?.length || 0);
    console.log('Search results disponibles:', perplexityReport.search_results?.length || 0);
    console.log('Citations brutes:', JSON.stringify(perplexityReport.citations, null, 2));

    // PRIORITÉ 1: Utiliser les search_results (plus complets que les citations)
    if (perplexityReport.search_results && perplexityReport.search_results.length > 0) {
      console.log('Utilisation des search_results pour créer les références');
      console.log('Search results complets:', JSON.stringify(perplexityReport.search_results, null, 2));
      
      perplexityReport.search_results.forEach((result, index) => {
        // Utiliser DIRECTEMENT les données de Perplexity
        const reference = {
          label: String(index + 1),
          title: result.title || `Source ${index + 1}`, // Titre exact de Perplexity
          url: result.url || '#',
          date: result.date || null, // Date exacte de Perplexity
          year: '',
          authors: 'À enrichir', // Sera enrichi par Web Search
          journal: 'À déterminer', // Sera enrichi par Web Search
          keyPoints: '',
          source: 'perplexity_search_results'
        };
        
        // Si on a une date, extraire l'année
        if (result.date) {
          const yearMatch = result.date.match(/\b(19|20)\d{2}\b/);
          reference.year = yearMatch ? yearMatch[0] : '';
        }
        
        console.log(`Référence ${index + 1} extraite:`, {
          title: reference.title,
          date: reference.date,
          year: reference.year
        });
        
        references.push(reference);
      });
      
      console.log(`${references.length} références extraites avec titres et dates de Perplexity`);
      return references;
    }

    // PRIORITÉ 2: Fallback vers les citations si search_results indisponibles
    if (perplexityReport.citations && perplexityReport.citations.length > 0) {
      console.log('Utilisation des citations comme fallback');
      
      perplexityReport.citations.forEach((citation, index) => {
        const url = typeof citation === 'string' ? citation : citation.url || citation;
        
            references.push({
              label: String(index + 1),
              title: `Source ${index + 1}`,
          url: url,
          date: null,
              year: '',
          authors: 'À enrichir',
          journal: 'À enrichir',
          keyPoints: '',
          source: 'perplexity_citations'
        });
      });
      
      console.log(`${references.length} références extraites depuis citations`);
      return references;
    }

    console.log('Aucune référence trouvée dans Perplexity');
    return references;
  }

  private async enrichReferencesWithGPT4(references: any[]): Promise<any[]> {
    try {
      // Filtrer les références qui ont besoin d'enrichissement
      const needsEnrichment = references.filter(ref => 
        !ref.authors || !ref.year || ref.authors === 'Non disponible'
      );

      if (needsEnrichment.length === 0) {
        console.log('Toutes les références sont déjà complètes');
        return references;
      }

      console.log(`Enrichissement de ${needsEnrichment.length} références incomplètes...`);

      if (this.useFirebaseFunctions) {
        console.log('Utilisation de Firebase Functions pour enrichir les références');
        const { enrichReferencesViaFunction } = await import('@/lib/firebase-functions');
        
        try {
          const enrichedRefs = await enrichReferencesViaFunction(references);
          console.log('Références enrichies via Firebase Functions');
          return enrichedRefs;
        } catch (error: any) {
          console.error('Erreur enrichissement via Firebase:', error);
          // Retourner les références originales en cas d'erreur
          return references;
        }
          } else {
        // Mode développement - appel direct
        const prompt = `Tu es un expert en recherche académique médicale. Analyse ces références et enrichis-les UNIQUEMENT avec des informations que tu peux déduire avec certitude.

RÉFÉRENCES À ANALYSER:
${JSON.stringify(references, null, 2)}

INSTRUCTIONS STRICTES:
1. Pour chaque référence, examine l'URL et le titre pour déduire des informations fiables
2. Ne JAMAIS inventer d'auteurs - si tu ne peux pas les identifier précisément, mets "Non disponible"
3. Pour les années : utilise la date fournie ou celle dans l'URL, sinon null
4. Pour les journaux : déduis uniquement depuis l'URL ou des indices clairs dans le titre
5. SOIS CONSERVATEUR - mieux vaut "Non disponible" qu'une information inventée

RÈGLES SPÉCIFIQUES:
- academic.oup.com : probablement Oxford Academic, mais cherche le journal exact dans l'URL
- semanticscholar.org : pas un journal, c'est un agrégateur
- springer.com : cherche le nom du journal spécifique
- pubmed/pmc : extraire le journal depuis l'URL si possible
- cfp.ca : Canadian Family Physician
- Pour les auteurs : UNIQUEMENT si clairement identifiables dans l'URL ou titre

6. Retourne UNIQUEMENT un tableau JSON valide avec les références enrichies
7. Conserve toutes les propriétés existantes
8. Utilise "Non disponible" au lieu de null pour les champs manquants

IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini-2024-07-18',
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant qui retourne UNIQUEMENT du JSON valide, sans aucun texte supplémentaire. Tu es TRÈS conservateur et ne jamais inventer d\'informations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.1, // Très faible pour éviter l'invention
            response_format: { type: "json_object" }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const responseText = response.data.choices?.[0]?.message?.content || '[]';
        
        try {
          // La réponse pourrait être un objet avec une propriété "references"
          const parsed = JSON.parse(responseText);
          const enrichedRefs = Array.isArray(parsed) ? parsed : (parsed.references || references);
          console.log('Références enrichies localement');
          return enrichedRefs;
        } catch (parseError) {
          console.error('Erreur parsing JSON:', parseError);
          console.error('Réponse brute:', responseText);
    return references;
        }
      }
    } catch (error: any) {
      console.error('Erreur enrichissement références:', error);
      // En cas d'erreur, retourner les références originales
      return references;
    }
  }

  // Méthode pour vérifier et corriger les références dans le texte
  private postProcessReferences(text: string, validReferences: string[]): string {
    // Extraire toutes les références utilisées dans le texte
    const usedRefs = new Set<string>();
    const refPattern = /\[(\d+)\]/g;
    let match;
    
    while ((match = refPattern.exec(text)) !== null) {
      usedRefs.add(match[1]);
    }
    
    // Vérifier si les références utilisées sont valides
    let processedText = text;
    usedRefs.forEach(ref => {
      if (!validReferences.includes(ref)) {
        console.warn(`Référence [${ref}] utilisée mais non trouvée dans les sources Perplexity`);
        // Optionnel : retirer les références invalides
        // processedText = processedText.replace(new RegExp(`\\[${ref}\\]`, 'g'), '');
      }
    });
    
    return processedText;
  }

  // Analyser une image avec medgemma
  private async analyzeImageWithO3(imageBase64: string, imageType: string = 'medical', promptType: string = 'general'): Promise<string> {
    // Sauvegarder la requête
    this.requestChain.push({
      timestamp: new Date().toISOString(),
      model: 'MedGemma',
      type: `Analyse d'image ${imageType} (${promptType})`,
      request: `Analyse d'image médicale de type: ${imageType} avec prompt: ${promptType}\n\n[Image Base64 fournie]`,
      response: ''
    });

    try {
      console.log('=== DÉBUT ANALYSE IMAGE ===');
      console.log('Modèle utilisé: MedGemma (exclusivement)');
      console.log('Type d\'image:', imageType);
      console.log('Type de prompt:', promptType);
      
      // En production, toujours utiliser Firebase Functions qui gère MedGemma
      if (this.useFirebaseFunctions) {
        console.log('Mode: Production - Utilisation de Firebase Functions');
        console.log('Firebase Functions appellera MedGemma pour l\'analyse');
        console.log('Endpoint MedGemma dans Firebase: https://khynx9ujxzvwk5rb.us-east4.gcp.endpoints.huggingface.cloud');
        
        const { analyzeImageWithMedGemmaViaFunction } = await import('@/lib/firebase-functions');
        const response = await analyzeImageWithMedGemmaViaFunction(imageBase64, imageType, promptType);
        
        console.log('=== RÉPONSE REÇUE DE MEDGEMMA VIA FIREBASE ===');
        console.log('Longueur de la réponse:', response.length);
        console.log('Début de la réponse:', response.substring(0, 100) + '...');
        
        this.requestChain[this.requestChain.length - 1].response = response;
        return response;
      } else {
        // Mode développement - vérifier si MedGemma est configuré localement
        if (!medGemmaClient.hasApiKey()) {
          console.log('Mode: Développement - MedGemma non configuré localement');
          console.log('ATTENTION: Fallback sur GPT-4o en mode dev uniquement');
        
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
                      text: 'Analyse cette image médicale en détail.'
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
          this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);
        return outputText;
        } else {
          // Utiliser MedGemma en local
          console.log('Mode: Développement - Utilisation de MedGemma en local');
          console.log('Appel direct à MedGemma...');
          
          const response = await medGemmaClient.analyzeImage(imageBase64, imageType);
          
          console.log('=== RÉPONSE MEDGEMMA LOCALE ===');
          console.log('Longueur de la réponse:', response.length);
          
          // Sauvegarder la réponse
          this.requestChain[this.requestChain.length - 1].response = response;
          
          return response;
        }
      }
      
    } catch (error: any) {
      console.error('=== ERREUR ANALYSE IMAGE ===');
      console.error('Erreur:', error.message);
      
      // Pas de fallback en production - MedGemma uniquement
      throw new Error('Erreur lors de l\'analyse de l\'image: ' + error.message);
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('Début transcription audio...');
      console.log('Type du blob:', audioBlob.type);
      console.log('Taille du blob:', audioBlob.size, 'bytes');
      
      // Si l'audio est trop long (>1MB), utiliser Gemini
      if (audioBlob.size > 1024 * 1024) {
        console.log('Audio volumineux détecté, utilisation de Gemini pour la transcription longue');
        return await this.transcribeLongAudioWithGemini(audioBlob);
      }
      
      if (this.useFirebaseFunctions) {
        console.log('Utilisation de Firebase Functions pour la transcription');
        
        // Convertir le blob en base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            console.log('Base64 généré, début:', base64.substring(0, 100));
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
        
        console.log('Appel direct OpenAI (mode dev)');
        
        // Créer FormData exactement comme dans la documentation
        const formData = new FormData();
        
        // Ajouter le fichier avec un nom correct
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'fr');
        
        console.log('Envoi à OpenAI...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              // Pas besoin de Content-Type, axios le gère automatiquement pour FormData
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );

        console.log('Réponse reçue:', response.status);
        const text = response.data.text || '';
        console.log('Transcription terminée, longueur:', text.length);

        return text;
      }
    } catch (error: any) {
      console.error('Erreur de transcription:', error.response?.data || error.message);
      throw new Error('Erreur lors de la transcription: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  // Nouvelle méthode pour la transcription longue avec Gemini
  async transcribeLongAudioWithGemini(
    audioBlob: Blob, 
    analysisType: 'transcription' | 'medical_consultation' | 'patient_dictation' = 'transcription'
  ): Promise<string> {
    try {
      console.log('=== TRANSCRIPTION LONGUE AVEC GEMINI ===');
      console.log('Taille audio:', (audioBlob.size / (1024 * 1024)).toFixed(2), 'MB');
      console.log('Type d\'analyse:', analysisType);
      
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
      
      if (this.useFirebaseFunctions) {
        console.log('Utilisation de Firebase Functions pour Gemini');
        const { httpsCallable, getFunctions } = await import('firebase/functions');
        const { app } = await import('@/lib/firebase');
        
        const functions = getFunctions(app);
        const analyzeLongAudioWithGemini = httpsCallable(functions, 'analyzeLongAudioWithGemini');
        const audioParts = (audioBlob.type || 'audio/webm').split(';');
        const sanitizedType = audioParts.length >= 2 ? `${audioParts[0]};${audioParts[1]}` : audioParts[0];
        const result = await analyzeLongAudioWithGemini({
          audioBase64,
          audioType: sanitizedType,
          analysisType
        });
        
        const data = result.data as any;
        console.log('Transcription Gemini reçue:', data.metadata);
        
        return data.transcription;
      } else {
        // Mode développement - appel direct à Gemini
        console.log('Appel direct Gemini (mode dev)');
        
        // Pour le dev, on peut utiliser la clé API directement
        const GOOGLE_API_KEY = 'AIzaSyAtV6E_LrLrZln2BfcR8ngomMzhywDvSf_Y';
        
        const base64Data = audioBase64.includes(',') 
          ? audioBase64.split(',')[1] 
          : audioBase64;
        
        let prompt = '';
        switch (analysisType) {
          case 'transcription':
            prompt = 'Génère une transcription complète et précise de cet enregistrement audio en français.';
            break;
          case 'medical_consultation':
            prompt = `Analyse cet enregistrement de consultation médicale et fournis une transcription complète avec identification des éléments médicaux clés.`;
            break;
          case 'patient_dictation':
            prompt = `Transcris cette dictée du patient en extrayant les informations médicales pertinentes.`;
            break;
        }
        
        const mimeParts = (audioBlob.type || 'audio/webm').split(';');
        const mimeType = mimeParts.length >= 2 ? `${mimeParts[0]};${mimeParts[1]}` : mimeParts[0];


        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
          {
            contents: [{
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192
            }
          }
        );
        
        const transcription = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Transcription Gemini terminée, longueur:', transcription.length);
        
        return transcription;
      }
    } catch (error: any) {
      console.error('Erreur transcription Gemini:', error);
      // Fallback vers la méthode standard si Gemini échoue
      console.log('Fallback vers transcription standard');
      return this.transcribeAudio(audioBlob);
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

  // Nouvelle méthode pour l'analyse simple avec o3 seulement
  async simpleAnalysis(
    caseText: string,
    progressCallback?: (message: string) => void,
    images?: { base64: string, type: string }[]
  ): Promise<{ sections: any[], references: any[], perplexityReport?: any, requestChain?: any[], imageAnalyses?: string[] }> {
    this.clearRequestChain();

    try {
      // Étape 1 : Analyser les images si présentes
      let imageAnalyses = '';
      const imageAnalysesArray: string[] = [];
      if (images && images.length > 0) {
        progressCallback?.('Analyse des images médicales...');
        for (let i = 0; i < images.length; i++) {
          try {
            progressCallback?.(`Analyse de l'image ${i + 1}/${images.length}...`);
            const imageAnalysis = await this.analyzeImageWithO3(images[i].base64, images[i].type, (images[i] as any).promptType || 'general');
            imageAnalysesArray.push(imageAnalysis);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\n${imageAnalysis}`;
          } catch (imageError: any) {
            console.error(`Erreur lors de l'analyse de l'image ${i + 1}:`, imageError.message);
            const errorMsg = 'Erreur lors de l\'analyse.';
            imageAnalysesArray.push(errorMsg);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${images[i].type}):\n${errorMsg}`;
          }
        }
      }

      // Étape 2 : Analyse clinique directe avec o3 (sans recherche Perplexity)
      progressCallback?.('Analyse clinique avec o3...');
      
      const analysisPrompt = `CAS CLINIQUE À ANALYSER:
${caseText}

${imageAnalyses ? `ANALYSES D'IMAGERIE:${imageAnalyses}` : ''}

INSTRUCTIONS:
Rédige une analyse clinique structurée SANS références bibliographiques selon ces sections exactes:

1. CONTEXTE CLINIQUE
- Résume le cas présenté

2. DONNÉES CLÉS
- Identifie les éléments cliniques, biologiques et d'imagerie essentiels

3. HYPOTHÈSES DIAGNOSTIQUES
- Liste et argumente les diagnostics principaux et différentiels

4. EXAMENS COMPLÉMENTAIRES RECOMMANDÉS
- Propose les investigations pertinentes

5. DÉCISIONS THÉRAPEUTIQUES
- Détaille la prise en charge immédiate et à moyen terme

6. PRONOSTIC & SUIVI
- Évalue le pronostic et planifie le suivi

7. EXPLICATIONS AU PATIENT
- Rédige une explication claire et adaptée pour le patient

Format de réponse OBLIGATOIRE (respecte exactement cette syntaxe):

## CLINICAL_CONTEXT:
Contenu de la section contexte clinique...

## KEY_DATA:
Contenu de la section données clés...

## DIAGNOSTIC_HYPOTHESES:
Contenu de la section hypothèses diagnostiques...

## COMPLEMENTARY_EXAMS:
Contenu de la section examens complémentaires...

## THERAPEUTIC_DECISIONS:
Contenu de la section décisions thérapeutiques...

## PROGNOSIS_FOLLOWUP:
Contenu de la section pronostic et suivi...

## PATIENT_EXPLANATIONS:
Contenu de la section explications au patient...`;

      const analysisResult = await this.analyzeWithO3(analysisPrompt, '');
      const sections = this.parseSections(analysisResult.analysis);

      // Retourner le résultat sans références
      return {
        sections,
        references: [],
        requestChain: this.requestChain,
        imageAnalyses: imageAnalysesArray.length > 0 ? imageAnalysesArray : undefined
      };
    } catch (error: any) {
      console.error('Erreur analyse simple:', error);
      throw new Error('Erreur lors de l\'analyse simple: ' + error.message);
    }
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

INSTRUCTIONS SPÉCIFIQUES POUR UN RAPPORT COMPLET:
1. Identifie UNIQUEMENT des maladies rares (prévalence < 1/2000)
2. Pour chaque maladie rare identifiée, fournis OBLIGATOIREMENT TOUTES ces sections :
   
   ## Critères diagnostiques
   - Liste complète des critères qui correspondent au cas
   - Critères majeurs et mineurs
   
   ## Examens spécifiques
   - Examens biologiques spécialisés
   - Examens génétiques nécessaires
   - Imagerie spécifique
   
   ## Prise en charge thérapeutique
   - Traitements spécialisés disponibles
   - Protocoles thérapeutiques
   - Essais cliniques en cours
   
   ## Centres de référence en France
   - Nom complet du centre
   - Localisation
   - Coordonnées si disponibles
   
3. Structure ton rapport de manière COMPLÈTE sans couper
4. Utilise autant que possible des sources récentes (2020-2025)
5. Cite chaque affirmation avec [1], [2], etc.
6. Privilégie Orphanet, GeneReviews, ERN

IMPORTANT: Fournis un rapport COMPLET et DÉTAILLÉ. Ne coupe PAS le contenu.`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-deep-research',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en maladies rares. Fais une recherche approfondie dans les bases de données spécialisées (Orphanet, OMIM, GeneReviews) pour identifier des maladies rares correspondant au cas présenté. IMPORTANT: Fournis un rapport COMPLET et DÉTAILLÉ sans couper le contenu. Cite toutes tes sources.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 16000,
          search_domain_filter: ['orphanet.org', 'omim.org', 'ncbi.nlm.nih.gov', 'genereviews.org', 'ern-net.eu'],
          search_recency_filter: 'month',
          return_citations: true,
          return_images: false,
          search_recency_days: 1825
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
      const references = await this.analyzePerplexityResults(perplexityReport);
      
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

  // Méthode pour la REPRISE APPROFONDIE (2 crédits) - refait tout avec o3 puis Perplexity
  async deepAnalysis(
    fullContext: {
      initialCase: string,
      currentCase: string,
      sections: any[],
      perplexityReport: any,
      modifications: any[],
      images?: { base64: string, type: string }[]
    },
    progressCallback?: (message: string) => void,
    sectionCallback?: (section: any, index: number, total: number) => void
  ): Promise<{ sections: any[], references: any[], perplexityReport: any, requestChain?: any[], imageAnalyses?: string[] }> {
    this.clearRequestChain();

    try {
      // Étape 1 : Analyser les nouvelles images si présentes
      let imageAnalyses = '';
      const imageAnalysesArray: string[] = [];
      if (fullContext.images && fullContext.images.length > 0) {
        progressCallback?.('Analyse des images médicales...');
        for (let i = 0; i < fullContext.images.length; i++) {
          try {
            progressCallback?.(`Analyse de l'image ${i + 1}/${fullContext.images.length}...`);
            const imageAnalysis = await this.analyzeImageWithO3(fullContext.images[i].base64, fullContext.images[i].type, (fullContext.images[i] as any).promptType || 'general');
            imageAnalysesArray.push(imageAnalysis);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${fullContext.images[i].type}):\n${imageAnalysis}`;
          } catch (imageError: any) {
            console.error(`Erreur lors de l'analyse de l'image ${i + 1}:`, imageError.message);
            const errorMsg = 'Erreur lors de l\'analyse.';
            imageAnalysesArray.push(errorMsg);
            imageAnalyses += `\n\nANALYSE IMAGE ${i + 1} (${fullContext.images[i].type}):\n${errorMsg}`;
          }
        }
      }

      // Étape 2 : Analyse o3 approfondie avec tout le contexte
      progressCallback?.('Analyse clinique approfondie avec o3...');
      
      let o3Context = `CAS CLINIQUE ENRICHI:
${fullContext.currentCase}

MODIFICATIONS ET INFORMATIONS COMPLÉMENTAIRES:
${fullContext.modifications.map((m: any) => `- ${m.sectionType}: ${m.additionalInfo}`).join('\n')}

ANALYSE PRÉCÉDENTE:
${fullContext.sections.map((s: any) => `${sectionTitles[s.type as keyof typeof sectionTitles]}:\n${s.content}`).join('\n\n')}`;

      if (imageAnalyses) {
        o3Context += `\n\nNOUVELLES ANALYSES D'IMAGERIE:${imageAnalyses}`;
      }
      
      const o3Analysis = await this.analyzeWithO3Simple(o3Context);
      const sections = this.parseSections(o3Analysis);
      
      sections.forEach((section, index) => {
        sectionCallback?.(section, index, sections.length);
      });

      // Étape 3 : Recherche Perplexity exhaustive basée sur la nouvelle analyse o3
      progressCallback?.('Recherche académique exhaustive...');
      
      const deepSearchPrompt = `REPRISE APPROFONDIE - Recherche exhaustive basée sur cette analyse clinique complète:

CAS CLINIQUE INITIAL:
${fullContext.initialCase}

ANALYSE CLINIQUE APPROFONDIE (par o3):
${sections.map(s => `${sectionTitles[s.type as keyof typeof sectionTitles]}:\n${s.content}`).join('\n\n')}

MODIFICATIONS APPORTÉES:
${fullContext.modifications.map((m: any) => `- ${m.sectionType}: ${m.additionalInfo}`).join('\n')}

INSTRUCTIONS POUR LA RECHERCHE APPROFONDIE:
1. Explorer TOUS les diagnostics différentiels mentionnés, même rares
2. Rechercher les dernières avancées thérapeutiques (2023-2025)
3. Identifier les essais cliniques en cours pour les pathologies suspectées
4. Inclure les recommandations internationales récentes
5. Chercher les syndromes et associations pathologiques
6. Valider les examens complémentaires proposés avec les dernières guidelines
7. Citer TOUTES les sources avec [1], [2], etc.`;

      const perplexityReport = await this.searchWithPerplexity(deepSearchPrompt);
      
      // Étape 4 : Extraire et enrichir les références
      progressCallback?.('Analyse avancée des références...');
      const references = await this.analyzePerplexityResults(perplexityReport);
      
      return {
        sections,
        references,
        perplexityReport,
        requestChain: this.requestChain,
        imageAnalyses: imageAnalysesArray.length > 0 ? imageAnalysesArray : undefined
      };
    } catch (error: any) {
      console.error('Erreur reprise approfondie:', error);
      throw error;
    }
  }

  // Méthode pour la RELANCE ANALYSE (1 crédit) - o3 seulement, PAS de Perplexity
  async relaunchAnalysis(
    currentData: {
      sections: any[],
      references: any[],
      modifications: string,
      images?: { base64: string, type: string }[]
    },
    progressCallback?: (message: string) => void
  ): Promise<{ sections: any[], requestChain?: any[] }> {
    this.clearRequestChain();

    try {
      progressCallback?.('Mise à jour de l\'analyse clinique...');

      // Analyser les nouvelles images si présentes
      let newImageAnalyses = '';
      if (currentData.images && currentData.images.length > 0) {
        progressCallback?.('Analyse des nouvelles images...');
        for (let i = 0; i < currentData.images.length; i++) {
          try {
            const imageAnalysis = await this.analyzeImageWithO3(currentData.images[i].base64, currentData.images[i].type, (currentData.images[i] as any).promptType || 'general');
            newImageAnalyses += `\n\nNOUVELLE IMAGE ${i + 1} (${currentData.images[i].type}):\n${imageAnalysis}`;
          } catch (imageError: any) {
            console.error(`Erreur analyse image ${i + 1}:`, imageError.message);
          }
        }
      }

      // Construire le contexte pour o3 SEULEMENT
      let updateContext = `SECTIONS ACTUELLES:\n`;
      currentData.sections.forEach(section => {
        updateContext += `\n${section.type}:\n${section.content}\n`;
      });
      
      updateContext += `\n\nRÉFÉRENCES ACTUELLES:\n`;
      currentData.references.forEach(ref => {
        updateContext += `[${ref.label}] ${ref.title} - ${ref.url}\n`;
      });
      
      if (currentData.modifications) {
        updateContext += `\n\nMODIFICATIONS RÉCENTES:\n${currentData.modifications}`;
      }
      
      if (newImageAnalyses) {
        updateContext += `\n\nNOUVELLES ANALYSES D'IMAGES:${newImageAnalyses}`;
      }
      
      updateContext += `\n\nINSTRUCTIONS: Mets à jour l'analyse en intégrant les modifications et nouvelles informations. Garde le même format de sections.`;

      const updatedAnalysisResult = await this.analyzeWithO3(updateContext, '');
      const sections = this.parseSections(updatedAnalysisResult.analysis);
      
             return {
         sections,
         requestChain: this.requestChain
       };
    } catch (error: any) {
      console.error('Erreur relance analyse:', error);
      throw error;
    }
  }

  // Nouvelle méthode pour améliorer l'analyse avec o3
  async improveAnalysisWithO3(prompt: string): Promise<string> {
    try {
      console.log('Amélioration de l\'analyse avec o3...');
      
      // Sauvegarder la requête
      this.requestChain.push({
        timestamp: new Date().toISOString(),
        model: 'OpenAI o3',
        type: 'Amélioration d\'analyse',
        request: prompt,
        response: ''
      });

      if (this.useFirebaseFunctions) {
        console.log('Amélioration avec o3 via Firebase Functions...');
        const { analyzeWithO3ViaFunction } = await import('@/lib/firebase-functions');
        const response = await analyzeWithO3ViaFunction(prompt);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = response;
        
        return response;
      } else {
        // Mode développement - appel direct o3
        console.log('Appel API o3 direct pour amélioration (mode dev)...');
        
        const response = await axios.post(
          'https://api.openai.com/v1/responses',
          {
            model: 'o3-2025-04-16',
            prompt: prompt,
            max_output_tokens: 5000,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const outputText = response.data.output[1].content[0].text || '';
        console.log('Réponse o3 amélioration, usage:', response.data.usage);
        
        // Sauvegarder la réponse
        this.requestChain[this.requestChain.length - 1].response = JSON.stringify(response.data, null, 2);
        
        return outputText;
      }
    } catch (error: any) {
      console.error('Erreur amélioration o3:', error);
      throw new Error('Erreur lors de l\'amélioration avec o3: ' + error.message);
    }
  }

  // Nouvelle méthode pour enrichir les références avec GPT-4o mini Web Search
  private async enrichReferencesWithWebSearch(references: any[], perplexityContent: string = ''): Promise<any[]> {
    try {
      if (references.length === 0) {
        console.log('Aucune référence à enrichir');
        return references;
      }

      console.log(`Enrichissement de ${references.length} références avec GPT-4o mini Web Search...`);

      if (this.useFirebaseFunctions) {
        const { enrichReferencesWithWebSearchViaFunction } = await import('@/lib/firebase-functions');
        return await enrichReferencesWithWebSearchViaFunction(references, perplexityContent);
      } else {
        console.log('Web Search via Firebase Functions non encore implémenté');
        return references;
      }
      
    } catch (error: any) {
      console.error('Erreur enrichissement Web Search:', error);
      return references; // Fallback
    }
  }

  // Méthode améliorée pour ajouter les citations aux sections avec GPT-4o mini
  private async addCitationsToSections(sections: any[], references: any[], originalPerplexityText: string): Promise<any[]> {
    try {
      console.log('Ajout intelligent des citations aux sections...');
      
      if (references.length === 0 || sections.length === 0) {
        return sections;
      }

      if (this.useFirebaseFunctions) {
        const { addCitationsToSectionsViaFunction } = await import('@/lib/firebase-functions');
        return await addCitationsToSectionsViaFunction(sections, references, originalPerplexityText);
      } else {
        console.log('Ajout citations via Firebase Functions non encore implémenté');
        return sections;
      }
      
    } catch (error: any) {
      console.error('Erreur ajout citations:', error);
      return sections; // Fallback
    }
  }


} 
