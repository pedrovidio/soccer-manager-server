import { FootballLevel } from './Athlete.js';

/**
 * Estrutura do questionário (enviado ao app cliente):
 *
 * SEÇÃO 1 — Histórico no Futebol (determina o FootballLevel)
 * Q1: "Qual o nível mais alto em que você já competiu?"
 *     opções:
 *       "Liga profissional / semiprofissional"  → PROFESSIONAL
 *       "Liga amadora / torneio organizado"     → AMATEUR
 *       "Recreativo / várzea apenas"            → CASUAL
 *
 * Q3: "Há quantos anos você joga futebol regularmente?"
 *     opções: ["Menos de 2 anos", "2 a 5 anos", "6 a 10 anos", "Mais de 10 anos"]
 *     (usado como peso de desempate — armazenado para analytics)
 *
 * Q4: "Com que frequência você joga atualmente por semana?"
 *     opções: ["Raramente (menos de uma vez por semana)", "1 a 2 vezes", "3 vezes ou mais"]
 *
 * SEÇÃO 2 — Autoavaliação dos Atributos Técnicos (sliders de 0 a 100)
 * Q5:  Pace       — "Qual é a sua velocidade? (velocidade de sprint e aceleração)"
 * Q6:  Shooting   — "Qual é a precisão e potência do seu chute?"
 * Q7:  Passing    — "Qual é a precisão dos seus passes curtos e longos?"
 * Q8:  Dribbling  — "Qual é o seu controle de bola sob pressão?"
 * Q9:  Defense    — "Qual é a sua eficiência em recuperar a bola?"
 * Q10: Physical   — "Qual é a sua força e resistência durante uma partida completa?"
 *
 * SEÇÃO 3 — Posição
 * Q11: "Qual é a sua posição preferida?"
 *      opções: ["Goleiro", "Defensor", "Meio-campista", "Atacante"]
 */

export interface AssessmentAnswers {
  // Seção 1 — Histórico
  highestLevel: 'PROFESSIONAL' | 'AMATEUR' | 'CASUAL';
  yearsPlaying: 'LESS_THAN_2' | '2_TO_5' | '6_TO_10' | 'MORE_THAN_10';
  weeklyFrequency: 'RARELY' | '1_TO_2' | '3_OR_MORE';

  // Seção 2 — Autoavaliação 0–100
  selfRatedPace: number;
  selfRatedShooting: number;
  selfRatedPassing: number;
  selfRatedDribbling: number;
  selfRatedDefense: number;
  selfRatedPhysical: number;

  // Seção 3 — Posição
  preferredPosition: string;
}

export class AssessmentAnswer {
  public readonly athleteId: string;
  public readonly answers: AssessmentAnswers;
  public readonly submittedAt: Date;

  constructor(athleteId: string, answers: AssessmentAnswers, submittedAt?: Date) {
    this.athleteId = athleteId;
    this.answers = answers;
    this.submittedAt = submittedAt ?? new Date();
  }

  deriveFootballLevel(): FootballLevel {
    return this.answers.highestLevel;
  }
}
