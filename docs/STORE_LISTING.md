# Fiche publique

## Nom

Watch End Time

## Createur

3Devs

## Resume court

Affiche l'heure estimee de fin directement dans les lecteurs video compatibles.

## Description

Watch End Time ajoute un badge discret pour indiquer a quelle heure la video devrait se terminer, a la seconde pres.

Le calcul prend en compte la duree restante, l'heure locale et la vitesse de lecture actuelle. Si vous regardez une video en 1.25x, 1.5x ou 2x, l'heure de fin est ajustee automatiquement.

Le badge est integre directement aux controles du lecteur quand une zone de controle fiable est detectee. Si l'extension ne trouve pas d'emplacement propre dans le lecteur, elle n'affiche rien.

## Points cles

- Integration directe dans les controles des lecteurs compatibles.
- Affichage discret, sans badge flottant global.
- Mise a jour automatique pendant la lecture.
- Prise en compte de la vitesse de lecture.
- Fonctionne sans compte, sans configuration et sans collecte de donnees.
- Aucune permission sensible.

## Permissions

L'extension s'execute uniquement sur les sites video compatibles declares dans le manifeste afin d'ajouter le badge de fin estimee. Elle ne lit pas l'historique, ne collecte pas de donnees et ne contacte aucun serveur externe.

## Notes pour la suite

L'architecture reste preparee pour ajouter d'autres plateformes video plus tard, avec une integration native uniquement si elle est stable.
