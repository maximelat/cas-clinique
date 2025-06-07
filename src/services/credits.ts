import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export interface UserCredits {
  uid: string;
  email: string;
  credits: number;
  totalCreditsUsed: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  isAdmin?: boolean;
}

export interface CreditTransaction {
  uid: string;
  email: string;
  type: 'use' | 'add' | 'reset';
  amount: number;
  description: string;
  performedBy?: string;
  timestamp: Date;
}

const INITIAL_CREDITS = 3;
const ADMIN_EMAIL = 'maxime.latry@gmail.com';

export class CreditsService {
  // Vérifier si l'utilisateur est admin
  static isAdmin(email: string): boolean {
    return email === ADMIN_EMAIL;
  }

  // Obtenir les crédits d'un utilisateur
  static async getUserCredits(uid: string): Promise<UserCredits | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase non configuré - getUserCredits');
      return null;
    }

    try {
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        uid: data.uid,
        email: data.email,
        credits: data.credits || 0,
        totalCreditsUsed: data.totalCreditsUsed || 0,
        lastUsed: data.lastUsed?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        isAdmin: data.isAdmin || false
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error);
      throw error;
    }
  }

  // Créer un nouvel utilisateur avec des crédits initiaux
  static async createUser(uid: string, email: string): Promise<UserCredits> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré');
    }

    try {
      const db = getFirebaseDb();
      const userData: UserCredits = {
        uid,
        email,
        credits: INITIAL_CREDITS,
        totalCreditsUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAdmin: this.isAdmin(email)
      };

      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Enregistrer la transaction
      await this.logTransaction({
        uid,
        email,
        type: 'add',
        amount: INITIAL_CREDITS,
        description: 'Crédits initiaux',
        timestamp: new Date()
      });

      return userData;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  // Utiliser un crédit
  static async useCredit(uid: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase non configuré - useCredit');
      return true; // Permettre l'utilisation sans Firebase
    }

    try {
      const userCredits = await this.getUserCredits(uid);
      
      if (!userCredits) {
        throw new Error('Utilisateur non trouvé');
      }

      if (userCredits.credits <= 0) {
        return false; // Pas assez de crédits
      }

      const db = getFirebaseDb();
      // Décrémenter les crédits
      await updateDoc(doc(db, 'users', uid), {
        credits: increment(-1),
        totalCreditsUsed: increment(1),
        lastUsed: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Enregistrer la transaction
      await this.logTransaction({
        uid,
        email: userCredits.email,
        type: 'use',
        amount: 1,
        description: 'Analyse de cas clinique',
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du crédit:', error);
      throw error;
    }
  }

  // Ajouter des crédits (admin seulement)
  static async addCredits(targetUid: string, amount: number, adminEmail: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré');
    }

    if (!this.isAdmin(adminEmail)) {
      throw new Error('Seul l\'administrateur peut ajouter des crédits');
    }

    try {
      const userCredits = await this.getUserCredits(targetUid);
      
      if (!userCredits) {
        throw new Error('Utilisateur cible non trouvé');
      }

      const db = getFirebaseDb();
      await updateDoc(doc(db, 'users', targetUid), {
        credits: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Enregistrer la transaction
      await this.logTransaction({
        uid: targetUid,
        email: userCredits.email,
        type: 'add',
        amount: amount,
        description: `Crédits ajoutés par l'admin`,
        performedBy: adminEmail,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de crédits:', error);
      throw error;
    }
  }

  // Réinitialiser les crédits d'un utilisateur (admin seulement)
  static async resetCredits(targetUid: string, adminEmail: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase n\'est pas configuré');
    }

    if (!this.isAdmin(adminEmail)) {
      throw new Error('Seul l\'administrateur peut réinitialiser les crédits');
    }

    try {
      const userCredits = await this.getUserCredits(targetUid);
      
      if (!userCredits) {
        throw new Error('Utilisateur cible non trouvé');
      }

      const db = getFirebaseDb();
      await updateDoc(doc(db, 'users', targetUid), {
        credits: INITIAL_CREDITS,
        updatedAt: serverTimestamp()
      });

      // Enregistrer la transaction
      await this.logTransaction({
        uid: targetUid,
        email: userCredits.email,
        type: 'reset',
        amount: INITIAL_CREDITS,
        description: `Crédits réinitialisés par l'admin`,
        performedBy: adminEmail,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des crédits:', error);
      throw error;
    }
  }

  // Enregistrer une transaction
  private static async logTransaction(transaction: CreditTransaction): Promise<void> {
    if (!isFirebaseConfigured()) {
      return; // Ignorer silencieusement si Firebase n'est pas configuré
    }

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'transactions', `${transaction.uid}_${Date.now()}`), {
        ...transaction,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la transaction:', error);
      // Ne pas faire échouer l'opération principale si le log échoue
    }
  }
} 