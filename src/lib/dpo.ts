// lib/dpo.ts

export function buildDPOXML(data: {
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
}): string {
  const escapeXML = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const today = new Date();
  const serviceDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  const companyToken = process.env.NEXT_PUBLIC_DPO_COMPANY_TOKEN || "B3F59BE7-0756-420E-BB88-1D98E7A6B040";
  const serviceType = process.env.NEXT_PUBLIC_DPO_SERVICE_TYPE || "54841";

  return `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${data.amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>USD</PaymentCurrency>
    <CompanyRef>${escapeXML(data.companyRef)}</CompanyRef>
    <RedirectURL>${escapeXML(data.redirectURL)}</RedirectURL>
    <BackURL>${escapeXML(data.backURL)}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
    <CustomerFirstName>${escapeXML(data.customerFirstName)}</CustomerFirstName>
    <CustomerLastName>${escapeXML(data.customerLastName)}</CustomerLastName>
    ustomerEmail>${escapeXML(data.customerEmail)}</customerEmail>
    ustomerPhone>${escapeXML(data.customerPhone)}</customerPhone>
    ${data.customerAddress ? `ustomerAddress>${escapeXML(data.customerAddress)}</customerAddress>` : ''}
    ${data.customerCity ? `ustomerCity>${escapeXML(data.customerCity)}</customerCity>` : ''}
    ${data.customerCountry ? `ustomerCountry>${escapeXML(data.customerCountry)}</customerCountry>` : ''}
    ${data.customerZip ? `ustomerZip>${escapeXML(data.customerZip)}</customerZip>` : ''}
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${serviceType}</ServiceType>
      <ServiceDescription>${escapeXML(data.serviceDescription)}</ServiceDescription>
      <ServiceDate>${serviceDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`;
}

interface DPOResponse {
  Result: string | null;
  ResultExplanation: string | null;
  TransToken: string | null;
  TransRef: string | null;
  rawResponse: string;
}

export function parseDPOResponse(xmlText: string): DPOResponse {
  const getTag = (xml: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };

  return {
    Result: getTag(xmlText, 'Result'),
    ResultExplanation: getTag(xmlText, 'ResultExplanation'),
    TransToken: getTag(xmlText, 'TransToken'),
    TransRef: getTag(xmlText, 'TransRef'),
    rawResponse: xmlText,
  };
}

export async function createDPOToken(xmlRequest: string): Promise<DPOResponse> {
  const DPO_API = "https://secure.3gdirectpay.com/API/v6/";

  try {
    console.log('Calling DPO API:', DPO_API);
    
    const response = await fetch(DPO_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
      },
      body: xmlRequest,
    });

    console.log('Response Status:', response.status);

    const xmlResponse = await response.text();
    
    console.log('Raw Response (first 500 chars):', xmlResponse.substring(0, 500));
    
    if (response.status === 403 || xmlResponse.includes('CloudFront') || xmlResponse.includes('403 ERROR')) {
      throw new Error('DPO API blocked the request (CloudFront 403). Please contact DPO support to whitelist your account.');
    }

    return parseDPOResponse(xmlResponse);
  } catch (error) {
    console.error('DPO API Error:', error);
    throw error;
  }
}
