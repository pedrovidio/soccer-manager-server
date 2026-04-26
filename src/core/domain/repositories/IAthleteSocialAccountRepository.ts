export interface IAthleteSocialAccountRepository {
  findByProvider(provider: string, providerId: string): Promise<{ athleteId: string } | null>;
  save(athleteId: string, provider: string, providerId: string): Promise<void>;
}
