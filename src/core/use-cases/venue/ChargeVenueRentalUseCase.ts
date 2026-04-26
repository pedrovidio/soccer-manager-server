import { IMatchRepository } from '../../domain/repositories/IMatchRepository.js';
import { IAthleteRepository } from '../../domain/repositories/IAthleteRepository.js';
import { IMatchVenueRecordRepository, IVenueOwnerRepository } from '../../domain/repositories/venue/IVenueRepositories.js';
import { ISuperAdminRepository } from '../../domain/repositories/venue/ISuperAdminRepository.js';
import { EntityNotFoundError } from '../../domain/errors/EntityNotFoundError.js';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError.js';
import { AsaasPaymentService } from '../../../infra/services/payment/AsaasPaymentService.js';
import { MatchStatus } from '../../domain/entities/Match.js';

interface ChargeResult {
  athleteId: string;
  athleteName: string;
  amountCharged: number;
  pixQrCodeUrl: string | undefined;
  invoiceUrl: string;
}

export class ChargeVenueRentalUseCase {
  private asaas = new AsaasPaymentService();

  constructor(
    private matchRepo: IMatchRepository,
    private athleteRepo: IAthleteRepository,
    private matchVenueRecordRepo: IMatchVenueRecordRepository,
    private venueOwnerRepo: IVenueOwnerRepository,
    private superAdminRepo: ISuperAdminRepository,
  ) {}

  async execute(matchId: string): Promise<ChargeResult[]> {
    const match = await this.matchRepo.findById(matchId);
    if (!match) throw new EntityNotFoundError('Match', matchId);
    if (match.status !== MatchStatus.FINISHED) throw new BusinessRuleViolationError('Match must be finished before charging');

    const record = await this.matchVenueRecordRepo.findByMatch(matchId);
    if (!record) throw new BusinessRuleViolationError('No venue record found for this match');

    const owner = await this.venueOwnerRepo.findById(record.venueOwnerId);
    if (!owner?.asaasWalletId) throw new BusinessRuleViolationError('VenueOwner has no Asaas wallet configured');

    const superAdmin = await this.superAdminRepo.find();
    const commissionRate = superAdmin?.commissionRate ?? 0.1;

    const confirmedAthletes = match.confirmedIds;
    if (confirmedAthletes.length === 0) throw new BusinessRuleViolationError('No confirmed athletes to charge');

    const amountPerAthlete = Math.round((record.rentalPrice / confirmedAthletes.length) * 100) / 100;
    const dueDate = new Date(match.date);
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0]!;

    const results: ChargeResult[] = [];

    for (const athleteId of confirmedAthletes) {
      const athlete = await this.athleteRepo.findById(athleteId);
      if (!athlete) continue;

      const customerId = await this.asaas.createOrFindCustomer(athlete.name, athlete.email, athlete.cpf);

      const charge = await this.asaas.createPixChargeWithSplit({
        customerId,
        value: amountPerAthlete,
        description: `Aluguel de quadra — ${match.location} — ${match.date.toLocaleDateString('pt-BR')}`,
        venueOwnerWalletId: owner.asaasWalletId,
        commissionRate,
        dueDate: dueDateStr,
      });

      results.push({
        athleteId,
        athleteName: athlete.name,
        amountCharged: amountPerAthlete,
        pixQrCodeUrl: charge.pixQrCodeUrl,
        invoiceUrl: charge.invoiceUrl,
      });
    }

    return results;
  }
}
