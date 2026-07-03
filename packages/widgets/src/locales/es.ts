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
  },
  videoClip: {
    play: "Reproducir vídeo",
  },
  promptTemplate: {
    eyebrow: "PROMPT — edita los huecos y copia",
    copy: "Copiar prompt",
    copied: "Copiado",
    copyFailed: "No se pudo copiar",
  },
  profileQuiz: {
    step: (current: number, total: number) => `${current} / ${total}`,
    summary: (choices: string) => `Contenido adaptado a ti: ${choices}`,
    reset: "Cambiar mis respuestas",
  },
};
