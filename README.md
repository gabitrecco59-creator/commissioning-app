# Avance de Commissioning – versión colaborativa en tiempo real

App estática (sin build) + Firebase Firestore. Archivos:

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app (mismo diseño: Resumen, Mapa, WTG + Historial) |
| `firebase-config.js` | Tu configuración de Firebase (la completás vos) |
| `firestore.rules` | Reglas de seguridad de la base de datos |
| `vercel.json` | Configuración mínima para Vercel |

## 1. Crear el proyecto en Firebase
1. Entrá a https://console.firebase.google.com → **Agregar proyecto** (podés desactivar Analytics).
2. **Compilación → Firestore Database → Crear base de datos** → modo **producción** → ubicación `southamerica-east1` (São Paulo, la más cercana a Argentina).
3. **Compilación → Authentication → Comenzar → Sign-in method → Anónimo → Habilitar.**
4. **Configuración del proyecto (⚙️) → Tus apps → `</>` Web** → registrá la app → copiá el objeto `firebaseConfig`.
5. Pegalo en `firebase-config.js`. Esos datos son públicos por diseño; **no uses ni subas claves de cuenta de servicio / admin**. La seguridad la dan las reglas.

## 2. Publicar las reglas de seguridad
Firestore Database → pestaña **Reglas** → pegá el contenido de `firestore.rules` → **Publicar**.

Qué garantizan:
- Solo usuarios autenticados (anónimos incluidos) leen/escriben.
- Un técnico solo puede cambiar `done` (y quién/cuándo). Observaciones y restauraciones: solo admin.
- El historial solo se agrega: nadie lo edita ni lo borra. Las tareas no se pueden borrar.
- La carga inicial usa una marca `meta/init`: abrir o recargar la app **nunca** reinicia los datos.

## 3. Publicar en Vercel
**Opción A – con GitHub (recomendada)**
1. Subí la carpeta a un repositorio nuevo de GitHub.
2. En https://vercel.com → **Add New → Project** → importá el repo.
3. *Framework Preset*: **Other**. Sin *Build Command* ni *Output Directory*. **Deploy**.

**Opción B – sin GitHub:** `npm i -g vercel`, luego dentro de la carpeta `vercel` y seguí las preguntas (`vercel --prod` para producción).

Después de desplegar:
1. Copiá el dominio (ej. `mi-parque.vercel.app`).
2. Firebase → **Authentication → Settings → Dominios autorizados → Agregar dominio** → pegalo (sin `https://`). Sin esto el login anónimo falla en producción.
3. Compartí el link con el equipo. Desde el celular se puede "Agregar a pantalla de inicio".

## 4. Primer uso y carga inicial
El **primer** usuario que abra la app carga automáticamente los 484 datos de la pizarra (una sola vez, en una transacción). Todos los demás ya los ven. Cada técnico toca **👤 Identificarme** y escribe su nombre (queda en el historial).

## 5. Crear un administrador
1. Abrí la app → **👤** → copiá tu **ID**.
2. Firebase → Firestore → **Iniciar colección** → ID de colección `admins` → ID de documento = tu ID → agregá un campo cualquiera (ej. `rol: "admin"`) → Guardar.
3. Recargá la app: aparece el botón **Restaurar datos originales** y los botones **↩ Revertir** en el Historial.

Nota: el ID anónimo es por navegador/dispositivo. Si el admin borra los datos del navegador, tendrá un ID nuevo y habrá que dar de alta ese ID.

## 6. Cómo funciona (resumen técnico)
- Una colección `projects/parque/tasks` con **un documento por tarea** (`05-1` = WTG 05, PITCH). Cada toque actualiza solo ese documento, por eso dos técnicos en tareas distintas nunca se pisan.
- Cada cambio escribe también un registro en `projects/parque/history` (en el mismo lote atómico), con estado previo para poder revertir.
- Si dos técnicos tocan la **misma** celda a la vez, gana el último en llegar al servidor y ambos cambios quedan en el historial.
- `onSnapshot` actualiza mapa, WTG, porcentajes y gráficos en todos los dispositivos sin recargar.
- Offline: la caché local (IndexedDB) deja seguir marcando; los cambios muestran un **punto naranja** y el banner rojo hasta que el servidor los confirma. Al volver Internet se envían solos. Si el servidor rechaza uno (permisos), aparece un aviso rojo "NO se guardó" y la celda vuelve a su estado real.
- Indicador de estado arriba: 🟢 En vivo · 🟠 Sincronizando · 🔴 Sin conexión / Error.

## 7. Prueba de edición simultánea (2+ usuarios)
Usá dos celulares (o un celular y una PC; o dos ventanas, una en incógnito para tener otro usuario).
1. Ambos abren el link, ponen su nombre y van a la pestaña **Mapa**. Verificá que el indicador diga **En vivo** y que el % total sea el mismo.
2. **Tiempo real:** A marca **PITCH de la WTG 05**. B debe ver, sin recargar, la celda en verde, el % de la WTG 05 y el % total actualizados, y una entrada nueva en **Historial** con el nombre de A.
3. **Cambios simultáneos distintos:** A y B tocan a la vez, cada uno una celda diferente (ej. A: WTG 08/CMS, B: WTG 12/ODM). Ambas deben quedar marcadas en los dos equipos.
4. **Misma celda:** A y B tocan a la vez la misma celda. Ambos terminan viendo el mismo estado final y el Historial muestra los dos toques.
5. **Offline:** en B activá modo avión y marcá 2–3 celdas. Debe aparecer el banner rojo y puntos naranjas; A **no** ve esos cambios todavía. Desactivá el modo avión: los puntos desaparecen y A ve los cambios.
6. **Persistencia:** cerrá la app en ambos y reabrila: el estado se mantiene y los datos originales **no** se restauran.
7. **Seguridad (admin):** con un usuario que no es admin no debe verse el botón de restaurar ni los botones Revertir. Con el admin, probá **↩ Revertir** en una entrada del historial.

## 8. Límites a tener en cuenta
- Cualquier persona con el link puede editar (el acceso anónimo no distingue técnicos autorizados de otros). Si necesitás restringirlo, el siguiente paso es Email/contraseña o Google con una lista de usuarios permitidos en las reglas.
- El plan gratuito de Firebase (Spark) alcanza de sobra para este volumen (484 tareas, pocas decenas de usuarios).
