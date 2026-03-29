---
description: Regla para bottom sheets y modales desplegables en mobile
---

# Regla: Bottom Padding en Bottom Sheets / Modales Mobile

Cada vez que crees un nuevo bottom sheet, drawer, o modal desplegable desde abajo en la app mobile, **el área de scroll interna siempre debe tener padding inferior suficiente** para que el último elemento no quede oculto detrás del nav bar.

## Regla CSS obligatoria

El contenedor scrollable del bottom sheet debe usar:

```css
.mi-modal-body {
    overflow-y: auto;
    flex: 1;
    padding: 20px;
    /* OBLIGATORIO: espacio para el nav bar (~64px) + safe area de iPhone */
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
```

## Por qué

- El nav bar móvil mide ~64px de alto
- `env(safe-area-inset-bottom)` cubre el "home indicator" de iPhones con notch/Dynamic Island
- Sin esto, el último botón o contenido queda tapado y el usuario no puede acceder a él

## Checklist al crear un nuevo bottom sheet

- [ ] El contenedor tiene `overflow-y: auto` y `flex: 1`
- [ ] El `padding-bottom` usa `calc(80px + env(safe-area-inset-bottom, 0px))`
- [ ] Se probó haciendo scroll hasta el fondo en mobile para confirmar que todo el contenido es accesible
