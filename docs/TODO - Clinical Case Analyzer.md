# TODO - Clinical Case Analyzer 

## 📋 Vue d'ensemble

Cette liste de tâches vise à améliorer l'application d'analyse de cas cliniques en passant du mode démo actuel vers une solution complète et professionnelle. L'application utilise actuellement Next.js avec une interface en 7 sections structurées et des références bibliographiques.

---

## 🎨 Interface utilisateur & Expérience

_____________________DONE
______________________

### 1. Améliorer l'indication du mode démo
**Contexte** : Actuellement le mode démo est indiqué de manière discrète
- [ ] **Donner le mode réel par default quand l'utilisateur est connecté**
  - Qaund on clique sur la page d'accueil sur essayer gratuitement ça envoie vers la page de connexion 
  - quand on clique sur démo ça envoie vers la page de démo en cochant démo par défautl (ça doit etre bleu donc inverser la logique du bouton démo sur la page demo : si mode démo alors c'est bleu et c'est coché, si mode réel alors on affiche Connexion requise pour utiliser la fonctionnalité avec vos données comme c'est actuellement)
  - dans le mode démo préremplir avec les information et empecher l'utilisateur de modifier le champs
___DONE 
- [ ] **Améliorer la visibilité du mode démo pour les non-connectés**
  - Banner plus visible en haut de page
  - Couleur distincte (orange/jaune) avec texte "MODE DÉMO"
  - Popup d'information au premier usage
- [ ] **Donner le mode réel par default quand l'utilisateur est connecté**
______

_____________________DONE 
______________________

Applique le meme formatage pour les sources de Références bibliographiques dans le rapport de sources de Références - Maladies rares 
de plus ajoute les auteurs en petit si possible également 


____________________DONE 
______________________

## 🧠 Fonctionnalités d'analyse avancées

### 3. Transformer le prompt d'entrée en formulaire structuré
**Contexte** : Actuellement l'utilisateur colle librement le cas clinique
- [ ] ** transformer l’input utilisateur en remplissant au maximum le formulaire par catégories pour améliorer la qualité ce formulaire est preremoli via une requette 4o avant d’etre enviyee en analyse**
  - **Anamnèse** : Symptômes principaux, chronologie, évolution
  - **Antécédents** : Médicaux, chirurgicaux, familiaux, traitements
  - **Examen clinique** : Constantes, examen physique par systèmes
  - **Examens complémentaires** : Biologie, imagerie, ECG, etc.
  - **Contexte patient** : Âge, profession, mode de vie
  - Mode "saisie libre" alternatif 




**⚠️ Question à clarifier** : Voulez-vous remplacer complètement le champ libre ou proposer les deux options ? reponse : ca ne le remplace pas, ce sont des champs presents sous le champs libre et qui sont remplis automatiquement via 4o une fois le champs libre renseigné et si l'utilisateur le souhaite il peut le modifier avant et après analyse. Créer donc une requette "gpt-4.1-mini" ou gpt-4.1-mini-2025-04-14 si non disponible. (rappel : Create chat completion
post
 

____________________DONE 
____________________

### 4. Système de retour et amélioration avec o3
**Contexte** : Une fois l'analyse affichée, permettre l'itération suivant plusieurs nouvelles informztions
- [ ] **Interface de retour sur l'analyse**
  - Bouton "ajouter des informations" sur chaque section
  - Zone de saisie pour informations complémentaires
  - Re-analyse ciblée avec OpenAI o3
  - Historique des versions d'analyse
  - Comparaison avant/après amélioration
  - l'analyse est refaite en incluant seulement les résultats affichés et sources
  - un bouton reprise approfondies est également affichée pour relancer une recherche sonar (notammelt si beaucoup d'informations ont ete ajoutées)
  - donne un titre court au cas clinique, peut etre founrnit initialement par 4o mini comme tu veux


_____ DONE 
_____

en fait tu peux ajouter les éléments au cas clinque en cliquant sur le + c'est très bien mais on peut avoir deux boutons : Bouton un ajouter des informations  ok  puis deux boutons visible > bouton Ajouter / bouton Ajouter et relancer l'analyse 
ensuite il y a aussi la possibilité de modifier les sections ajoutées par le passé 

ajoute la possibilité d'ouvrir tous les accordéons ou les fermer tous d'un coups 
ajoute un bouton pour relancer l'analyse (1) crédit pour chaque relance d'analyse perplexity > o3 

qui doit mettre toutes les sections non ajoutées manuellement à jour 

dans historique il doit y avoir les memes boutons qu'au moment du premier affichage de résultats

par ailleurs tu dois ajouter un élément déroulant : voir dossier initial affichant le contenu rentré manuellement initialement par l'user 

 Ce qui a été corrigé et implémenté précédemment
Système de retour et amélioration avec o3 - Fonctionnel
Ajout d'informations complémentaires - Fonctionnel
Historique des versions - Fonctionnel
Amélioration de l'extraction des références - Fonctionnel
❌ Problèmes rencontrés lors de cette session
Ouvrir tout/Fermer tout ne fonctionne pas - J'ai essayé de corriger en passant de type="single" à type="multiple" pour l'accordéon
Tooltips - J'ai installé le composant tooltip mais rencontré des erreurs de syntaxe lors de l'implémentation
Édition du dossier initial - Tentative d'implémentation mais erreurs de syntaxe
Voir les anciennes versions - Tentative d'ajouter un bouton "Voir" mais erreurs de syntaxe

DONE :

1 
la requette perplexity ""Recherche académique"," doit venir juste avant la recherche "Analyse clinique complète"
incluant "Analyse des références" + ""Analyse d'image other"  + le contenu ajouté par l'utilisateur initialement ou ensuite 
ainsi la recherche académique est la recherche la plus complète

2
recherche maladei rare doit etre avant toutes les ref

3 l'image doit etre affichée  dans l'onglet 'voir dossier initial' et peute tre enlever ou alors on peut en ajouter afin de relancer une recherce

4 
reprise approfondie 2 credits 
relancer l'analyse 1 crédit

5
les références spécialisées ne sont pas au meme format correctemet mis en forme avec titre date et auteurs 

___DONE 
___


2 de plus les données ajoutées. manuellement ou fournie par la recherche ne sont pas éditable comme le dossier initial l'est 

3 j'aimerais que tu affiche l'analyse de l'image à côté de l'image dans le dossier initial

4 il y a un problème de html dans la réponse affichée 

"utres antiplaquettaires, bêta-bloquant, IEC, statine) et un programme de réadaptation cardiaque. Cela réduit fortement le risque de récidive et aide votre cœur à récupérer. Si vous avez des questions, n’hésitez pas, nous vous accompagnerons à chaque étape. »

Références : <a href="#ref-1" class="text-blue-600 hover:text-blue-800 font-semibold">[1]</a> <a href="#ref-2" class="text-blue-600 hover:text-blue-800 font-semibold">[2]</a> <a href="#ref-4" class="text-blue-600 hover:text-blue-800 font-semibold">[4]</a> <a href="#ref-6" class="text-blue-600 hover:text-blue-800 font-semibold">[6]</a> <a href="#ref-8" class="text-blue-600 hover:text-blue-800 font-semibold">[8]</a> <a href="#ref-9" class="text-blue-600 hover:text-blue-800 font-semibold">[9]</a> <a href="#ref-10" class="text-blue-600 hover:text-blue-800 font-semibold">[10]</a>
" 



d'ailleurs met un menu déroulant pour ces deux listes de références une fois que tu auras résolu le sujet 


___

0 l'analyse de l'image n'est pas disponible immédiatement apparement 
"L'analyse de cette image sera disponible après la prochaine analyse" 

1 la recherche maladie rare lance une recheche classique non? alrs qu'il est supposé lancer la recherche perplexity déjà existante pour focus maladie rare orphanet etc tu peux retrouver et réactiver? de pus le bouton n'est pas disponible quand j'ouvre une page historique. On doit pouvoir supprimé une information ajoutée ensuite


 4. Ajouter un loader pendant l'analyse
**Contexte** : Actuellement l'analyse affiche juste "Analyse en cours..." 
- [ ] **Créer un composant loader sophistiqué**
  - Animation de cerveau/IA en cours de réflexion
  - affichage des éléments quand disponible (dossier initial> résultat analyse image bouton pour télécharger le dossier de recher pdf perplexity, afficache dans les 7 parties, affichage maladie rare si recherché)
  - Étapes de progression (Recherche → Analyse → Structuration > source)
  - Temps estimé d'analyse
  - Messages informatifs pendant l'e process complet
  - idem pour chaque nouvelle requette future, notamment maladie rare
  - ajouter un bouton 


2 le résultats de maladies rare n'est toujours pas bien strcuturé 

4 les liens ave cid cas fonctionnent mais pas les ?id=analysis pour la gestion des historiques  https://latry.consulting/projet/clinical-case-analyzer/analysis/view/?id=cas-1749629464351-ljfffnloz
---

. 🔧 Structure des maladies rares
Le composant RareDiseaseResults structure déjà l'affichage avec des sections
Si le format n'est toujours pas satisfaisant, il faudrait me préciser exactement ce qui manque

tu as vu dans l'image que jet'ai envoyé juste avant ? le contenu semble avoir été coupé et il n'y a pas tourtes les informations disponibles 

1 je pense que dans un résultat on devrait renommer Version pour la gestion des et non pas nommer ça historique https://latry.consulting/projet/clinical-case-analyzer/history/


3 le résultat de o3 solo est bien strcuturé mais lorsqu'on passe pas preplexity d'abord ça devient mal structuré 


ça dit analyse non trouvée, car je pense qu'on doit garder ?id=cas et non is=analysis pour revenir sur une analyse pasée 

TODO : 
TODO
TODO
pourquoi je n'ai que 4 sources ? 
comment on a trouvé le nom du journal alors que perplexity ne l'a pas donné je crois ? 
pourquoi on n'a pas donné le nom de l'auteur alors ? 
ce qui est affiché à la fin et structuré c'est la réponse de o3 alors que ça devrait etre celle de perplexity qui devrait aussi etre structuré de la meme facon mais en ayant gardé les memes iputs actuel 

le bouton historique sur la page du premier résultat mène à accueil au lieu de historiuqer

___

2 la reprise approfondie et la relance d'analyse devraient mettre à jour les 7 parties et historiser l'ancienne version du resultat (le versionning existe déjà je crois dans le code) comme ça on peut suivre l'évolution de la reflexion facilement 


3. ✅ Format o3 pour l'analyse simple
Correction du format de sortie pour utiliser ## SECTION_TYPE: au lieu de [SECTION_TYPE:XXX]
L'analyse simple devrait maintenant être bien structurée

>non mais l'analyse simple était correcte je t'ai montré que l'analyse approfondie, le resultat donne des à la ligne entre et un bazar autour des srouces


3 de plus il n'est pas affiché les auteurs et la date pour les références bibliographique comme c'était le cas avant ni meme pour les références spécialisées maladies rares, tu peux retrouver la fonction et la réactiver stp

### 5. Checklist des symptômes par diagnostic
**Contexte** : Guider le médecin dans la validation des hypothèses
- [ ] **Système de validation symptômes/signes**
  - Pour chaque diagnostic proposé : liste des critères
  - Cases à cocher verte si présent chez le patient pouvant etre confirmer par le medecin
  - Score de correspondance diagnostic/patient
  - Alerte si critères majeurs manquants
  - Suggestion d'examens pour confirmer/
  - réanalyser si elements cochés et confirmé par le medecin jusqu'à validation complète d'une patho (cette validation finale n'est possible que par le médecin mais suggérée par le model)

---
### 6. Ajouter medgemma !!


---

## 🔗 Intégrations APIs externes

### 7. Intégration Google Studio pour analyse vocale
**Contexte** : Permettre la saisie et analyse par reconnaissance vocale
- [ ] **API Google Speech-to-Text**
  - **Avant RDV** : Patient dicte ses symptômes
  - **Pendant RDV** : Enregistrement médecin + patient
  - **Après RDV** : Synthèse vocale du médecin seul
  - Transcription automatique dans les champs du formulaire
  - Détection des entités médicales (symptômes, médicaments)

api code à mettre dans firebasefunction : AIzaSyAtV6E_LrLrZln2BfcR8ngomMzhywDvSf_Y



---

## 🏥 Fonctionnalités métier médicales


## 📄 Export et documentation

### 12. Améliorer l'export PDF
**Contexte** : Inclure toutes les nouvelles fonctionnalités
- [ ] **Export PDF enrichi**
  - Section maladies rares incluse
  - Checklist des symptômes validés
  - Étapes d'analyse franchies
  - Évaluation de faisabilité
  - QR code vers version numérique
  - Mise en page professionnelle
  


---

## 💬 Système de feedback

### 14. Collecte des retours utilisateurs
**Contexte** : Améliorer continuellement l'application
- [ ] **Interface de feedback**
  - Notation de la qualité d'analyse (1-5 étoiles)
  - Commentaires texte par section
  - Signalement d'erreurs médicales
  - Suggestions d'amélioration
  - Analytics d'usage des fonctionnalités
  - Dashboard admin pour centraliser les retours



### 9. Notion de faisabilité clinique
**Contexte** : Adapter les recommandations au contexte pratique
- [ ] **Indicateur de faisabilité pour chaque recommandation**
  - **Quotidien clinique** : Ce qui est réalisable immédiatement
  - **Meilleur des mondes** : Recommandations idéales
  - Filtres par type d'établissement (CHU, clinique, cabinet)
  - Coût estimé des examens
  - Délais d'obtention des résultats


### 11. Adaptation par spécialité médicale
**Contexte** : Personnaliser l'analyse selon la discipline
- [ ] **Modules spécialisés**
  - Sélection de la spécialité (Cardio, Neuro, Gastro, etc.)
  - Protocoles et référentiels spécifiques
  - Examens privilégiés par spécialité
  - Vocabulaire et classifications adaptés
  - Guidelines spécialisées

---


---



### 13. Affichage des sources dans les résultats
**Contexte** : Améliorer la traçabilité des informations
- [ ] **Système de sources amélioré**
  - Nom des sources d'information actuellement ce nest ecrit que « source» au lieu du titre de larticle 
  - Niveau de confiance des informations
  - Date de publication des références
  - Impact factor des journaux
  - Filtrage par type de source (Guidelines, études, expert)
