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
    finaleChallenges: (correct: number, answered: number) =>
      `Retos superados: ${correct}/${answered}`,
    finaleActivities: (count: number) => `Actividades completadas: ${count}`,
    finaleTime: (minutes: number) => `~${minutes} min de lectura`,
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
