import { NextRequest, NextResponse } from "next/server";

// Helper function to escape XML special characters
const escapeXML = (str: string | undefined): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { Result: "001", ResultExplanation: "Transaction token is required" },
        { status: 400 }
      );
    }

    const companyToken = process.env.DPO_COMPANY_TOKEN ?? "";
    const apiEndpoint = process.env.DPO_API_ENDPOINT ?? "";

    if (!companyToken || !apiEndpoint) {
      return NextResponse.json(
        {
          Result: "001",
          ResultExplanation:
            "DPO Setup Error: Credentials missing for verification.",
        },
        { status: 500 }
      );
    }

    // Build XML as a single, continuous string
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?><API3G><CompanyToken>${companyToken}</CompanyToken><Request>verifyToken</Request><TransactionToken>${escapeXML(
      token.trim()
    )}</TransactionToken><VerifyTransaction>1</VerifyTransaction></API3G>`;

    console.log("DPO Verify Request Sent");

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Accept: "application/xml",
        "User-Agent": "PostmanRuntime/7.29.0",
        "Cache-Control": "no-cache",
        Host: "secure.3gdirectpay.com",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
      body: xmlRequest,
    });

    const xmlResponse = await response.text();
    console.log("DPO Verify Response Status:", response.status);

    // Helper to parse XML tags
    const parseXML = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "s");
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const result = parseXML(xmlResponse, "Result");
    const resultExplanation = parseXML(xmlResponse, "ResultExplanation");

    if (result !== null) {
      const transToken = parseXML(xmlResponse, "TransToken");
      const transRef = parseXML(xmlResponse, "TransRef");
      const transactionAmount = parseXML(xmlResponse, "TransactionAmount");
      const transactionCurrency = parseXML(xmlResponse, "TransactionCurrency");

      // DPO Response
      return NextResponse.json({
        Result: result,
        ResultExplanation: resultExplanation || "Unknown status",
        TransToken: transToken,
        TransRef: transRef,
        TransactionAmount: transactionAmount,
        TransactionCurrency: transactionCurrency,
      });
    }

    // Fallback for non-XML errors
    if (!response.ok) {
      let actualError = `HTTP ${response.status} Error`;
      const titleMatch = xmlResponse.match(/<TITLE>(.*?)<\/TITLE>/i);
      if (titleMatch && titleMatch[1]) {
        actualError = titleMatch[1].trim();
      } else if (xmlResponse.length > 0) {
        actualError = `HTTP ${
          response.status
        } Error: Raw Response Snippet: ${xmlResponse.substring(0, 100)}`;
      }

      return NextResponse.json(
        { Result: "001", ResultExplanation: actualError },
        { status: response.status }
      );
    }

    // Fallback if response is successful HTTP but invalid XML
    return NextResponse.json(
      {
        Result: "001",
        ResultExplanation: "Invalid response format from DPO API",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("INTERNAL_EXECUTION_ERROR:", error);
    return NextResponse.json(
      {
        Result: "001",
        ResultExplanation:
          error instanceof Error ? error.message : "Unknown internal error",
      },
      { status: 500 }
    );
  }
}
