# Watch End Time for YouTube

Extension Chrome/Edge qui affiche l'heure estimee de fin directement dans le lecteur YouTube.

Le badge tient compte de la duree restante, de l'heure locale et de la vitesse de lecture.

Createur : 3Devs.

## Installation locale

1. Ouvrir `chrome://extensions` ou `edge://extensions`.
2. Activer le mode developpeur.
3. Cliquer sur `Charger l'extension non empaquetee`.
4. Selectionner ce dossier : `C:\Users\Yohann\youtube-end-time-extension`.
5. Ouvrir une video YouTube.

## Fonctionnalites

- Affichage `Fin HH:MM` integre dans les controles YouTube.
- Mise a jour pendant la lecture, apres pause/reprise, seek et changement de vitesse.
- Detection des videos terminees et des lives sans duree fiable.
- Aucune permission sensible et aucune collecte de donnees.

## Compatibilite

La premiere version publique cible YouTube. Le code est structure pour ajouter d'autres plateformes ensuite, comme Netflix, Prime Video ou Disney+, avec un badge natif quand c'est fiable et un badge flottant sinon.

## Publication

- Icônes PNG : `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`.
- Sources SVG : `icons/icon16.svg`, `icons/icon48.svg`, `icons/icon128.svg`.
- Confidentialite : `docs/PRIVACY.md`.
- Texte de fiche publique : `docs/STORE_LISTING.md`.
- Checklist de test : `docs/TEST_PLAN.md`.
- Guide captures : `docs/SCREENSHOT_GUIDE.md`.
- Architecture plateformes : `docs/PLATFORM_ADAPTERS.md`.
