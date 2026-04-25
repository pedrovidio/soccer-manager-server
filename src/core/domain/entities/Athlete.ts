import { randomUUID } from 'crypto';
import { BusinessRuleViolationError } from '../errors/BusinessRuleViolationError.js';

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | undefined;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Stats {
  velocidade: number;
  resistencia: number;
  forca: number;
  passe: number;
  chute: number;
  defesa: number;
  drible: number;
}

export class Athlete {
  public readonly id: string;
  public nome: string;
  public cpf: string;
  public email: string;
  public telefone: string;
  public endereco: Address;
  public idade: number;
  public sexo: 'M' | 'F';
  public posicao: string;
  public stats: Stats;
  public latitude?: number | undefined;
  public longitude?: number | undefined;
  public isGoalkeeperForHire: boolean;


  constructor(
    nome: string,
    cpf: string,
    email: string,
    telefone: string,
    endereco: Address,
    idade: number,
    sexo: 'M' | 'F',
    posicao: string,
    stats: Stats,
    id?: string,
    latitude?: number,
    longitude?: number,
    isGoalkeeperForHire: boolean = false,
  ) {
    this.validateNome(nome);
    this.validateCpf(cpf);
    this.validateEmail(email);
    this.validateTelefone(telefone);
    this.validateIdade(idade);
    this.validateStats(stats);

    this.id = id ?? randomUUID();
    this.nome = nome;
    this.cpf = cpf;
    this.email = email;
    this.telefone = telefone;
    this.endereco = { ...endereco };
    this.idade = idade;
    this.sexo = sexo;
    this.posicao = posicao;
    this.stats = { ...stats };
    this.latitude = latitude ?? undefined;
    this.longitude = longitude ?? undefined;
    this.isGoalkeeperForHire = isGoalkeeperForHire;
  }

  private validateNome(nome: string): void {
    if (!nome || nome.trim().length === 0) {
      throw new BusinessRuleViolationError('Nome não pode ser vazio');
    }
  }

  private validateCpf(cpf: string): void {
    // Remove non-numeric characters and validate it has exactly 11 digits
    const cleanedCpf = cpf.replace(/\D/g, '');
    if (cleanedCpf.length !== 11) {
      throw new BusinessRuleViolationError('CPF deve conter exatamente 11 dígitos.');
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BusinessRuleViolationError('E-mail deve ter um formato válido');
    }
  }

  private validateTelefone(telefone: string): void {
    // Accept multiple phone formats: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XXXXXXXXXXX, etc
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      throw new BusinessRuleViolationError('Telefone deve conter entre 10 e 11 dígitos.');
    }
  }

  private validateIdade(idade: number): void {
    if (idade < 16 || idade > 50) {
      throw new BusinessRuleViolationError('Idade deve estar entre 16 e 50');
    }
  }

  private validateStats(stats: Stats): void {
    const keys: (keyof Stats)[] = ['velocidade', 'resistencia', 'forca', 'passe', 'chute', 'defesa', 'drible'];
    for (const key of keys) {
      if (stats[key] < 0 || stats[key] > 100) {
        throw new BusinessRuleViolationError(`${key} deve estar entre 0 e 100`);
      }
    }
  }

  public updatePerformance(newStats: Partial<Stats>): void {
    const updatedStats = { ...this.stats, ...newStats };
    this.validateStats(updatedStats);
    this.stats = updatedStats;
  }

  public calculateOverall(): number {
    // Weighted average with equal weights
    const weights = {
      velocidade: 1,
      resistencia: 1,
      forca: 1,
      passe: 1,
      chute: 1,
      defesa: 1,
      drible: 1,
    };
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const weightedSum = (this.stats.velocidade * weights.velocidade) +
                        (this.stats.resistencia * weights.resistencia) +
                        (this.stats.forca * weights.forca) +
                        (this.stats.passe * weights.passe) +
                        (this.stats.chute * weights.chute) +
                        (this.stats.defesa * weights.defesa) +
                        (this.stats.drible * weights.drible);
    return Math.round(weightedSum / totalWeight);
  }
}