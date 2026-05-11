# Plan de test manuel

## Installation

1. Ouvrir `chrome://extensions` ou `edge://extensions`.
2. Activer le mode developpeur.
3. Charger le dossier de l'extension.
4. Verifier que l'extension apparait sans erreur.

## YouTube

- Ouvrir une video courte.
- Verifier que le badge `Fin HH:MM` apparait a cote de l'horodatage YouTube.
- Lancer, mettre en pause, reprendre et verifier que le badge reste visible.
- Changer la vitesse de lecture en `0.75x`, `1x`, `1.5x` et `2x`, puis verifier que l'heure change.
- Avancer et reculer dans la video, puis verifier que l'heure est recalculee.
- Tester le mode theatre et le plein ecran.
- Passer a une autre video sans recharger l'onglet, puis verifier que le badge suit la nouvelle video.
- Ouvrir un live avec l'indicateur `En direct` visible et verifier que le badge de l'extension ne s'affiche pas, meme si YouTube expose une fenetre DVR avec une duree finie.

## Regression

- Verifier que les controles YouTube restent cliquables.
- Verifier que le navigateur ne ralentit pas et que l'onglet ne plante pas.
- Verifier que le badge disparait avec les controles quand YouTube masque l'interface.
