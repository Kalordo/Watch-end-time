# Architecture plateformes

Le content script est organise autour d'adaptateurs par plateforme.

Chaque adaptateur doit exposer les fonctions suivantes :

- `matchesHost(hostname)` : indique si l'adaptateur gere le domaine courant.
- `findVideo()` : retourne l'element `video` a utiliser pour le calcul.
- `findAnchor()` : retourne la zone de controles cible quand elle existe.
- `renderPlacement(element)` : place le badge dans l'interface.

La logique de calcul reste partagee :

```text
heure de fin = maintenant + (duree totale - temps courant) / vitesse de lecture
```

## Plateformes prevues

- `youtube` : integration native dans les controles du lecteur.
- `netflix` : integration dans les controles du lecteur si un ancrage fiable est detecte.
- `primeVideo` : integration dans les controles du lecteur si un ancrage fiable est detecte.
- `disneyPlus` : integration dans les controles du lecteur si un ancrage fiable est detecte.

Si un adaptateur ne trouve pas d'ancrage propre dans les controles du lecteur, il ne doit rien afficher. Les badges flottants globaux sont volontairement evites.
