'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, RefreshCw, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { CreditsService, UserCredits } from '@/services/credits';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [creditsToAdd, setCreditsToAdd] = useState<number>(1);

  // Vérifier l'accès admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/analyze');
    }
  }, [user, isAdmin, loading, router]);

  // Charger la liste des utilisateurs
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const db = getFirebaseDb();
      const usersQuery = query(collection(db, 'users'), orderBy('email'));
      const snapshot = await getDocs(usersQuery);
      
      const usersList: UserCredits[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          uid: doc.id,
          email: data.email,
          credits: data.credits || 0,
          totalCreditsUsed: data.totalCreditsUsed || 0,
          lastUsed: data.lastUsed?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isAdmin: data.isAdmin || false
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    if (creditsToAdd <= 0) {
      toast.error('Le nombre de crédits doit être positif');
      return;
    }

    try {
      await CreditsService.addCredits(selectedUser, creditsToAdd, user!.email!);
      toast.success(`${creditsToAdd} crédit(s) ajouté(s) avec succès`);
      setSelectedUser('');
      setCreditsToAdd(1);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout des crédits');
    }
  };

  const handleResetCredits = async (uid: string) => {
    if (confirm('Voulez-vous vraiment réinitialiser les crédits de cet utilisateur à 3 ?')) {
      try {
        await CreditsService.resetCredits(uid, user!.email!);
        toast.success('Crédits réinitialisés avec succès');
        await loadUsers();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la réinitialisation');
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-gray-600 mt-1">Gérer les crédits des utilisateurs</p>
        </div>
                    <Link href="/analyze">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Ajouter des crédits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ajouter des crédits</CardTitle>
          <CardDescription>
            Sélectionnez un utilisateur et ajoutez-lui des crédits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="user-select">Utilisateur</Label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} ({u.credits} crédits)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="credits">Crédits à ajouter</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="100"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            onClick={handleAddCredits}
            className="mt-4"
            disabled={!selectedUser || creditsToAdd <= 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter les crédits
          </Button>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>
                {users.length} utilisateur(s) inscrit(s)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun utilisateur inscrit
              </div>
            ) : (
              users.map(u => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{u.email}</span>
                      {u.isAdmin && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <span>Crédits: {u.credits}</span>
                      <span className="mx-2">•</span>
                      <span>Utilisés: {u.totalCreditsUsed}</span>
                      {u.lastUsed && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Dernière utilisation: {new Date(u.lastUsed).toLocaleDateString('fr-FR')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetCredits(u.uid)}
                    disabled={u.isAdmin}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 