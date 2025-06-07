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
        perplexityReport: analysis.perplexityReport,
        rareDiseaseData: analysis.rareDiseaseData,
        images: analysis.images
      };
      
      await setDoc(
        doc(db, this.COLLECTION_NAME, analysis.id), 
        analysisDoc
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
      
      const docRef = doc(db, this.COLLECTION_NAME, analysisId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AnalysisRecord;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'analyse:', error);
      throw new Error('Impossible de récupérer l\'analyse');
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