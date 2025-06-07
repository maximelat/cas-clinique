#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Test de configuration Firebase Functions\n');

try {
  // 1. Vérifier si Firebase CLI est installé
  console.log('1. Vérification Firebase CLI...');
  execSync('firebase --version', { stdio: 'inherit' });
  console.log('✅ Firebase CLI installé\n');
} catch (error) {
  console.error('❌ Firebase CLI non installé. Installez avec: npm install -g firebase-tools\n');
  process.exit(1);
}

try {
  // 2. Vérifier la configuration des fonctions
  console.log('2. Récupération de la configuration Firebase Functions...');
  const config = execSync('firebase functions:config:get', { encoding: 'utf8' });
  console.log('Configuration actuelle:');
  console.log(config);
  
  // Parser la configuration
  const configObj = JSON.parse(config || '{}');
  
  // 3. Vérifier la clé OpenAI
  if (configObj.openai && configObj.openai.key) {
    console.log('✅ Clé OpenAI configurée');
    console.log(`   Longueur: ${configObj.openai.key.length} caractères`);
    console.log(`   Début: ${configObj.openai.key.substring(0, 7)}...`);
  } else {
    console.error('❌ Clé OpenAI NON configurée dans Firebase Functions');
    console.log('\n🔧 Pour configurer la clé:');
    console.log('firebase functions:config:set openai.key="sk-..."');
    console.log('firebase deploy --only functions');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la récupération de la configuration');
  console.error('Assurez-vous d\'être connecté: firebase login');
  console.error('Erreur:', error.message);
}

console.log('\n📋 Prochaines étapes:');
console.log('1. Si la clé n\'est pas configurée:');
console.log('   firebase functions:config:set openai.key="VOTRE_CLÉ_OPENAI"');
console.log('2. Redéployer les fonctions:');
console.log('   firebase deploy --only functions');
console.log('3. Vérifier les logs:');
console.log('   firebase functions:log --follow'); 