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

// Helper function to escape XML special characters
const escapeXML = (str: string | undefined): string => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '\'');
};

// Formats ServiceDate as YYYY/MM/DD HH:MM:SS
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

export async function POST(request: NextRequest) {
    try {
        const body: DPOPaymentRequest = await request.json();

        // 1. Validation and Setup
        const companyToken = (process.env.DPO_COMPANY_TOKEN || '').trim();
        const serviceType = (process.env.DPO_SERVICE_TYPE || '').trim();
        let apiEndpoint = process.env.DPO_API_ENDPOINT || '';

        if (!companyToken || !apiEndpoint || !serviceType) {
             return NextResponse.json(
                 { Result: '001', ResultExplanation: 'DPO Setup Error: Company Token or API Endpoint is missing.' },
                 { status: 500 }
             );
        }
        
        apiEndpoint = apiEndpoint.trim();
        
        const customerFirstName = (body.customerFirstName || '').trim();
        const customerLastName = (body.customerLastName || '').trim();
        const customerEmail = (body.customerEmail || '').trim();
        const customerPhone = (body.customerPhone || '').trim() || '0000000000';
        const serviceDescription = (body.serviceDescription || '').trim();
        const cleanCompanyRef = body.companyRef.replace(/[^a-zA-Z0-9\-_]/g, '').trim();

        // 2. Build Optional Customer Fields 
        let optionalCustomerFields = '';
        if (body.customerAddress && body.customerAddress.trim()) {
            optionalCustomerFields += `<CustomerAddress>${escapeXML(body.customerAddress.trim())}</CustomerAddress>`;
        }
        if (body.customerCity && body.customerCity.trim()) {
            optionalCustomerFields += `<CustomerCity>${escapeXML(body.customerCity.trim())}</CustomerCity>`;
        }
        if (body.customerCountry && body.customerCountry.trim()) {
            optionalCustomerFields += `<CustomerCountry>${escapeXML(body.customerCountry.trim())}</CustomerCountry>`;
        }
        if (body.customerZip && body.customerZip.trim()) {
            optionalCustomerFields += `<CustomerZip>${escapeXML(body.customerZip.trim())}</CustomerZip>`;
        }

        // 3. Build XML Request
        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
        
        const xmlContent = 
            '<CompanyToken>' + companyToken + '</CompanyToken>' +
            '<Request>createToken</Request>' +
            
            // Mandatory Transaction Level
            '<Transaction>' +
                '<PaymentAmount>' + body.amount.toFixed(2) + '</PaymentAmount>' +
                '<PaymentCurrency>' + (body.currency || 'USD') + '</PaymentCurrency>' +
                '<CompanyRef>' + escapeXML(cleanCompanyRef) + '</CompanyRef>' +
                '<RedirectURL>' + escapeXML(body.redirectURL.trim()) + '</RedirectURL>' +
                '<BackURL>' + escapeXML(body.backURL.trim()) + '</BackURL>' +
                '<CompanyRefUnique>0</CompanyRefUnique>' +
                '<PTL>5</PTL>' +
            '</Transaction>' +
            
            // Mandatory Services Level
            '<Services>' +
                '<Service>' +
                    '<ServiceType>' + serviceType + '</ServiceType>' +
                    '<ServiceDescription>' + escapeXML(serviceDescription) + '</ServiceDescription>' +
                    '<ServiceDate>' + formatServiceDate() + '</ServiceDate>' +
                '</Service>' +
            '</Services>' +
            
            // Customer Details 
            '<CustomerFirstName>' + escapeXML(customerFirstName) + '</CustomerFirstName>' +
            '<CustomerLastName>' + escapeXML(customerLastName) + '</CustomerLastName>' +
            '<CustomerEmail>' + escapeXML(customerEmail) + '</CustomerEmail>' +
            '<CustomerPhone>' + escapeXML(customerPhone) + '</CustomerPhone>' +
            optionalCustomerFields; 
        
        const xmlRequest = xmlDeclaration + '<API3G>' + xmlContent + '</API3G>';
        
        // 4. Send Request
        const params = new URLSearchParams();
        params.append('xml', xmlRequest);
        const requestBody = params.toString(); 
        
        console.log('DPO_REQUEST_SENT. Endpoint:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept': 'application/xml',
            },
            body: requestBody,
        });

        // 5. Handle Response
        const xmlResponse = await response.text();
        
        // Helper to parse XML tags
        const parseXML = (xml: string, tag: string): string | null => {
            const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
            const match = xml.match(regex);
            return match ? match[1].trim() : null;
        };

        const result = parseXML(xmlResponse, 'Result');
        const resultExplanation = parseXML(xmlResponse, 'ResultExplanation');
        
        if (result !== null) {
            // DPO returned a standard XML response (Error Code or Success)
            const transToken = parseXML(xmlResponse, 'TransToken');
            const transRef = parseXML(xmlResponse, 'TransRef');

            if (result !== '000') {
                 return NextResponse.json(
                     { Result: result, ResultExplanation: `${resultExplanation || 'Unknown DPO API error'}` },
                     { status: 400 }
                 );
            }
            
            return NextResponse.json({
                Result: result,
                ResultExplanation: resultExplanation || 'Transaction created',
                TransToken: transToken,
                TransRef: transRef,
            });
        }
        
        if (!response.ok) {
            let actualError = `HTTP ${response.status} Error`;

            const titleMatch = xmlResponse.match(/<TITLE>(.*?)<\/TITLE>/i);
            if (titleMatch && titleMatch[1]) {
                 actualError = titleMatch[1].trim();
            } else if (xmlResponse.length > 0) {
                 actualError = `HTTP ${response.status} Error: Raw Response Snippet: ${xmlResponse.substring(0, 100)}`;
            }

            console.error('RAW_DPO_RESPONSE_ERROR:', actualError);
            return NextResponse.json(
                 { Result: '001', ResultExplanation: actualError },
                 { status: response.status }
             );
        }

        console.error('DPO_INVALID_XML_RESPONSE_FALLBACK');
        return NextResponse.json(
            { Result: '001', ResultExplanation: 'Invalid response format from DPO API' },
            { status: 500 }
        );

    } catch (error) {
        console.error('INTERNAL_EXECUTION_ERROR:', error);
        return NextResponse.json(
            { Result: '001', ResultExplanation: error instanceof Error ? error.message : 'Unknown internal error' },
            { status: 500 }
        );
    }
}