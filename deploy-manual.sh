#!/bin/bash
# Script de déploiement manuel en cas de problème avec GitHub Actions

echo "🚀 Déploiement manuel du site..."

# Build
echo "📦 Build de l'application..."
export NEXT_PUBLIC_BASE_PATH=/projet/clinical-case-analyzer
npm run build

# Créer le .htaccess
echo "📝 Création du .htaccess..."
cat > out/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /projet/clinical-case-analyzer/
  
  # Handle client-side routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /projet/clinical-case-analyzer/index.html [L]
</IfModule>
EOF

echo "✅ Build terminé !"
echo ""
echo "📤 Pour déployer sur OVH :"
echo "1. Utilisez un client FTP (FileZilla, Cyberduck, etc.)"
echo "2. Connectez-vous avec vos identifiants FTP"
echo "3. Uploadez le contenu du dossier 'out/' vers '/www/projet/clinical-case-analyzer/'"
echo ""
echo "Ou utilisez lftp en ligne de commande :"
echo "lftp -u USERNAME,PASSWORD ftp://SERVER -e 'mirror -R out/ /www/projet/clinical-case-analyzer/; quit'" 