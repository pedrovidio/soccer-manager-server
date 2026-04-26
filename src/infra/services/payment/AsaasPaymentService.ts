import axios from 'axios';

const asaasApi = axios.create({
  baseURL: process.env['ASAAS_ENV'] === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3',
  headers: { access_token: process.env['ASAAS_API_KEY'] ?? '' },
});

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasCharge {
  id: string;
  status: string;
  value: number;
  netValue: number;
  invoiceUrl: string;
  pixQrCodeUrl?: string;
}

export class AsaasPaymentService {
  async createOrFindCustomer(name: string, email: string, cpfCnpj: string): Promise<string> {
    const search = await asaasApi.get(`/customers?email=${email}`);
    if (search.data.data?.length > 0) return search.data.data[0].id;

    const created = await asaasApi.post('/customers', { name, email, cpfCnpj });
    return created.data.id;
  }

  async createPixChargeWithSplit(params: {
    customerId: string;
    value: number;
    description: string;
    venueOwnerWalletId: string;
    commissionRate: number;
    dueDate: string;
  }): Promise<AsaasCharge> {
    const platformAmount = Math.round(params.value * params.commissionRate * 100) / 100;
    const ownerAmount = Math.round((params.value - platformAmount) * 100) / 100;

    const response = await asaasApi.post('/payments', {
      customer: params.customerId,
      billingType: 'PIX',
      value: params.value,
      dueDate: params.dueDate,
      description: params.description,
      split: [
        { walletId: params.venueOwnerWalletId, fixedValue: ownerAmount },
      ],
    });

    return {
      id: response.data.id,
      status: response.data.status,
      value: response.data.value,
      netValue: response.data.netValue,
      invoiceUrl: response.data.invoiceUrl,
      pixQrCodeUrl: response.data.pixQrCodeUrl,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    const response = await asaasApi.get(`/payments/${paymentId}`);
    return response.data.status;
  }
}
