import { Athlete, Stats, FootballLevel } from '../core/domain/entities/Athlete.js';
import { AssessmentAnswer, AssessmentAnswers } from '../core/domain/entities/AssessmentAnswer.js';
import { RegisterAthleteUseCase } from '../core/use-cases/RegisterAthleteUseCase.js';
import { SubmitAssessmentUseCase } from '../core/use-cases/SubmitAssessmentUseCase.js';
import { RegisterRatingUseCase } from '../core/use-cases/RegisterRatingUseCase.js';
import { SearchAthletesUseCase } from '../core/use-cases/SearchAthletesUseCase.js';
import { UpdateAthleteLocationUseCase } from '../core/use-cases/UpdateAthleteLocationUseCase.js';
import { UploadAthletePhotoUseCase } from '../core/use-cases/UploadAthletePhotoUseCase.js';
import { BusinessRuleViolationError } from '../core/domain/errors/BusinessRuleViolationError.js';
import { EntityNotFoundError } from '../core/domain/errors/EntityNotFoundError.js';
import { IAthleteRepository } from '../core/domain/repositories/IAthleteRepository.js';
import { IAssessmentRepository } from '../core/domain/repositories/IAssessmentRepository.js';
import { IPerformanceRatingRepository } from '../core/domain/repositories/IPerformanceRatingRepository.js';
import { IMatchRepository } from '../core/domain/repositories/IMatchRepository.js';
import { Match, MatchStatus } from '../core/domain/entities/Match.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return { pace: 60, shooting: 60, passing: 60, dribbling: 60, defense: 60, physical: 60, ...overrides };
}

function makeAthlete(overrides: Partial<{
  id: string; position: string; footballLevel: FootballLevel;
  stats: Stats; financialDebt: number; isInjured: boolean; hasCompletedAssessment: boolean;
}> = {}): Athlete {
  return new Athlete(
    'João Silva', '12345678901', 'joao@email.com', '51987654321',
    { cep: '90000-000', street: 'Rua A', number: '1', complement: undefined, neighborhood: 'Centro', city: 'Porto Alegre', state: 'RS' },
    25, 'M', overrides.position ?? 'Midfielder',
    overrides.stats ?? makeStats(),
    overrides.footballLevel ?? 'AMATEUR',
    overrides.id,
    undefined, undefined, false,
    overrides.isInjured ?? false,
    overrides.financialDebt ?? 0,
    overrides.hasCompletedAssessment ?? false,
  );
}

function makeAssessmentAnswers(overrides: Partial<AssessmentAnswers> = {}): AssessmentAnswers {
  return {
    playedProfessionally: false,
    highestLevel: 'AMATEUR',
    yearsPlaying: '2_TO_5',
    weeklyFrequency: '1_TO_2',
    selfRatedPace: 70, selfRatedShooting: 65, selfRatedPassing: 72,
    selfRatedDribbling: 68, selfRatedDefense: 60, selfRatedPhysical: 75,
    preferredPosition: 'Midfielder',
    ...overrides,
  };
}

// ─── Mock Repositories ───────────────────────────────────────────────────────

function makeAthleteRepo(store: Map<string, Athlete> = new Map()): IAthleteRepository {
  return {
    findById:       async (id) => store.get(id) ?? null,
    findByCpf:      async (cpf) => [...store.values()].find((a) => a.cpf === cpf) ?? null,
    findByEmail:    async (email) => [...store.values()].find((a) => a.email === email) ?? null,
    save:           async (a) => { store.set(a.id, a); },
    updateLocation: async () => {},
    findNearby:     async () => [],
    search:         async (f) => [...store.values()].filter((a) =>
      (!f.name  || a.name.includes(f.name)) &&
      (!f.cpf   || a.cpf === f.cpf) &&
      (!f.email || a.email === f.email)
    ),
  };
}

function makeAssessmentRepo(): IAssessmentRepository {
  return {
    save: async () => {},
    findByAthleteId: async () => null,
  };
}

function makeRatingRepo(ratings: Array<{ id: string; matchId: string; ratedBy: string; ratedAthlete: string; stats: Stats; createdAt: Date }> = []): IPerformanceRatingRepository {
  return {
    save:                  async (r) => { ratings.push(r); },
    hasRated:              async (matchId, ratedBy, ratedAthlete) =>
      ratings.some((r) => r.matchId === matchId && r.ratedBy === ratedBy && r.ratedAthlete === ratedAthlete),
    findByMatchAndAthlete: async (matchId, ratedAthlete) =>
      ratings.filter((r) => r.matchId === matchId && r.ratedAthlete === ratedAthlete),
    findByMatchAndRater:   async (matchId, ratedBy) =>
      ratings.filter((r) => r.matchId === matchId && r.ratedBy === ratedBy),
  };
}

function makeFinishedMatch(confirmedIds: string[]): Match {
  return new Match(
    'group-1', 'SOCIETY', new Date(Date.now() - 3600_000),
    'Arena', -30.03, -51.2, 10,
    0, 10, 0, 16, 99,
    confirmedIds, [], MatchStatus.FINISHED, 'match-1',
  );
}

function makeMatchRepo(match: Match | null): IMatchRepository {
  return { findById: async () => match } as unknown as IMatchRepository;
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(label: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err: any) {
    console.log(`  ❌ ${label}`);
    console.log(`     → ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function assertThrows(fn: () => unknown, errorClass: Function, message?: string) {
  try {
    await fn();
    throw new Error(`Expected ${errorClass.name} but nothing was thrown`);
  } catch (err: unknown) {
    if (!(err instanceof errorClass)) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Expected ${errorClass.name}, got: ${msg}`);
    }
    if (message) assert((err as Error).message.includes(message), `Expected message to include "${message}", got "${(err as Error).message}"`);
  }
}

// ─── Athlete Entity ───────────────────────────────────────────────────────────

console.log('\n━━━ Athlete Entity — Validation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('creates athlete with valid data', () => {
  const a = makeAthlete();
  assert(a.name === 'João Silva', 'name must match');
  assert(a.calculateOverall() > 0, 'overall must be positive');
});

await test('rejects empty name', () => {
  assertThrows(() => new Athlete(
    '', '12345678901', 'a@b.com', '51987654321',
    { cep: '90000-000', street: 'R', number: '1', complement: undefined, neighborhood: 'N', city: 'C', state: 'RS' },
    25, 'M', 'Midfielder', makeStats(), 'AMATEUR',
  ), BusinessRuleViolationError, 'Name cannot be empty');
});

await test('rejects CPF with wrong digit count', () => {
  assertThrows(() => new Athlete(
    'Test', '123', 'a@b.com', '51987654321',
    { cep: '90000-000', street: 'R', number: '1', complement: undefined, neighborhood: 'N', city: 'C', state: 'RS' },
    25, 'M', 'Midfielder', makeStats(), 'AMATEUR',
  ), BusinessRuleViolationError, 'CPF');
});

await test('rejects invalid email format', () => {
  assertThrows(() => new Athlete(
    'Test', '12345678901', 'not-an-email', '51987654321',
    { cep: '90000-000', street: 'R', number: '1', complement: undefined, neighborhood: 'N', city: 'C', state: 'RS' },
    25, 'M', 'Midfielder', makeStats(), 'AMATEUR',
  ), BusinessRuleViolationError, 'Email');
});

await test('rejects age below 16', () => {
  assertThrows(() => new Athlete(
    'Test', '12345678901', 'a@b.com', '51987654321',
    { cep: '90000-000', street: 'R', number: '1', complement: undefined, neighborhood: 'N', city: 'C', state: 'RS' },
    15, 'M', 'Midfielder', makeStats(), 'AMATEUR',
  ), BusinessRuleViolationError, 'Age');
});

await test('rejects stat above 100', () => {
  assertThrows(() => makeAthlete({ stats: makeStats({ pace: 101 }) }), BusinessRuleViolationError, 'pace');
});

await test('rejects stat below 0', () => {
  assertThrows(() => makeAthlete({ stats: makeStats({ defense: -1 }) }), BusinessRuleViolationError, 'defense');
});

// ─── Athlete Entity — Overall ─────────────────────────────────────────────────

console.log('\n━━━ Athlete Entity — Overall Calculation ━━━━━━━━━━━━━━━━━━━━━━━');

await test('calculateOverall returns value between 0 and 100', () => {
  const overall = makeAthlete().calculateOverall();
  assert(overall >= 0 && overall <= 100, `overall ${overall} out of range`);
});

await test('goalkeeper overall weights defense more', () => {
  const stats = makeStats({ defense: 100, pace: 0, shooting: 0, passing: 0, dribbling: 0, physical: 0 });
  const gk = makeAthlete({ position: 'goalkeeper', stats });
  const mid = makeAthlete({ position: 'Midfielder', stats });
  assert(gk.calculateOverall() > mid.calculateOverall(), 'goalkeeper should score higher with max defense');
});

await test('calculateWeightedOverall: PROFESSIONAL > AMATEUR > CASUAL for same stats', () => {
  const pro    = makeAthlete({ footballLevel: 'PROFESSIONAL' });
  const amateur = makeAthlete({ footballLevel: 'AMATEUR' });
  const casual  = makeAthlete({ footballLevel: 'CASUAL' });
  assert(pro.calculateWeightedOverall() > amateur.calculateWeightedOverall(), 'PROFESSIONAL > AMATEUR');
  assert(amateur.calculateWeightedOverall() > casual.calculateWeightedOverall(), 'AMATEUR > CASUAL');
});

// ─── Athlete Entity — updatePerformance ──────────────────────────────────────

console.log('\n━━━ Athlete Entity — updatePerformance ━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('updatePerformance changes stats correctly', () => {
  const a = makeAthlete();
  a.updatePerformance({ pace: 90 });
  assert(a.getStats().pace === 90, 'pace must be updated');
});

await test('updatePerformance rejects invalid stat value', () => {
  const a = makeAthlete();
  assertThrows(() => a.updatePerformance({ shooting: 150 }), BusinessRuleViolationError, 'shooting');
});

// ─── Athlete Entity — completeAssessment ─────────────────────────────────────

console.log('\n━━━ Athlete Entity — completeAssessment ━━━━━━━━━━━━━━━━━━━━━━━━');

await test('completeAssessment sets footballLevel and position', () => {
  const a = makeAthlete();
  a.completeAssessment('PROFESSIONAL', 'Striker', makeStats({ shooting: 90 }));
  assert(a.footballLevel === 'PROFESSIONAL', 'footballLevel must be updated');
  assert(a.position === 'Striker', 'position must be updated');
  assert(a.hasCompletedAssessment === true, 'hasCompletedAssessment must be true');
});

await test('completeAssessment throws if already completed', () => {
  const a = makeAthlete({ hasCompletedAssessment: true });
  assertThrows(() => a.completeAssessment('AMATEUR', 'Midfielder', makeStats()), BusinessRuleViolationError, 'already been completed');
});

// ─── AssessmentAnswer ─────────────────────────────────────────────────────────

console.log('\n━━━ AssessmentAnswer — deriveFootballLevel ━━━━━━━━━━━━━━━━━━━━━');

await test('playedProfessionally=true always returns PROFESSIONAL', () => {
  const a = new AssessmentAnswer('id', makeAssessmentAnswers({ playedProfessionally: true, highestLevel: 'CASUAL' }));
  assert(a.deriveFootballLevel() === 'PROFESSIONAL', 'must be PROFESSIONAL');
});

await test('playedProfessionally=false uses highestLevel', () => {
  const a = new AssessmentAnswer('id', makeAssessmentAnswers({ playedProfessionally: false, highestLevel: 'CASUAL' }));
  assert(a.deriveFootballLevel() === 'CASUAL', 'must be CASUAL');
});

// ─── RegisterAthleteUseCase ───────────────────────────────────────────────────

console.log('\n━━━ RegisterAthleteUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const baseInput = {
  name: 'Maria Souza', email: 'maria@email.com', cpf: '98765432100',
  phone: '51912345678', age: 22, gender: 'F' as const,
  address: { cep: '90000-000', street: 'Rua B', number: '2', complement: undefined, neighborhood: 'Bairro', city: 'Porto Alegre', state: 'RS' },
  password: 'senha123',
};

await test('registers athlete and persists to repository', async () => {
  const store = new Map<string, Athlete>();
  const uc = new RegisterAthleteUseCase(makeAthleteRepo(store));
  const result = await uc.execute(baseInput);
  assert(!!result.id, 'id must be defined');
  assert(store.has(result.id), 'athlete must be in store');
  assert(result.passwordHash !== undefined, 'passwordHash must be set');
});

await test('rejects duplicate CPF', async () => {
  const store = new Map<string, Athlete>();
  const repo = makeAthleteRepo(store);
  const uc = new RegisterAthleteUseCase(repo);
  await uc.execute(baseInput);
  await assertThrows(() => uc.execute({ ...baseInput, email: 'other@email.com' }), BusinessRuleViolationError, 'CPF');
});

await test('rejects duplicate email', async () => {
  const store = new Map<string, Athlete>();
  const repo = makeAthleteRepo(store);
  const uc = new RegisterAthleteUseCase(repo);
  await uc.execute(baseInput);
  await assertThrows(() => uc.execute({ ...baseInput, cpf: '11122233344' }), BusinessRuleViolationError, 'email');
});

await test('rejects registration without password or tempToken', async () => {
  const uc = new RegisterAthleteUseCase(makeAthleteRepo());
  const { password: _, ...inputWithoutPassword } = baseInput;
  await assertThrows(() => uc.execute(inputWithoutPassword), BusinessRuleViolationError, 'password or tempToken');
});

// ─── SubmitAssessmentUseCase ──────────────────────────────────────────────────

console.log('\n━━━ SubmitAssessmentUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('submits assessment and updates athlete', async () => {
  const athlete = makeAthlete({ id: 'athlete-1' });
  const store = new Map([['athlete-1', athlete]]);
  const uc = new SubmitAssessmentUseCase(makeAthleteRepo(store), makeAssessmentRepo());
  await uc.execute({ athleteId: 'athlete-1', answers: makeAssessmentAnswers() });
  assert(store.get('athlete-1')!.hasCompletedAssessment, 'hasCompletedAssessment must be true');
});

await test('throws EntityNotFoundError for unknown athlete', async () => {
  const uc = new SubmitAssessmentUseCase(makeAthleteRepo(), makeAssessmentRepo());
  await assertThrows(() => uc.execute({ athleteId: 'ghost', answers: makeAssessmentAnswers() }), EntityNotFoundError);
});

await test('throws if assessment already completed', async () => {
  const athlete = makeAthlete({ id: 'athlete-2', hasCompletedAssessment: true });
  const store = new Map([['athlete-2', athlete]]);
  const uc = new SubmitAssessmentUseCase(makeAthleteRepo(store), makeAssessmentRepo());
  await assertThrows(() => uc.execute({ athleteId: 'athlete-2', answers: makeAssessmentAnswers() }), BusinessRuleViolationError, 'already been completed');
});

// ─── RegisterRatingUseCase ────────────────────────────────────────────────────

console.log('\n━━━ RegisterRatingUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('registers rating and updates athlete overall', async () => {
  const rater   = makeAthlete({ id: 'rater-1' });
  const rated   = makeAthlete({ id: 'rated-1' });
  const store   = new Map([['rater-1', rater], ['rated-1', rated]]);
  const match   = makeFinishedMatch(['rater-1', 'rated-1']);
  const ratings: any[] = [];
  const uc = new RegisterRatingUseCase(makeMatchRepo(match), makeAthleteRepo(store), makeRatingRepo(ratings));
  const result = await uc.execute({ matchId: 'match-1', ratedBy: 'rater-1', ratedAthlete: 'rated-1', stats: makeStats({ pace: 80 }) });
  assert(!!result.ratingId, 'ratingId must be defined');
  assert(result.newOverall > 0, 'newOverall must be positive');
  assert(ratings.length === 1, 'rating must be persisted');
});

await test('throws if athlete rates themselves', async () => {
  const uc = new RegisterRatingUseCase(makeMatchRepo(null), makeAthleteRepo(), makeRatingRepo());
  await assertThrows(() => uc.execute({ matchId: 'm', ratedBy: 'a1', ratedAthlete: 'a1', stats: makeStats() }), BusinessRuleViolationError, 'themselves');
});

await test('throws if match not found', async () => {
  const uc = new RegisterRatingUseCase(makeMatchRepo(null), makeAthleteRepo(), makeRatingRepo());
  await assertThrows(() => uc.execute({ matchId: 'ghost', ratedBy: 'a1', ratedAthlete: 'a2', stats: makeStats() }), EntityNotFoundError);
});

await test('throws if match is not FINISHED', async () => {
  const rater = makeAthlete({ id: 'rater-2' });
  const rated = makeAthlete({ id: 'rated-2' });
  const store = new Map([['rater-2', rater], ['rated-2', rated]]);
  const match = new Match('g', 'SOCIETY', new Date(Date.now() + 3600_000), 'Arena', -30.03, -51.2, 10, 0, 10, 0, 16, 99, ['rater-2', 'rated-2'], [], MatchStatus.SCHEDULED, 'match-2');
  const uc = new RegisterRatingUseCase(makeMatchRepo(match), makeAthleteRepo(store), makeRatingRepo());
  await assertThrows(() => uc.execute({ matchId: 'match-2', ratedBy: 'rater-2', ratedAthlete: 'rated-2', stats: makeStats() }), BusinessRuleViolationError, 'finished');
});

await test('throws if rater did not participate in match', async () => {
  const rater = makeAthlete({ id: 'outsider' });
  const rated = makeAthlete({ id: 'rated-3' });
  const store = new Map([['outsider', rater], ['rated-3', rated]]);
  const match = makeFinishedMatch(['rated-3']); // outsider not in confirmedIds
  const uc = new RegisterRatingUseCase(makeMatchRepo(match), makeAthleteRepo(store), makeRatingRepo());
  await assertThrows(() => uc.execute({ matchId: 'match-1', ratedBy: 'outsider', ratedAthlete: 'rated-3', stats: makeStats() }), BusinessRuleViolationError, 'participated');
});

await test('throws on duplicate rating', async () => {
  const rater = makeAthlete({ id: 'rater-3' });
  const rated = makeAthlete({ id: 'rated-4' });
  const store = new Map([['rater-3', rater], ['rated-4', rated]]);
  const match = makeFinishedMatch(['rater-3', 'rated-4']);
  const ratings: any[] = [];
  const uc = new RegisterRatingUseCase(makeMatchRepo(match), makeAthleteRepo(store), makeRatingRepo(ratings));
  await uc.execute({ matchId: 'match-1', ratedBy: 'rater-3', ratedAthlete: 'rated-4', stats: makeStats() });
  await assertThrows(() => uc.execute({ matchId: 'match-1', ratedBy: 'rater-3', ratedAthlete: 'rated-4', stats: makeStats() }), BusinessRuleViolationError, 'already rated');
});

// ─── SearchAthletesUseCase ────────────────────────────────────────────────────

console.log('\n━━━ SearchAthletesUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('finds athlete by name', async () => {
  const athlete = makeAthlete({ id: 'search-1' });
  const store = new Map([['search-1', athlete]]);
  const uc = new SearchAthletesUseCase(makeAthleteRepo(store));
  const results = await uc.execute({ name: 'João' });
  assert(results.length === 1, 'must find 1 athlete');
  assert(results[0]!.id === 'search-1', 'id must match');
});

await test('throws if no filter provided', async () => {
  const uc = new SearchAthletesUseCase(makeAthleteRepo());
  await assertThrows(() => uc.execute({}), BusinessRuleViolationError, 'filter');
});

await test('returns empty array when no match found', async () => {
  const uc = new SearchAthletesUseCase(makeAthleteRepo());
  const results = await uc.execute({ name: 'Nonexistent' });
  assert(results.length === 0, 'must return empty array');
});

// ─── UpdateAthleteLocationUseCase ─────────────────────────────────────────────

console.log('\n━━━ UpdateAthleteLocationUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('updates location for existing athlete', async () => {
  const athlete = makeAthlete({ id: 'loc-1' });
  const store = new Map([['loc-1', athlete]]);
  const uc = new UpdateAthleteLocationUseCase(makeAthleteRepo(store));
  await uc.execute({ athleteId: 'loc-1', latitude: -30.03, longitude: -51.2 });
  // no throw = success
  assert(true, 'should not throw');
});

await test('throws for invalid latitude', async () => {
  const uc = new UpdateAthleteLocationUseCase(makeAthleteRepo());
  await assertThrows(() => uc.execute({ athleteId: 'x', latitude: 91, longitude: 0 }), BusinessRuleViolationError, 'Latitude');
});

await test('throws for invalid longitude', async () => {
  const uc = new UpdateAthleteLocationUseCase(makeAthleteRepo());
  await assertThrows(() => uc.execute({ athleteId: 'x', latitude: 0, longitude: -181 }), BusinessRuleViolationError, 'Longitude');
});

await test('throws EntityNotFoundError for unknown athlete', async () => {
  const uc = new UpdateAthleteLocationUseCase(makeAthleteRepo());
  await assertThrows(() => uc.execute({ athleteId: 'ghost', latitude: 0, longitude: 0 }), EntityNotFoundError);
});

// ─── UploadAthletePhotoUseCase ────────────────────────────────────────────────

console.log('\n━━━ UploadAthletePhotoUseCase ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await test('updates photoUrl for existing athlete', async () => {
  const athlete = makeAthlete({ id: 'photo-1' });
  const store = new Map([['photo-1', athlete]]);
  const uc = new UploadAthletePhotoUseCase(makeAthleteRepo(store));
  await uc.execute({ athleteId: 'photo-1', photoUrl: 'uploads/photo.jpg' });
  assert(store.get('photo-1')!.photoUrl === 'uploads/photo.jpg', 'photoUrl must be updated');
});

await test('throws EntityNotFoundError for unknown athlete', async () => {
  const uc = new UploadAthletePhotoUseCase(makeAthleteRepo());
  await assertThrows(() => uc.execute({ athleteId: 'ghost', photoUrl: 'x.jpg' }), EntityNotFoundError);
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n🏁 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) process.exit(1);
