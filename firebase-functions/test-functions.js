// Script de test pour les fonctions Firebase
const { initializeApp } = require('firebase/app');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

// Configuration Firebase (identique à celle de l'app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "votre-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cas-clinique.firebaseapp.com",
  projectId: "cas-clinique",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cas-clinique.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "votre-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID || "votre-app-id"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'europe-west1');

// Pour tester en local, décommenter cette ligne :
// connectFunctionsEmulator(functions, "localhost", 5001);

async function testFunctions() {
  console.log('🧪 Test des fonctions Firebase...\n');

  // Test 1: analyzePerplexityWithGPT4Mini
  console.log('1. Test analyzePerplexityWithGPT4Mini...');
  try {
    const analyzePerplexity = httpsCallable(functions, 'analyzePerplexityWithGPT4Mini');
    const result = await analyzePerplexity({ 
      perplexityData: "Ceci est un test de données Perplexity pour vérifier que la fonction fonctionne." 
    });
    console.log('✅ Succès:', result.data.text.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 2: transcribeAudio (avec audio factice)
  console.log('\n2. Test transcribeAudio...');
  try {
    const transcribe = httpsCallable(functions, 'transcribeAudio');
    // Audio WebM factice en base64 (très court)
    const fakeAudio = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////";
    const result = await transcribe({ audioBase64: fakeAudio });
    console.log('✅ Résultat:', result.data);
  } catch (error) {
    console.error('❌ Erreur attendue (audio invalide):', error.message);
  }

  console.log('\n✅ Tests terminés !');
  console.log('\nPour tester depuis l\'application :');
  console.log('1. Allez sur https://latry.consulting/projet/clinical-case-analyzer/demo');
  console.log('2. Activez le mode "Réel" (toggle en haut)');
  console.log('3. Lancez une analyse');
}

// Lancer les tests
testFunctions().catch(console.error); 