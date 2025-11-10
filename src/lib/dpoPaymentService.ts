/**
 * DPO Pay Payment Service
 * Handles secure payment token creation and verification
 */

export interface DPOPaymentRequest {
  amount: number;
  currency: string;
  companyRef: string;
  redirectURL: string;
  backURL: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  customerZip?: string;
  serviceDescription: string;
}

export interface DPOTokenResponse {
  Result: string;
  ResultExplanation: string;
  TransToken?: string;
  TransRef?: string;
}

export interface DPOVerifyResponse {
  Result: string;
  ResultExplanation: string;
  TransToken?: string;
  TransRef?: string;
  TransactionStatus?: string;
  TransactionAmount?: string;
  TransactionCurrency?: string;
}


//  Create payment token
 
export async function createDPOPaymentToken(request: DPOPaymentRequest): Promise<DPOTokenResponse> {
  const response = await fetch('/api/payment/create-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok || data.Result !== '000') {
    const errorMessage = data.ResultExplanation || 'Failed to create payment token';
    throw new Error(errorMessage);
  }

  return data;
}

//  Verify payment token
 
export async function verifyDPOPayment(token: string): Promise<DPOVerifyResponse> {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.statusText}`);
  }

  return response.json();
}

//  Get payment URL for redirect
 
export function getDPOPaymentURL(token: string): string {
  const baseURL = process.env.NEXT_PUBLIC_DPO_PAYMENT_URL ?? '';
  return `${baseURL}?ID=${token}`;
}
