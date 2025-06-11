import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AnalysisRecord {
  id: string;
  userId: string;
  title: string;
  date: Timestamp;
  caseText: string;
  sections: any[];
  references: any[];
  perplexityReport?: any;
  rareDiseaseData?: any;
  images?: { base64: string, type: string, name: string }[];
  modificationHistory?: Array<{
    sectionType: string;
    additionalInfo: string;
    timestamp: string;
    version: number;
  }>;
  lastModified?: Timestamp;
  version?: number;
  isDeepReanalysis?: boolean;
  previousVersions?: number;
}

export class HistoryService {
  private static readonly COLLECTION_NAME = 'analyses';
  
  /**
   * Sauvegarder une analyse
   */
  static async saveAnalysis(userId: string, analysis: any): Promise<void> {
    try {
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      const analysisDoc: AnalysisRecord = {
        id: analysis.id,
        userId,
        title: analysis.title,
        date: Timestamp.fromDate(new Date(analysis.date)),
        caseText: analysis.caseText,
        sections: analysis.sections,
        references: analysis.references,
        perplexityReport: analysis.perplexityReport || null,
        rareDiseaseData: analysis.rareDiseaseData || null,
        images: analysis.images || null
      };
      
      // Filtrer les champs undefined pour éviter les erreurs Firestore
      const cleanedDoc = Object.entries(analysisDoc).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof AnalysisRecord] = value;
        }
        return acc;
      }, {} as any);
      
      await setDoc(
        doc(db, this.COLLECTION_NAME, analysis.id), 
        cleanedDoc
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'analyse:', error);
      throw new Error('Impossible de sauvegarder l\'analyse');
    }
  }
  
  /**
   * Récupérer toutes les analyses d'un utilisateur
   */
  static async getUserAnalyses(userId: string, maxResults: number = 50): Promise<AnalysisRecord[]> {
    try {
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      const analyses: AnalysisRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        analyses.push(doc.data() as AnalysisRecord);
      });
      
      return analyses;
    } catch (error) {
      console.error('Erreur lors de la récupération des analyses:', error);
      throw new Error('Impossible de récupérer l\'historique');
    }
  }
  
  /**
   * Récupérer une analyse spécifique
   */
  static async getAnalysis(analysisId: string): Promise<AnalysisRecord | null> {
    try {
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      console.log('Recherche de l\'analyse avec ID:', analysisId);
      
      // Essayer d'abord avec l'ID direct
      const docRef = doc(db, this.COLLECTION_NAME, analysisId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('Analyse trouvée avec l\'ID direct');
        return docSnap.data() as AnalysisRecord;
      }
      
      // Si pas trouvé et que l'ID ressemble à un ancien format (cas-XXX)
      if (analysisId.startsWith('cas-')) {
        console.log('ID ancien format détecté, recherche par ID dans les données...');
        
        // Rechercher dans toutes les analyses où le champ id correspond
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('id', '==', analysisId),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log('Analyse trouvée avec l\'ancien format d\'ID');
          return querySnapshot.docs[0].data() as AnalysisRecord;
        }
      }
      
      console.log('Aucune analyse trouvée pour l\'ID:', analysisId);
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'analyse:', error);
      throw new Error('Impossible de récupérer l\'analyse');
    }
  }
  
  /**
   * Mettre à jour une analyse existante
   */
  static async updateAnalysis(analysisId: string, updates: Partial<AnalysisRecord>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      // Vérifier que l'analyse existe
      const existingAnalysis = await this.getAnalysis(analysisId);
      if (!existingAnalysis) {
        throw new Error('Analyse non trouvée');
      }
      
      // Filtrer les champs undefined
      const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof AnalysisRecord] = value;
        }
        return acc;
      }, {} as any);
      
      // Mettre à jour le document
      await setDoc(
        doc(db, this.COLLECTION_NAME, analysisId),
        {
          ...existingAnalysis,
          ...cleanedUpdates,
          lastModified: Timestamp.fromDate(new Date())
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'analyse:', error);
      throw new Error('Impossible de mettre à jour l\'analyse');
    }
  }
  
  /**
   * Supprimer une analyse
   */
  static async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      // Vérifier que l'analyse appartient bien à l'utilisateur
      const analysis = await this.getAnalysis(analysisId);
      if (!analysis || analysis.userId !== userId) {
        throw new Error('Analyse non trouvée ou non autorisée');
      }
      
      await deleteDoc(doc(db, this.COLLECTION_NAME, analysisId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'analyse:', error);
      throw new Error('Impossible de supprimer l\'analyse');
    }
  }
  
  /**
   * Rechercher dans l'historique
   */
  static async searchAnalyses(userId: string, searchTerm: string): Promise<AnalysisRecord[]> {
    try {
      // Récupérer toutes les analyses de l'utilisateur
      const allAnalyses = await this.getUserAnalyses(userId);
      
      // Filtrer côté client (Firestore ne supporte pas la recherche full-text native)
      const searchLower = searchTerm.toLowerCase();
      return allAnalyses.filter(analysis => 
        analysis.title.toLowerCase().includes(searchLower) ||
        analysis.caseText.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw new Error('Erreur lors de la recherche');
    }
  }
} 