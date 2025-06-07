# Guide d'analyse d'images médicales

## Vue d'ensemble

L'application peut maintenant analyser des images médicales en plus du texte du cas clinique. Cette fonctionnalité utilise o4-mini-2025-04-16 pour une analyse approfondie des images avant l'analyse globale par o3.

## Types d'images supportés

### 1. Biologie (biology)
- Résultats de laboratoire
- Analyses sanguines
- Bilans biologiques
- Noms suggérés : bio*.jpg, lab*.png, sang*.pdf

### 2. ECG (ecg)
- Électrocardiogrammes
- Tracés cardiaques
- Noms suggérés : ecg*.jpg, ekg*.png

### 3. Imagerie médicale (medical)
- Radiographies (radio*, rx*)
- IRM (irm*, mri*)
- Scanner (scan*, ct*)
- Échographie (echo*, us*)

### 4. Autres (other)
- Photos cliniques
- Autres documents visuels

## Comment utiliser

### 1. Ajouter des images

1. Cliquez sur le bouton **"Ajouter des images"** 📷
2. Sélectionnez une ou plusieurs images
3. Les images sont automatiquement catégorisées selon leur nom

### 2. Vérifier les images ajoutées

- Chaque image affiche son nom et son type détecté
- Cliquez sur la croix (X) pour supprimer une image
- Vous pouvez ajouter jusqu'à 10 images

### 3. Lancer l'analyse

Le processus suit ces étapes :
1. **Perplexity** recherche dans la littérature médicale
2. **o4-mini** analyse chaque image en détail
3. **o3** intègre toutes les données pour une analyse complète

## Exemples d'utilisation

### Cas 1 : Douleur thoracique avec ECG
```
Texte : "Patient 65 ans, douleur thoracique..."
Images : ecg-urgence.jpg
→ o4-mini analysera l'ECG (rythme, anomalies)
→ o3 intégrera ces données dans l'analyse
```

### Cas 2 : Bilan biologique anormal
```
Texte : "Fatigue chronique, perte de poids..."
Images : bilan-sanguin.png, nfs.jpg
→ o4-mini identifiera les valeurs anormales
→ o3 corrélera avec le tableau clinique
```

### Cas 3 : Traumatisme avec radiographie
```
Texte : "Chute de vélo, douleur au poignet..."
Images : radio-poignet-face.jpg, radio-poignet-profil.jpg
→ o4-mini recherchera fractures/luxations
→ o3 proposera la prise en charge adaptée
```

## Conseils pour de meilleurs résultats

### Qualité des images
- Résolution suffisante (minimum 800x600)
- Images nettes et bien cadrées
- Éviter les photos floues ou mal éclairées

### Nommage des fichiers
- Utilisez des noms descriptifs
- Incluez le type d'examen dans le nom
- Exemples : "ecg-12-derivations.jpg", "bio-hepatique.png"

### Organisation
- Groupez les images du même type
- Pour les radiographies, incluez toutes les incidences
- Pour la biologie, préférez des captures complètes

## Limitations

- Taille maximale par image : 20 MB
- Formats supportés : JPG, PNG, GIF, WebP
- Nombre maximum d'images : 10 par analyse

## Mode démo

En mode démo, l'analyse d'images est simulée pour montrer le fonctionnement sans consommer de crédits API.

## Sécurité et confidentialité

- Les images ne sont pas stockées sur nos serveurs
- Traitement en temps réel puis suppression
- Utilisation sécurisée des API OpenAI

## Résolution de problèmes

### "Erreur lors de l'analyse de l'image"
- Vérifiez le format de l'image
- Assurez-vous que l'image n'est pas corrompue
- Réduisez la taille si > 20 MB

### "Type d'image non reconnu"
- Le système utilisera le type "other"
- L'analyse sera quand même effectuée
- Vous pouvez renommer le fichier pour une meilleure détection 