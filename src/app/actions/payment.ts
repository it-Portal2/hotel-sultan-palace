'use server';

import { buildDPOXML, createDPOToken } from '@/lib/dpo';

// Define return types
interface PaymentTokenSuccess {
  success: true;
  transToken: string;
  transRef: string;
  paymentURL: string;
}

interface PaymentTokenError {
  success: false;
  error: string;
}

type PaymentTokenResult = PaymentTokenSuccess | PaymentTokenError;

export async function createPaymentToken(data: {
  amount: number;
  companyRef: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  redirectURL: string;
  backURL: string;
  serviceDescription: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  customerZip?: string;
}): Promise<PaymentTokenResult> {
  try {
    console.log('=== Creating DPO Payment Token ===');
    console.log('CompanyRef:', data.companyRef);
    console.log('Amount:', data.amount);

    const xmlRequest = buildDPOXML(data);
    const result = await createDPOToken(xmlRequest);

    console.log('DPO Result:', result.Result);
    console.log('TransToken:', result.TransToken);

    if (!result.Result && result.rawResponse.includes('CloudFront')) {
      return {
        success: false,
        error: 'Payment gateway blocked the request. Testing from production may resolve this. Contact DPO support if issue persists.',
      };
    }

    if (!result.Result) {
      return {
        success: false,
        error: 'Invalid response from payment gateway.',
      };
    }

    if (result.Result !== '000') {
      return {
        success: false,
        error: result.ResultExplanation || 'Payment token creation failed',
      };
    }

    if (!result.TransToken) {
      return {
        success: false,
        error: 'Payment token not received from gateway.',
      };
    }

    console.log('Payment token created successfully!');

    return {
      success: true,
      transToken: result.TransToken,
      transRef: result.TransRef || '',
      paymentURL: `https://secure.3gdirectpay.com/payv3.php?ID=${result.TransToken}`,
    };
  } catch (error) {
    console.error('Payment Token Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
