import { NextRequest, NextResponse } from "next/server";
import https from "https";

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

const escapeXML = (str: string | undefined): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const formatServiceDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

// HTTPS request that mimics Postman EXACTLY
function makePostmanStyleRequest(body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "secure.3gdirectpay.com",
      port: 443,
      path: "/API/v6/",
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "PostmanRuntime/7.36.0", // Pretend to be Postman
        "Postman-Token": `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      },
      rejectUnauthorized: true, // Keep SSL verification
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("Response Status:", res.statusCode);
        console.log("Response Headers:", res.headers);
        resolve(data);
      });
    });

    req.on("error", (error) => {
      console.error("HTTPS Request Error:", error);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: DPOPaymentRequest = await request.json();

    const companyToken = (process.env.DPO_COMPANY_TOKEN || "").trim();
    const serviceType = (process.env.DPO_SERVICE_TYPE || "").trim();

    if (!companyToken || !serviceType) {
      return NextResponse.json(
        {
          Result: "001",
          ResultExplanation: "Payment gateway configuration error.",
        },
        { status: 500 }
      );
    }

    const customerFirstName = (body.customerFirstName || "").trim();
    const customerLastName = (body.customerLastName || "").trim();
    const customerEmail = (body.customerEmail || "").trim();
    const customerPhone = (body.customerPhone || "").trim() || "0000000000";
    const serviceDescription = (
      body.serviceDescription || "Hotel Booking"
    ).trim();

    if (!customerFirstName || !customerLastName || !customerEmail) {
      return NextResponse.json(
        {
          Result: "001",
          ResultExplanation: "Customer name and email are required.",
        },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { Result: "001", ResultExplanation: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const cleanCompanyRef = body.companyRef
      .replace(/[^a-zA-Z0-9\-_]/g, "")
      .trim();

    let customerFields = "";
    if (customerFirstName) {
      customerFields += `    <CustomerFirstName>${escapeXML(
        customerFirstName
      )}</CustomerFirstName>\n`;
    }
    if (customerLastName) {
      customerFields += `    <CustomerLastName>${escapeXML(
        customerLastName
      )}</CustomerLastName>\n`;
    }
    if (customerEmail) {
      customerFields += `    <customerEmail>${escapeXML(
        customerEmail
      )}</customerEmail>\n`;
    }
    if (customerPhone) {
      customerFields += `    <customerPhone>${escapeXML(
        customerPhone
      )}</customerPhone>\n`;
    }
    if (body.customerAddress?.trim()) {
      customerFields += `    <customerAddress>${escapeXML(
        body.customerAddress.trim()
      )}</customerAddress>\n`;
    }
    if (body.customerCity?.trim()) {
      customerFields += `    <customerCity>${escapeXML(
        body.customerCity.trim()
      )}</customerCity>\n`;
    }
    if (body.customerCountry?.trim()) {
      customerFields += `    <customerCountry>${escapeXML(
        body.customerCountry.trim()
      )}</customerCountry>\n`;
    }
    if (body.customerZip?.trim()) {
      customerFields += `    <customerZip>${escapeXML(
        body.customerZip.trim()
      )}</customerZip>\n`;
    }

    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXML(companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${body.amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${escapeXML(body.currency || "USD")}</PaymentCurrency>
    <CompanyRef>${escapeXML(cleanCompanyRef)}</CompanyRef>
    <RedirectURL>${escapeXML(body.redirectURL.trim())}</RedirectURL>
    <BackURL>${escapeXML(body.backURL.trim())}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
${customerFields}  </Transaction>
  <Services>
    <Service>
      <ServiceType>${escapeXML(serviceType)}</ServiceType>
      <ServiceDescription>${escapeXML(serviceDescription)}</ServiceDescription>
      <ServiceDate>${formatServiceDate()}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    console.log("=== Sending DPO Request ===");
    console.log("CompanyRef:", cleanCompanyRef);
    console.log("Amount:", body.amount, body.currency);

    const xmlResponse = await makePostmanStyleRequest(xmlRequest);

    console.log("=== DPO Response ===");
    console.log("Length:", xmlResponse.length);
    console.log("Preview:", xmlResponse.substring(0, 200));

    const parseXML = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "s");
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const result = parseXML(xmlResponse, "Result");
    const resultExplanation = parseXML(xmlResponse, "ResultExplanation");
    const transToken = parseXML(xmlResponse, "TransToken");
    const transRef = parseXML(xmlResponse, "TransRef");

    if (!result) {
      console.error("❌ No Result tag found");
      return NextResponse.json(
        {
          Result: "001",
          ResultExplanation: "Invalid response from payment gateway.",
        },
        { status: 500 }
      );
    }

    if (result !== "000") {
      console.error("❌ DPO Error:", result, resultExplanation);
      return NextResponse.json(
        {
          Result: result,
          ResultExplanation: resultExplanation || "Payment gateway error",
        },
        { status: 400 }
      );
    }

    console.log("✅ Success! TransToken:", transToken);

    return NextResponse.json({
      Result: "000",
      ResultExplanation: resultExplanation || "Transaction created",
      TransToken: transToken,
      TransRef: transRef,
    });
  } catch (error) {
    console.error("=== Error ===", error);
    return NextResponse.json(
      {
        Result: "001",
        ResultExplanation:
          error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
