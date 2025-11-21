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
  // Fields received if Result is 000
  CustomerName?: string;
  TransactionAmount?: string;
  TransactionCurrency?: string;
}

// Create payment token
export async function createDPOPaymentToken(request: DPOPaymentRequest): Promise<DPOTokenResponse> {
  try {
      const response = await fetch('/api/payment/create-token', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
      });

      // If response is not OK
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
              Result: '001', 
              ResultExplanation: `HTTP ${response.status}: ${response.statusText}` 
          }));
          throw new Error(errorData.ResultExplanation || `Payment request failed with status ${response.status}`);
      }

      const data = await response.json();

      // If response is OK, but DPO returned an error inside JSON
      if (data.Result !== '000') {
          const errorMessage = data.ResultExplanation || 'Failed to create payment token';
          throw new Error(errorMessage);
      }

      return data;
  } catch (error) {
      if (error instanceof Error) {
          throw error;
      }
      throw new Error('Failed to create payment token: Unknown error');
  }
}

// Verify payment token
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

// Get payment URL for redirect
export function getDPOPaymentURL(token: string): string {
  const baseURL = process.env.NEXT_PUBLIC_DPO_PAYMENT_URL ?? '';
  return `${baseURL}?ID=${token}`;
}