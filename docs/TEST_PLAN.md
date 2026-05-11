# Plan de test manuel

## Installation

1. Ouvrir `chrome://extensions` ou `edge://extensions`.
2. Activer le mode developpeur.
3. Charger le dossier de l'extension.
4. Verifier que l'extension apparait sans erreur.

## YouTube

- Ouvrir une video courte.
- Verifier que le badge `Fin HH:MM:SS` apparait a cote de l'horodatage YouTube.
- Lancer, mettre en pause, reprendre et verifier que le badge reste visible.
- Changer la vitesse de lecture en `0.75x`, `1x`, `1.5x` et `2x`, puis verifier que l'heure change.
- Avancer et reculer dans la video, puis verifier que l'heure est recalculee.
- Tester le mode theatre et le plein ecran.
- Passer a une autre video sans recharger l'onglet, puis verifier que le badge suit la nouvelle video.
- Ouvrir un live avec l'indicateur `En direct` visible et verifier que le badge de l'extension ne s'affiche pas, meme si YouTube expose une fenetre DVR avec une duree finie.

## Netflix

- Ouvrir une video Netflix et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Verifier que le badge ne flotte pas au-dessus de la page et ne recouvre pas la video.
- Verifier que le badge ne bloque aucun bouton du lecteur Netflix.
- Verifier qu'aucun badge ne s'affiche si les controles Netflix ne sont pas detectes.
- Verifier qu'aucun badge ne s'affiche sur une page Netflix sans lecteur video actif.

## Prime Video

- Ouvrir une video Prime Video ou Amazon Video et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Verifier que le badge ne flotte pas au-dessus de la page et ne recouvre pas la video.
- Verifier que le badge ne bloque aucun bouton du lecteur Prime Video.
- Verifier qu'aucun badge ne s'affiche si les controles Prime Video ne sont pas detectes.
- Verifier qu'aucun badge ne s'affiche sur une page Amazon sans lecteur video actif.

## Disney+

- Ouvrir une video Disney+ et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Verifier que le badge ne flotte pas au-dessus de la page et ne recouvre pas la video.
- Verifier que le badge ne bloque aucun bouton du lecteur Disney+.
- Verifier qu'aucun badge ne s'affiche si les controles Disney+ ne sont pas detectes.
- Verifier qu'aucun badge ne s'affiche sur une page Disney+ sans lecteur video actif.

## Vimeo

- Ouvrir une video Vimeo et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Changer la position de lecture et verifier que l'heure est recalculee.
- Verifier qu'aucun badge ne s'affiche si les controles Vimeo ne sont pas detectes.

## Dailymotion

- Ouvrir une video Dailymotion et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Changer la position de lecture et verifier que l'heure est recalculee.
- Verifier qu'aucun badge ne s'affiche si les controles Dailymotion ne sont pas detectes.

## Twitch

- Ouvrir une VOD ou un replay Twitch et verifier qu'un badge `Fin HH:MM:SS` apparait dans les controles du lecteur.
- Verifier qu'aucun badge ne s'affiche sur un live Twitch.
- Verifier que le badge ne bloque aucun bouton du lecteur Twitch.

## Regression

- Verifier que les controles YouTube restent cliquables.
- Verifier que le navigateur ne ralentit pas et que l'onglet ne plante pas.
- Verifier que le badge disparait avec les controles quand YouTube masque l'interface.
- Verifier que les autres sites non supportes n'injectent pas de badge.
