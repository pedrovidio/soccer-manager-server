import { z } from 'zod';

const statAttribute = z
  .number({ error: 'O valor deve ser um número entre 0 e 100.' })
  .min(0, 'O valor mínimo é 0.')
  .max(100, 'O valor máximo é 100.');

export const SubmitAssessmentRequestDTO = z.object({
  // Seção 1 — Histórico no Futebol
  playedProfessionally: z.boolean({ error: 'Informe se você já jogou futebol profissionalmente.' }),

  highestLevel: z.enum(['PROFESSIONAL', 'AMATEUR', 'CASUAL'], {
    error: 'Selecione o nível mais alto em que você já competiu.',
  }),

  yearsPlaying: z.enum(['LESS_THAN_2', '2_TO_5', '6_TO_10', 'MORE_THAN_10'], {
    error: 'Selecione há quantos anos você joga futebol regularmente.',
  }),

  weeklyFrequency: z.enum(['RARELY', '1_TO_2', '3_OR_MORE'], {
    error: 'Selecione com que frequência você joga por semana.',
  }),

  // Seção 2 — Autoavaliação dos Atributos Técnicos (0–100)
  selfRatedPace:      statAttribute,
  selfRatedShooting:  statAttribute,
  selfRatedPassing:   statAttribute,
  selfRatedDribbling: statAttribute,
  selfRatedDefense:   statAttribute,
  selfRatedPhysical:  statAttribute,

  // Seção 3 — Posição
  preferredPosition: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward'], {
    error: 'Selecione sua posição preferida.',
  }),
});

export type SubmitAssessmentRequest = z.infer<typeof SubmitAssessmentRequestDTO>;
