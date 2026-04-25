import { Athlete, Address, Stats } from '../../../../core/domain/entities/Athlete.js';

interface AthleteCreateInput {
  id?: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento?: string | null;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  idade: number;
  sexo: string;
  posicao: string;
  statsVelocidade: number;
  statsResistencia: number;
  statsForca: number;
  statsPasse: number;
  statsChute: number;
  statsDefesa: number;
  statsDrible: number;
  latitude?: number | null;
  longitude?: number | null;
  isGoalkeeperForHire?: boolean;
  pixKey?: string | null;
}

interface PrismaAthlete {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string | null;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  idade: number;
  sexo: string;
  posicao: string;
  statsVelocidade: number;
  statsResistencia: number;
  statsForca: number;
  statsPasse: number;
  statsChute: number;
  statsDefesa: number;
  statsDrible: number;
  latitude: number | null;
  longitude: number | null;
  isGoalkeeperForHire: boolean;
  pixKey: string | null;
}

export class PrismaAthleteMapper {
  static toPersistence(athlete: Athlete): AthleteCreateInput {
    return {
      id: athlete.id,
      nome: athlete.nome,
      cpf: athlete.cpf,
      email: athlete.email,
      telefone: athlete.telefone,
      enderecoCep: athlete.endereco.cep,
      enderecoLogradouro: athlete.endereco.logradouro,
      enderecoNumero: athlete.endereco.numero,
      enderecoComplemento: athlete.endereco.complemento || null,
      enderecoBairro: athlete.endereco.bairro,
      enderecoCidade: athlete.endereco.cidade,
      enderecoUf: athlete.endereco.uf,
      idade: athlete.idade,
      sexo: athlete.sexo,
      posicao: athlete.posicao,
      statsVelocidade: athlete.stats.velocidade,
      statsResistencia: athlete.stats.resistencia,
      statsForca: athlete.stats.forca,
      statsPasse: athlete.stats.passe,
      statsChute: athlete.stats.chute,
      statsDefesa: athlete.stats.defesa,
      statsDrible: athlete.stats.drible,
      latitude: athlete.latitude || null,
      longitude: athlete.longitude || null,
      isGoalkeeperForHire: athlete.isGoalkeeperForHire,
      pixKey: athlete.pixKey || null,
    };
  }

  static toDomain(raw: PrismaAthlete): Athlete {
    const address: Address = {
      cep: raw.enderecoCep,
      logradouro: raw.enderecoLogradouro,
      numero: raw.enderecoNumero,
      complemento: raw.enderecoComplemento || undefined,
      bairro: raw.enderecoBairro,
      cidade: raw.enderecoCidade,
      uf: raw.enderecoUf,
    };

    const stats: Stats = {
      velocidade: raw.statsVelocidade,
      resistencia: raw.statsResistencia,
      forca: raw.statsForca,
      passe: raw.statsPasse,
      chute: raw.statsChute,
      defesa: raw.statsDefesa,
      drible: raw.statsDrible,
    };

    return new Athlete(
      raw.nome,
      raw.cpf,
      raw.email,
      raw.telefone,
      address,
      raw.idade,
      raw.sexo as 'M' | 'F',
      raw.posicao,
      stats,
      raw.id,
      raw.latitude || undefined,
      raw.longitude || undefined,
      raw.isGoalkeeperForHire,
      raw.pixKey || undefined
    );
  }
}