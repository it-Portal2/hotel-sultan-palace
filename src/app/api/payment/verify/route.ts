/**
 * DPO Pay Payment Verification API Route
 * Server-side secure endpoint for verifying payment status
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { Result: '001', ResultExplanation: 'Token is required' },
        { status: 400 }
      );
    }

    const companyToken = process.env.DPO_COMPANY_TOKEN ?? '';
    const apiEndpoint = process.env.DPO_API_ENDPOINT ?? '';

    if (!companyToken) {
      return NextResponse.json(
        { Result: '001', ResultExplanation: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Build XML request
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?><API3G><CompanyToken>${companyToken}</CompanyToken><Request>verifyToken</Request><TransactionToken>${token}</TransactionToken></API3G>`;

    // Send request to DPO API
    const formData = new URLSearchParams();
    formData.append('xml', xmlRequest);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const xmlResponse = await response.text();

    const parseXML = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const result = parseXML(xmlResponse, 'Result') || '001';
    const resultExplanation = parseXML(xmlResponse, 'ResultExplanation') || 'Unknown error';
    const transToken = parseXML(xmlResponse, 'TransToken');
    const transRef = parseXML(xmlResponse, 'TransRef');
    const transactionStatus = parseXML(xmlResponse, 'TransactionStatus');
    const transactionAmount = parseXML(xmlResponse, 'TransactionAmount');
    const transactionCurrency = parseXML(xmlResponse, 'TransactionCurrency');

    return NextResponse.json({
      Result: result,
      ResultExplanation: resultExplanation,
      TransToken: transToken,
      TransRef: transRef,
      TransactionStatus: transactionStatus,
      TransactionAmount: transactionAmount,
      TransactionCurrency: transactionCurrency,
    });

  } catch (error) {
    console.error('Error verifying DPO payment:', error);
    return NextResponse.json(
      {
        Result: '001',
        ResultExplanation: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
