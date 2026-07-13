/**
 * Spanish (es) label pack. Pass to `WidgetronProvider labels={esLabels}` (and
 * `locale="es-ES"`) to render every widget's chrome in Spanish. Build your own
 * pack for any language by mirroring these widget keys.
 */
export const esLabels: Record<string, Record<string, unknown>> = {
  quiz: {
    scenario: "Escenario",
    correct: "Correcto",
    incorrect: "Casi",
    tryAgain: "Probar de nuevo",
    options: "Opciones de respuesta",
  },
  flashcards: {
    prompt: "Pregunta",
    answer: "Respuesta",
    knewIt: "La sabía",
    review: "Repasar",
    previous: "Tarjeta anterior",
    next: "Tarjeta siguiente",
    graded: "valoradas",
    deckComplete: "Mazo completado",
    studyAgain: "Estudiar otra vez",
    summary: (known: number, total: number) =>
      `Sabías ${known} de ${total} tarjeta${total === 1 ? "" : "s"}.`,
    flipToReveal: "Mostrando la pregunta. Actívala para ver la respuesta.",
    flipBack: "Mostrando la respuesta. Actívala para volver.",
  },
  checklist: {
    done: "¡Completado!",
  },
  tangleText: {
    hint: "↔ Arrastra los números subrayados, o enfócalos y usa las flechas.",
    variable: "Valor ajustable",
  },
  frameStepper: {
    play: "Reproducir",
    pause: "Pausa",
    previous: "Paso anterior",
    next: "Paso siguiente",
  },
  terminalSim: {
    run: "Ejecutar siguiente",
    done: "Completado",
    reset: "Reiniciar",
    placeholder: "Pulsa «Ejecutar siguiente» para lanzar el primer comando…",
  },
  flowDiagram: {
    hint: "Selecciona un paso para ver qué ocurre.",
  },
  calloutBox: {
    aha: "Aha",
    info: "Info",
    warning: "Cuidado",
  },
  surprise: {
    surprise: "Sorpresa",
    reveal: "Revelar",
  },
  keywordGate: {
    submit: "Desbloquear",
    hint: "Pista",
    incorrect: "Esa no es — inténtalo otra vez.",
    unlocked: "Desbloqueado",
    placeholder: "Escribe la palabra…",
  },
  cta: {
    emailPlaceholder: "tu@ejemplo.com",
    emailLabel: "Tu correo",
    privacyConsent: "Acepto la política de privacidad",
    submit: "Apuntarme",
    sending: "Enviando…",
    success: "Listo — revisa tu bandeja de entrada.",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
  decisionTree: {
    restart: "Empezar de nuevo",
  },
  compareSlider: {
    before: "Antes",
    after: "Después",
    label: "Comparador",
  },
  fillBlanks: {
    check: "Comprobar",
    correct: "¡Todo correcto!",
    incorrect: "Casi — inténtalo de nuevo.",
    reset: "Reiniciar",
    placeholder: "…",
  },
  predictOutput: {
    reveal: "Ver salida",
    correct: "¡Correcto!",
    incorrect: "Casi",
    tryAgain: "Probar de nuevo",
    question: "¿Qué imprimirá esto?",
    outputLabel: "Salida",
  },
  spotTheBug: {
    prompt: "Toca la línea donde crees que está el bug.",
    found: "¡Lo encontraste!",
    notHere: "En esta línea no es — sigue buscando.",
    tryAgain: "Probar de nuevo",
  },
  dragAndDrop: {
    check: "Comprobar",
    correct: "¡Todo correcto!",
    incorrect: "Algo no encaja aún — inténtalo de nuevo.",
    reset: "Reiniciar",
    instructions: "Toca un elemento y luego su pareja — o arrástralo.",
  },
  groupChat: {
    next: "Siguiente",
    play: "Reproducir todo",
    replay: "Repetir",
    typing: "escribiendo…",
  },
  audioClip: {
    play: "Reproducir",
    pause: "Pausa",
    seek: "Desplazar",
    transcript: "Transcripción",
    restart: "Reiniciar",
    speed: "Velocidad de reproducción",
    volume: "Volumen",
    mute: "Silenciar",
    unmute: "Activar sonido",
    miniPlayer: "Mini reproductor",
    close: "Cerrar mini reproductor",
  },
  videoClip: {
    play: "Reproducir vídeo",
  },
  resourceList: {
    newTab: "se abre en una pestaña nueva",
  },
  promptTemplate: {
    eyebrow: "PROMPT — edita los huecos y copia",
    copy: "Copiar prompt",
    copied: "Copiado",
    copyFailed: "No se pudo copiar",
  },
  storyline: {
    module: (n: number) => `Módulo ${String(n).padStart(2, "0")}`,
    modulesNav: "Módulos",
    resumePrompt: "¿Seguimos donde lo dejaste?",
    resume: "Continuar",
    startOver: "Empezar desde arriba",
    finaleTitle: "¡Has completado la guía!",
    finaleChallenges: (earned: number, total: number) =>
      `Retos superados: ${earned}/${total}`,
    finaleTime: (minutes: number) => `~${minutes} min de lectura`,
    livesLabel: (left: number, total: number) =>
      `Te quedan ${left} de ${total} vidas`,
    finaleGameOverTitle: "¡Te quedaste sin vidas!",
    finaleGameOverHint:
      "Vuelve atrás y clava un reto para recuperar una vida — tu recompensa te espera.",
    tocClose: "Cerrar",
    minutesLeft: (minutes: number) => `Te quedan ~${minutes} min`,
    resumeAt: (moduleTitle: string) => `Te quedaste en «${moduleTitle}»`,
    coverTime: (minutes: number) => `~${minutes} min`,
    coverModules: (count: number) =>
      count === 1 ? "1 módulo" : `${count} módulos`,
    coverChallenges: (count: number) =>
      count === 1 ? "1 reto" : `${count} retos`,
    start: "Empezar",
    readMore: "Leer más",
    moduleDone: (n: number) => `Módulo ${n} ✓`,
    shareResult: "Copiar mi resultado",
    shareCopied: "¡Copiado!",
    shareText: (earned: number, total: number, title: string, url: string) =>
      `Superé ${earned}/${total} retos de «${title}» 🏆 → ${url}`,
    threadNext: "Siguiente",
    threadPrev: "Atrás",
    help: {
      trigger: "Cómo moverte por la guía",
      title: "Cómo moverte por la guía",
      intro: "Es un documento con scroll — léelo a tu ritmo. Con el teclado:",
      rows: [
        { keys: "↓ / ↑", desc: "Avanzar y retroceder" },
        { keys: "Espacio / Shift+Espacio", desc: "Una página abajo o arriba" },
        { keys: "Inicio / Fin", desc: "Ir al principio o al final" },
      ],
      dots: "Toca los puntos de progreso de arriba para saltar de módulo.",
      close: "Cerrar",
    },
    locked: {
      title: "Bloqueado",
      hint: "Responde el reto del módulo anterior para desbloquear este.",
    },
  },
  quote: {
    saidAt: (timestamp: string) => `Dicho en el ${timestamp}`,
    listen: "Escucha este momento",
  },
  codeTranslation: {
    codeLabel: "Código",
    translationLabel: "En palabras sencillas",
  },
  hotspots: {
    emptyHint: "Selecciona un punto para saber más.",
  },
  infographic: {
    icebergZones: ["Lo visible", "Lo oculto"],
  },
  profileQuiz: {
    step: (current: number, total: number) => `${current} / ${total}`,
    summary: (choices: string) => `Contenido adaptado a ti: ${choices}`,
    reset: "Cambiar mis respuestas",
  },
};
