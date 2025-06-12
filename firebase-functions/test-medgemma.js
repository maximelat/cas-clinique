const functions = require('firebase-functions');

// Vérifier la configuration MedGemma
console.log('=== TEST CONFIGURATION MEDGEMMA ===');
console.log('MEDGEMMA_API_KEY présente:', !!functions.config().medgemma?.key);
console.log('MEDGEMMA_API_KEY env:', !!process.env.MEDGEMMA_API_KEY);

if (functions.config().medgemma?.key) {
  console.log('Longueur de la clé Firebase config:', functions.config().medgemma.key.length);
  console.log('Début de la clé:', functions.config().medgemma.key.substring(0, 10) + '...');
}

if (process.env.MEDGEMMA_API_KEY) {
  console.log('Longueur de la clé env:', process.env.MEDGEMMA_API_KEY.length);
  console.log('Début de la clé env:', process.env.MEDGEMMA_API_KEY.substring(0, 10) + '...');
}

console.log('=== FIN TEST CONFIGURATION ==='); 