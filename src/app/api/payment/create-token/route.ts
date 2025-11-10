/**
 * DPO Pay Token Creation API Route
 * Server-side secure endpoint for creating payment tokens
 */

import { NextRequest, NextResponse } from 'next/server';

interface DPOPaymentRequest {
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

export async function POST(request: NextRequest) {
  try {
    const body: DPOPaymentRequest = await request.json();

    // Required fields check
    if (!body.amount || !body.companyRef || !body.customerEmail) {
      return NextResponse.json(
        { Result: '001', ResultExplanation: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get DPO credentials
    const companyToken = process.env.DPO_COMPANY_TOKEN ?? '';
    const serviceType = process.env.DPO_SERVICE_TYPE ?? '';
    const apiEndpoint = process.env.DPO_API_ENDPOINT ?? '';

    if (!companyToken) {
      return NextResponse.json(
        { Result: '001', ResultExplanation: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Helper function to escape XML special characters
    const escapeXML = (str: string | undefined): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Format ServiceDate as YYYY/MM/DD HH:MM:SS (DPO required format)
    const formatServiceDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    // Prepare customer data
    const customerPhone = (body.customerPhone && body.customerPhone.trim()) ? body.customerPhone.trim() : '0000000000';
    
    // Build optional customer fields (only if provided)
    let optionalCustomerFields = '';
    if (body.customerAddress && body.customerAddress.trim()) {
      optionalCustomerFields += `<CustomerAddress>${escapeXML(body.customerAddress)}</CustomerAddress>`;
    }
    if (body.customerCity && body.customerCity.trim()) {
      optionalCustomerFields += `<CustomerCity>${escapeXML(body.customerCity)}</CustomerCity>`;
    }
    if (body.customerCountry && body.customerCountry.trim()) {
      optionalCustomerFields += `<CustomerCountry>${escapeXML(body.customerCountry)}</CustomerCountry>`;
    }
    if (body.customerZip && body.customerZip.trim()) {
      optionalCustomerFields += `<CustomerZip>${escapeXML(body.customerZip)}</CustomerZip>`;
    }

    const cleanCompanyRef = body.companyRef.replace(/[^a-zA-Z0-9\-_]/g, '');

    // Build XML request - Compact single-line format
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?><API3G><CompanyToken>${companyToken}</CompanyToken><Request>createToken</Request><Transaction><PaymentAmount>${body.amount.toFixed(2)}</PaymentAmount><PaymentCurrency>${body.currency || 'USD'}</PaymentCurrency><CompanyRef>${escapeXML(cleanCompanyRef)}</CompanyRef><RedirectURL>${escapeXML(body.redirectURL)}</RedirectURL><BackURL>${escapeXML(body.backURL)}</BackURL><CompanyRefUnique>0</CompanyRefUnique><PTL>5</PTL></Transaction><Services><Service><ServiceType>${serviceType}</ServiceType><ServiceDescription>${escapeXML(body.serviceDescription)}</ServiceDescription><ServiceDate>${formatServiceDate()}</ServiceDate></Service></Services><Customer><CustomerFirstName>${escapeXML(body.customerFirstName)}</CustomerFirstName><CustomerLastName>${escapeXML(body.customerLastName)}</CustomerLastName><CustomerEmail>${escapeXML(body.customerEmail)}</CustomerEmail><CustomerPhone>${escapeXML(customerPhone)}</CustomerPhone>${optionalCustomerFields}</Customer></API3G>`;

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

    // Check if response is HTML
    if (xmlResponse.includes('<html>') || xmlResponse.includes('<!DOCTYPE') || xmlResponse.includes('ERROR:')) {
      return NextResponse.json(
        {
          Result: '001',
          ResultExplanation: `DPO API connection error (${response.status}). This usually indicates: 1) Server IP needs whitelisting, 2) Account activation required, or 3) Endpoint configuration issue. Please contact DPO support with your server IP address.`,
        },
        { status: 500 }
      );
    }

    const parseXML = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const result = parseXML(xmlResponse, 'Result') || '001';
    const resultExplanation = parseXML(xmlResponse, 'ResultExplanation') || 'Unknown error';
    const transToken = parseXML(xmlResponse, 'TransToken');
    const transRef = parseXML(xmlResponse, 'TransRef');

    // Check if DPO returned an error
    if (result !== '000') {
      return NextResponse.json(
        {
          Result: result,
          ResultExplanation: resultExplanation,
          TransToken: transToken,
          TransRef: transRef,
        },
        { status: 400 }
      );
    }

    // Success - return token
    return NextResponse.json({
      Result: result,
      ResultExplanation: resultExplanation,
      TransToken: transToken,
      TransRef: transRef,
    });

  } catch (error) {
    console.error('Error creating DPO payment token:', error);
    return NextResponse.json(
      {
        Result: '001',
        ResultExplanation: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
