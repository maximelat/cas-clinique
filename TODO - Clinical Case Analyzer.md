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

### 2. Ajouter un loader pendant l'analyse
**Contexte** : Actuellement l'analyse affiche juste "Analyse en cours..." 
- [ ] **Créer un composant loader sophistiqué**
  - Animation de cerveau/IA en cours de réflexion
  - Étapes de progression (Recherche → Analyse → Structuration)
  - Temps estimé d'analyse
  - Messages informatifs pendant l'
  - idem pour chaque nouvelle requette future, notamment maladie rare

---

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

En cours :

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

TODOOOOO:

### 5. Checklist des symptômes par diagnostic
**Contexte** : Guider le médecin dans la validation des hypothèses
- [ ] **Système de validation symptômes/signes**
  - Pour chaque diagnostic proposé : liste des critères
  - Cases à cocher verte si présent chez le patient pouvant etre confirmer par le medecin
  - Score de correspondance diagnostic/patient
  - Alerte si critères majeurs manquants
  - Suggestion d'examens pour confirmer/
  - réanalyser si elements cochéset confirme par le medecin 

---
Ajouter medgemma 

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

**⚠️ Question à clarifier** : Google Studio API fait référence à Speech-to-Text ou une autre API spécifique ? oui saif si open ai transcriber est aussi performant 

---

## 🏥 Fonctionnalités métier médicales

8 > ajouter le rapport maladie rare à l’export pdf

### 9. Notion de faisabilité clinique
**Contexte** : Adapter les recommandations au contexte pratique
- [ ] **Indicateur de faisabilité pour chaque recommandation**
  - **Quotidien clinique** : Ce qui est réalisable immédiatement
  - **Meilleur des mondes** : Recommandations idéales
  - Filtres par type d'établissement (CHU, clinique, cabinet)
  - Coût estimé des examens
  - Délais d'obtention des résultats

### 10. Évolution par étapes du dossier patient
**Contexte** : Suivre la progression de l'analyse selon les étapes cliniques
- [ ] **Système d'étapes progressives**
  - **Étape 1** : Triage initial (plainte + constantes)
  - **Étape 2** : Anamnèse complète + antécédents
  - **Étape 3** : Examen physique
  - **Étape 4** : Examens complémentaires + imagerie
  - Chaque étape met à jour l'analyse globale
  - Probabilités diagnostiques réajustées à chaque étape

### 11. Adaptation par spécialité médicale
**Contexte** : Personnaliser l'analyse selon la discipline
- [ ] **Modules spécialisés**
  - Sélection de la spécialité (Cardio, Neuro, Gastro, etc.)
  - Protocoles et référentiels spécifiques
  - Examens privilégiés par spécialité
  - Vocabulaire et classifications adaptés
  - Guidelines spécialisées

---

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

### 13. Affichage des sources dans les résultats
**Contexte** : Améliorer la traçabilité des informations
- [ ] **Système de sources amélioré**
  - Nom des sources d'information actuellement ce nest ecrit que « source» au lieu du titre de larticle 
  - Niveau de confiance des informations
  - Date de publication des références
  - Impact factor des journaux
  - Filtrage par type de source (Guidelines, études, expert)

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

---

##