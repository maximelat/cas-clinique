# Guide de Configuration des Variables Firebase avec GitHub Secrets

## Problème Actuel

L'erreur "Firebase Auth n'est pas initialisé" survient car les variables Firebase ne sont pas disponibles côté client après le déploiement.

## Pourquoi cela arrive

1. **Variables côté client dans Next.js** : Les variables qui doivent être accessibles dans le navigateur DOIVENT avoir le préfixe `NEXT_PUBLIC_`

2. **GitHub Secrets** : Les secrets GitHub sont injectés pendant le build, mais uniquement s'ils sont explicitement déclarés dans le workflow

3. **Workflow incomplet** : Les variables Firebase n'étaient pas déclarées dans `.github/workflows/deploy.yml`

## Solution

### 1. Vérifier vos GitHub Secrets

Assurez-vous d'avoir créé ces secrets dans votre repository GitHub :
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APPID`
- `FIREBASE_MEASUREMENTID`

### 2. Mise à jour du Workflow (DÉJÀ FAIT)

Le workflow a été mis à jour pour inclure :
```yaml
NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
# ... etc
```

### 3. Déploiement

Après le push, GitHub Actions va :
1. Lire vos secrets GitHub
2. Les injecter comme variables d'environnement pendant le build
3. Next.js va les inclure dans le bundle client (grâce au préfixe NEXT_PUBLIC_)
4. Firebase pourra s'initialiser correctement

## Mode Sans Firebase

Si vous voulez utiliser l'application SANS Firebase :
- L'authentification sera désactivée
- Le système de crédits ne fonctionnera pas
- Mais l'analyse clinique fonctionnera toujours (si les API keys Perplexity et OpenAI sont configurées)

## Vérification

Pour vérifier que tout fonctionne :
1. Attendez que le déploiement GitHub Actions se termine
2. Visitez votre site
3. Ouvrez la console du navigateur
4. Vous ne devriez plus voir l'erreur Firebase

## Alternative Locale

Pour tester localement, créez un fichier `.env.local` :
```
NEXT_PUBLIC_FIREBASE_API_KEY=votre_valeur
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_valeur
# ... etc
``` 