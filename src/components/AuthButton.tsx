'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AuthButton() {
  const { user, userCredits, loading, isAdmin, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button onClick={signInWithGoogle} variant="default">
        <LogIn className="h-4 w-4 mr-2" />
        Se connecter avec Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline-block">{user.displayName || user.email}</span>
          <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-primary/10 rounded-full">
            <Coins className="h-3 w-3" />
            <span className="text-xs font-semibold">{userCredits?.credits || 0}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem disabled>
          <Coins className="h-4 w-4 mr-2" />
          <span>Crédits restants: {userCredits?.credits || 0}</span>
        </DropdownMenuItem>
        
        {userCredits && userCredits.totalCreditsUsed > 0 && (
          <DropdownMenuItem disabled>
            <span className="text-xs text-gray-500">
              Total utilisé: {userCredits.totalCreditsUsed}
            </span>
          </DropdownMenuItem>
        )}
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Administration
              </a>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 