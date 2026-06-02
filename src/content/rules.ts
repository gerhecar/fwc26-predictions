export interface RuleSection {
  id: string
  title: string
  content: string[]
}

export const RULES: RuleSection[] = [
  {
    id: 'objective',
    title: 'Objetivo',
    content: [
      'El objetivo de este juego de predicciones es acertar la mayor cantidad de resultados posibles de la Copa Mundial de la FIFA 2026.',
      'Cada participante debe predecir el resultado de cada grupo, los equipos clasificados como mejores terceros, y el ganador de cada partido de la fase eliminatoria, incluyendo el campeón del mundo.',
      'El participante con la mayor cantidad de puntos al final del torneo será el ganador.',
    ],
  },
  {
    id: 'participation',
    title: 'Reglas de Participación',
    content: [
      'Cada usuario puede crear un máximo de 2 apuestas (predicciones) para todo el torneo.',
      'Cada apuesta debe tener un nombre único para el usuario.',
      'Las apuestas pueden ser creadas directamente por el usuario o mediante un enlace de invitación enviado a un invitado externo.',
      'Los invitados externos no necesitan registrarse ni iniciar sesión. Completan la predicción a través de un enlace único y la apuesta se guarda bajo la cuenta del usuario que generó la invitación.',
      'Cada enlace de invitación es de un solo uso, tiene una validez de 7 días y puede ser revocado por el usuario en cualquier momento.',
      'Una vez enviada, la apuesta queda en estado "pendiente" hasta que un administrador la valide.',
      'Solo las apuestas validadas por un administrador son elegibles para puntuación y aparecen en el leaderboard.',
    ],
  },
  {
    id: 'phases',
    title: 'Fases de Predicción del Torneo',
    content: [
      'El torneo se divide en tres fases principales para la predicción:',
      '',
      'Fase de Grupos: Predecir la posición exacta (1° al 4°) de cada equipo en cada uno de los 12 grupos (A a L).',
      '',
      'Mejores Terceros: Seleccionar qué 4 grupos aportarán los mejores equipos en tercera posición que avanzan a octavos de final.',
      '',
      'Fase Eliminatoria (Knockout): Predecir el ganador de cada partido desde octavos de final (R32) hasta la final, incluyendo el campeón del mundo.',
    ],
  },
  {
    id: 'scoring',
    title: 'Sistema de Puntuación',
    content: [
      'Los puntos se asignan de la siguiente manera según la fase y la precisión de la predicción:',
      '',
      'FASE DE GRUPOS:',
      '• Posición exacta (1° o 2°): 10 puntos por equipo.',
      '• Equipo correcto pero posición incorrecta (ej. lo tienes en el grupo pero en otro puesto): 5 puntos por equipo.',
      '• Equipo no presente en el grupo real: 0 puntos.',
      '',
      'MEJORES TERCEROS:',
      '• Acertar un equipo clasificado como mejor tercero: 10 puntos por equipo.',
      '',
      'FASE ELIMINATORIA:',
      '• R32 (Octavos de final): 20 puntos por equipo acertado.',
      '• R16 (Cuartos de final): 35 puntos por equipo acertado.',
      '• QF (Semifinales): 50 puntos por equipo acertado.',
      '• SF (Final): 75 puntos por equipo acertado.',
      '• Campeón: 150 puntos.',
      '',
      'Los puntos se acumulan a lo largo del torneo. No hay límite máximo de puntos.',
    ],
  },
  {
    id: 'scores-table',
    title: 'Tabla Resumen de Puntuación',
    content: [],
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    content: [
      'El leaderboard muestra el ranking de todas las apuestas validadas, ordenadas por puntuación total de mayor a menor.',
      '',
      'Mientras el torneo está en progreso y los resultados son borradores, el leaderboard muestra puntuaciones provisorias.',
      'Los puntajes provisorios se calculan automáticamente cada vez que el administrador guarda resultados.',
      'Una vez que una fase es bloqueada por el administrador, los puntajes de esa fase se vuelven oficiales.',
      'Cuando todas las fases están bloqueadas, el leaderboard muestra puntuaciones oficiales definitivas.',
      '',
      'Los puntajes oficiales solo incluyen puntos de fases que han sido bloqueadas. Las fases en borrador no contribuyen al puntaje oficial.',
    ],
  },
  {
    id: 'tiebreakers',
    title: 'Reglas de Desempate',
    content: [
      'Si dos o más apuestas tienen el mismo puntaje total, se aplican los siguientes criterios de desempate en orden:',
      '',
      '1. Campeón Correcto: La apuesta que haya acertado el campeón del mundo tiene prioridad.',
      '2. Finalistas Correctos: Mayor cantidad de finalistas acertados (ganadores de semifinales).',
      '3. Semifinalistas Correctos: Mayor cantidad de semifinalistas acertados (ganadores de cuartos de final).',
      '4. Cuartofinalistas Correctos: Mayor cantidad de cuartofinalistas acertados (ganadores de octavos de final).',
      '5. Equipos Clasificados Correctos: Mayor cantidad de equipos acertados que avanzaron de la fase de grupos (1° y 2° de cada grupo + mejores terceros). La posición no importa.',
      '6. Puntaje en Knockout: Mayor puntaje obtenido solo en la fase eliminatoria (R32 + R16 + QF + SF + Campeón).',
      '7. Fecha de Envío: La apuesta enviada más temprano tiene prioridad.',
      '',
      'Si después de aplicar todos los criterios las apuestas siguen empatadas, comparten la misma posición en el ranking.',
    ],
  },
  {
    id: 'fairplay',
    title: 'Juego Limpio y Administración',
    content: [
      'Los administradores del torneo se reservan el derecho de validar, modificar o eliminar cualquier apuesta que no cumpla con las reglas.',
      'Cualquier intento de manipulación, uso de múltiples cuentas o comportamiento fraudulento resultará en la descalificación del participante.',
      'Las decisiones de los administradores son definitivas.',
      'Los resultados oficiales del torneo son la fuente de verdad para la puntuación. Cualquier controversia será resuelta por los administradores.',
      'El leaderboard se actualiza automáticamente a medida que se guardan resultados y se bloquean fases.',
    ],
  },
  {
    id: 'goodluck',
    title: '¡Buena Suerte!',
    content: [
      'Que comience el juego. Que gane el mejor pronosticador.',
      '¡Buena suerte a todos los participantes!',
    ],
  },
]

export const SCORING_TABLE = [
  { phase: 'Grupos — Posición exacta', points: 10 },
  { phase: 'Grupos — Posición incorrecta', points: 5 },
  { phase: 'Mejores Terceros', points: 10 },
  { phase: 'R32 (Octavos de final)', points: 20 },
  { phase: 'R16 (Cuartos de final)', points: 35 },
  { phase: 'QF (Semifinales)', points: 50 },
  { phase: 'SF (Final)', points: 75 },
  { phase: 'Campeón', points: 150 },
]
