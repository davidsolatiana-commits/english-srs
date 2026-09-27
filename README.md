# English SRS

App personal de vocabulario inglés (A2 → B2) con repetición espaciada SM-2.

## Arrancar

Doble clic en `iniciar.bat`. Abre `http://localhost:5173` en el navegador.
Para pararla, cierra la ventana negra.

No hay nada que instalar: React y SQLite (sql.js) se cargan desde CDN
y el servidor local es un script de PowerShell (`serve.ps1`).
La primera carga necesita internet.

## Acceso directo en el escritorio (PC)

**English SRS** en el escritorio arranca el servidor local en segundo plano (sin ventana negra),
espera a que responda y abre la **app instalada** (la de "📲 Instalar app", en el menú Inicio);
si no está instalada, abre Edge/Chrome en modo app. Lo hace `abrir-app.ps1`.

La app instalada también se puede abrir desde el menú Inicio, pero así no arranca el servidor:
funciona igual (sin conexión), aunque con la versión que tenía guardada la última vez. Para
recibir los cambios nuevos, ábrela desde el acceso directo del escritorio. Si mueves la carpeta, rehaz el acceso directo con
`crear-acceso-directo.ps1` (clic derecho → *Ejecutar con PowerShell*).

El servidor se queda en segundo plano hasta que apagas o reinicias el PC (gasta casi nada).

## Instalar como app (PWA)

La app es instalable (`manifest.webmanifest` + `sw.js`) y funciona sin conexión una vez abierta
con internet la primera vez (el traductor sí necesita conexión).

- **PC (Chrome/Edge):** botón **📲 Instalar app** en la cabecera, o el icono de instalar de la
  barra de direcciones. Crea acceso directo en el escritorio / menú Inicio y abre en su ventana.
- **Android (Chrome):** botón **📲 Instalar app** o menú ⋮ → *Instalar aplicación*.
- **iPhone/iPad:** *Compartir* → *Añadir a pantalla de inicio* (la app muestra este aviso).

Para el móvil la app tiene que estar publicada en https (p. ej. GitHub Pages): el móvil no ve
el `localhost` del PC. Los datos no se publican: siguen en cada dispositivo.

**Ojo:** cada dirección tiene su propia base de datos (`localhost:5173` ≠ la dirección publicada).
Para pasar tus palabras: *Mis palabras → Descargar copia* en una y *Restaurar copia* en la otra.

`sw.js` guarda los archivos de `APP_FILES`: si añades archivos a `src/`, añádelos a esa lista.

## Dónde están los datos

En el navegador (IndexedDB), como un archivo SQLite completo.
Cada navegador/dispositivo tiene sus propios datos. Si borras los datos
de navegación de `localhost`, se borran las palabras.

**Copia de seguridad:** en *Mis palabras → Copia de seguridad*.
"Descargar copia" baja un `english-srs-AAAA-MM-DD.sqlite`; "Restaurar copia…"
sustituye los datos de este dispositivo por los de la copia (sirve también
para pasar las palabras a otro dispositivo). La app avisa si llevas 7 días sin copia.

## Añadir palabras: traducción automática o manual

El interruptor **"Traducir automáticamente"** (activado por defecto, se recuerda en este dispositivo)
elige el modo:

- **Automático:** al hacer una pausa escribiendo la palabra inglesa, el campo *Español* se rellena
  solo (MyMemory; la palabra se envía a su servidor). Debajo salen otras traducciones para elegir
  con un clic. Si pulsas Enter antes de que llegue, la app espera a la traducción y guarda.
  Lo que escribas o elijas tú nunca se sobrescribe. Sin conexión, te pide que la escribas.
- **Manual:** como siempre; la traducción es obligatoria.

Con palabras sueltas el traductor gratuito falla más que con frases (p. ej. *look forward to*),
por eso la app elige la mejor de varias candidatas y te enseña las alternativas: revísala.

## Práctica

Arriba de la pantalla *Practicar* eliges el **modo** y cuántas **palabras nuevas al día** entran
(por defecto 10; los repasos pendientes entran siempre y van primero).

| Modo | Qué haces | Corrección |
| --- | --- | --- |
| Tarjetas inglés → español | recordar el significado | te valoras tú (4 botones) |
| Tarjetas español → inglés | recordar la palabra inglesa | te valoras tú |
| Opción múltiple | elegir la traducción entre 4 (teclas 1–4) | automática |
| Escribir en inglés | teclear la palabra a partir del español | automática |
| Completar la frase | teclear la palabra que falta en tu frase de ejemplo | automática |

Arriba de *Practicar* eliges el tipo de sesión:

- **Repaso de hoy:** las palabras que tocan según SM-2. Es lo único que cambia las fechas de repaso.
- **Práctica libre:** tantas rondas como quieras, con las palabras que elijas (al azar, las más
  difíciles —menor factor de facilidad— o las últimas añadidas; 10, 20, 50 o todas).
  **No cambia las fechas de repaso**, para no desordenar la repetición espaciada. También se
  ofrece al terminar el repaso del día o cuando no queda nada pendiente.

- **Escritura:** para que se te quede cómo se escribe. Cada palabra se escribe varias veces
  (3, 5 o 10) con cada vez menos ayuda —copia → con pistas (`r_l_a_l_`) → primera letra →
  de memoria— y la oyes cada vez. Mientras copias, cada letra sale verde o roja; de memoria se
  comprueba con Enter y, si fallas, te la hace copiar y repetir. Al final, **dictado** con todas
  las palabras mezcladas y resumen con "Repetir las que me han costado". Desde *Mis palabras*,
  el botón ✍️ practica una palabra concreta. No cambia las fechas de repaso.

**Automático** (por defecto) elige según los aciertos seguidos de cada palabra:
0 → opción múltiple · 1 → tarjeta inglés → español · 2 → tarjeta español → inglés ·
3 o más → escribir o completar la frase.

Al escribir no importan mayúsculas ni puntuación, "to rely" = "rely", y "a / b" acepta
cualquiera de las dos. Una errata leve (una letra; dos en palabras largas; dos letras
cambiadas de sitio) cuenta como *casi*. La **Pista** muestra la primera letra de cada
palabra; si la usas, el acierto cuenta como mucho como *Bien*.

## Gramática

Pestaña *Gramática*, con el temario del artifact «Escalera de gramática» integrado
(`src/lib/grammarContent.js`, extraído tal cual) + 5 unidades añadidas (`grammarExtra.js`:
question words, cuantificadores, phrasal verbs, conectores y subjuntivo): **38 unidades A1 → C1**.

- **Escalera:** niveles con progreso; cada unidad con cuándo se usa, fórmula, tabla, ejemplos con 🔊,
  errores típicos (NO/SÍ) y ejercicios corregidos al momento (`grammarCheck.js`: contracciones =
  formas completas). Con un 80 % la unidad queda **dominada**.
- **Chuleta:** los 12 tiempos, el mismo verbo en todos y 30 irregulares.
- **Repaso:** 10 preguntas al azar por niveles, o **¿Dónde está el error?** (a partir de los errores típicos).
- **Repaso espaciado** (tabla `grammar_progress`): las unidades dominadas vuelven a los 3, 7, 21, 60 y
  120 días; si fallas (menos de 2 de cada 3), al día siguiente. Aviso en *Practicar → Hoy* y contador
  en la pestaña.
- **Un solo temario:** lo que detecta el analizador (Frases, Cuaderno) enlaza con su unidad
  (`grammarDetections.js`), y cada tema del Cuaderno propone unidades para repasar.

El botón flotante **＋** (todas las pantallas) abre *Añadir palabra*.

## Cuaderno (escritura libre)

Pestaña *Escribir → Cuaderno*: notas en inglés con **guardado automático** (tabla `notes`).

- **Temas** (`src/lib/writingPrompts.js`): del diario (A2) a tareas tipo B2 First (essay, review,
  article, email), con objetivo de palabras y consejos. También "Nota en blanco" y "Tema al azar".
- **Intenta usar:** 5 palabras de tu vocabulario (las que más te cuestan); se marcan ✓ al usarlas.
- **¿Cómo se dice…?:** escribes en español → inglés (MyMemory) → *Insertar en el texto* o
  *Guardar en mis palabras*.
- **Revisar texto** (`src/lib/textReview.js`, sin IA): palabras, frases, variedad, estructuras del
  temario por nivel, conectores usados y cuáles faltan, palabras repetidas y alternativas B2 para
  palabras básicas (very, good, thing…). No corrige gramática; la ortografía la subraya el navegador.
- Descargar la nota como `.txt`. Las notas entran en la copia de seguridad.

## Frases

Pestaña *Escribir → Frases rápidas*: escribes una frase en inglés o en español (se detecta el idioma; el botón
"Idioma ⇄" lo corrige) y pulsas Enter.

1. Se **guarda al instante** (tabla `phrases`, estado *pendiente*), aunque no haya internet.
2. En segundo plano se **traduce** con MyMemory (gratis, sin clave; la frase se envía a su
   servidor) y se **analiza** la versión inglesa en el propio navegador con
   [compromise](https://github.com/spencermountain/compromise) + reglas propias:
   tipo de oración, función de cada palabra, tiempos verbales y estructuras del temario
   A2–B2 (`src/lib/grammarTopics.js`) con su nivel.
3. Si algo falla (p. ej. sin conexión) queda con "Reintentar", y se reintenta solo al abrir la app.

El análisis es aproximado (sin IA): no corrige errores. Está preparado para añadir un motor
con IA (campo `analysis_engine`) sin cambiar la tabla.

## Pronunciación y diccionario

- 🔊 junto a cada palabra y frase de ejemplo (y tecla **P** en la práctica). Usa la voz
  del navegador, preferentemente inglés británico; pulsarlo dos veces seguidas lo lee más lento.
- Si el navegador no tiene ninguna voz inglesa, el botón sale atenuado y explica cómo
  arreglarlo (Chrome/Edge traen voces inglesas; o instalar "English (United Kingdom)"
  en Configuración de Windows → Hora e idioma → Voz).
- "Cambridge ↗" abre la palabra en Cambridge Dictionary, que indica el nivel CEFR.

## Estructura

```
index.html              import map (react, react-dom, htm) + sql.js
serve.ps1 / iniciar.bat servidor estático local
src/main.js             arranque: abre la BD y monta <App>
src/lib/db.js           SQLite + IndexedDB, migraciones (PRAGMA user_version), consultas
src/lib/sm2.js          algoritmo SM-2 (4 botones)
src/lib/dates.js        fechas 'YYYY-MM-DD' en hora local
src/lib/speech.js       síntesis de voz (en-GB) y URL de Cambridge Dictionary
src/lib/modes.js        modos de práctica, elección automática y botones según resultado
src/lib/answers.js      corrección de respuestas escritas, huecos y pistas
src/lib/settings.js     ajustes de práctica (localStorage)
src/lib/phrases.js      detección de idioma y cola de procesado de frases
src/lib/translate.js    traducción (MyMemory): frases y palabras sueltas con alternativas
src/lib/analyzer.js     análisis gramatical local (compromise + reglas del temario)
src/lib/grammarTopics.js temario A2–B2 (ids estables para el paso 5)
src/components/         App (pestañas + ajustes), AddWord, WordList, Practice (sesión),
                        PracticeCards (un componente por modo), WritingPractice (escritura),
                        Phrases, Backup, InstallButton, WordTools (🔊 y enlace)
```

Los componentes usan `htm` (html`<${Comp} />`) en lugar de JSX, así que no hay paso
de build. Si más adelante se instala Node, migrar a Vite es convertir esas plantillas a JSX.

## Roadmap

- [x] 1. Tabla `words`, formulario de añadir, listado
- [x] 2. SM-2 + pantalla de práctica con flashcards (inglés → español)
- [x] 3. Modos de ejercicio adicionales (+ español → inglés y límite de nuevas al día)
- [ ] 4. Dashboard y objetivos diarios
- [x] 5–6. Gramática: temario y práctica (con repaso espaciado por unidad)
- [x] 7. Conexión gramática ↔ Frases/Cuaderno (falta enlazar palabras concretas con unidades)
- [x] 8. PWA (instalable y sin conexión)
