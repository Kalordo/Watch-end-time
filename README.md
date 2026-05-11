# Watch End Time

Extension Chrome/Edge qui affiche l'heure estimee de fin dans les controles des lecteurs YouTube, Netflix, Prime Video et Disney+.

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
- Mise a jour pendant la lecture, apres pause/reprise, seek et changement de vitesse.
- Detection des videos terminees et des lives sans duree fiable.
- Aucune permission sensible et aucune collecte de donnees.

## Compatibilite

YouTube garde une integration native dans le lecteur. Netflix, Prime Video et Disney+ utilisent aussi une integration dans les controles du lecteur quand l'interface expose un ancrage fiable. Les lecteurs HTML5 generiques sont prevus pour plus tard.

## Publication

- Icônes PNG : `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`.
- Sources SVG : `icons/icon16.svg`, `icons/icon48.svg`, `icons/icon128.svg`.
- Confidentialite : `docs/PRIVACY.md`.
- Texte de fiche publique : `docs/STORE_LISTING.md`.
- Checklist de test : `docs/TEST_PLAN.md`.
- Guide captures : `docs/SCREENSHOT_GUIDE.md`.
- Architecture plateformes : `docs/PLATFORM_ADAPTERS.md`.
