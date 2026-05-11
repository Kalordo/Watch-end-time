# Watch End Time

Extension Chrome/Edge qui affiche l'heure estimee de fin dans les controles des lecteurs YouTube, Netflix, Prime Video, Disney+, Vimeo, Dailymotion et Twitch.

Le badge tient compte de la duree restante, de l'heure locale et de la vitesse de lecture.

Createur : 3Devs.

## Installation locale

1. Ouvrir `chrome://extensions` ou `edge://extensions`.
2. Activer le mode developpeur.
3. Cliquer sur `Charger l'extension non empaquetee`.
4. Selectionner ce dossier : `C:\Users\Yohann\youtube-end-time-extension`.
5. Ouvrir une video sur une plateforme supportee.

## Fonctionnalites

- Affichage `Fin HH:MM:SS` integre dans les controles YouTube.
- Integration Netflix dans les controles du lecteur quand une zone de controle fiable est detectee.
- Integration Prime Video/Amazon Video dans les controles du lecteur quand une zone de controle fiable est detectee.
- Integration Disney+ dans les controles du lecteur quand une zone de controle fiable est detectee.
- Integration Vimeo, Dailymotion et Twitch VOD/replays dans les controles du lecteur quand une zone de controle fiable est detectee.
- Mise a jour pendant la lecture, apres pause/reprise, seek et changement de vitesse.
- Detection des videos terminees et des lives sans duree fiable.
- Aucune permission sensible et aucune collecte de donnees.

## Compatibilite

YouTube garde une integration native dans le lecteur. Netflix, Prime Video, Disney+, Vimeo, Dailymotion et Twitch VOD/replays utilisent aussi une integration dans les controles du lecteur quand l'interface expose un ancrage fiable. Les lecteurs HTML5 generiques sur tous les sites restent prevus pour plus tard, car ils demanderaient une permission plus large.

## Publication

- Icônes PNG : `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`.
- Sources SVG : `icons/icon16.svg`, `icons/icon48.svg`, `icons/icon128.svg`.
- Confidentialite : `docs/PRIVACY.md`.
- Texte de fiche publique : `docs/STORE_LISTING.md`.
- Checklist de test : `docs/TEST_PLAN.md`.
- Guide captures : `docs/SCREENSHOT_GUIDE.md`.
- Architecture plateformes : `docs/PLATFORM_ADAPTERS.md`.
