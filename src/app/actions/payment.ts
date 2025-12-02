"use server";

import { buildDPOXML, createDPOToken } from "@/lib/dpo";

interface PaymentTokenSuccess {
  success: true;
  transToken: string;
  transRef: string;
  paymentURL: string;
}

interface PaymentTokenError {
  success: false;
  error: string;
  details?: string;
  rawResponse?: string;
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
    console.log("=== Creating DPO Payment Token ===");
    console.log("CompanyRef:", data.companyRef);
    console.log("Amount:", data.amount);
    console.log("Environment check:", {
      hasToken: !!process.env.NEXT_PUBLIC_DPO_COMPANY_TOKEN,
      hasServiceType: !!process.env.NEXT_PUBLIC_DPO_SERVICE_TYPE,
    });

    // HARDCODED AMOUNT FOR TESTING (DPO Test Account Limit)
    const testAmount = 10;
    console.log(
      `⚠️ OVERRIDING AMOUNT: ${data.amount} -> ${testAmount} for testing`
    );

    const xmlRequest = buildDPOXML({ ...data, amount: testAmount });

    console.log("XML Request length:", xmlRequest.length);

    const result = await createDPOToken(xmlRequest);

    console.log("DPO Result:", result.Result);
    console.log("DPO Explanation:", result.ResultExplanation);
    console.log("TransToken:", result.TransToken);
    console.log("Raw Response Preview:", result.rawResponse.substring(0, 300));

    // Check for CloudFront block
    if (!result.Result && result.rawResponse.includes("CloudFront")) {
      return {
        success: false,
        error: "DPO API blocked by CloudFront (403 Error)",
        details:
          "DPO's API security is blocking requests. You need to contact DPO support to whitelist your domain.",
        rawResponse: result.rawResponse.substring(0, 500),
      };
    }

    if (!result.Result) {
      return {
        success: false,
        error: "Invalid response from payment gateway",
        details: result.rawResponse.substring(0, 300),
      };
    }

    if (result.Result !== "000") {
      return {
        success: false,
        error: result.ResultExplanation || "Payment token creation failed",
        details: `DPO Result code: ${result.Result}`,
      };
    }

    if (!result.TransToken) {
      return {
        success: false,
        error: "Payment token not received from gateway",
        details: "TransToken is missing in DPO response",
      };
    }

    console.log("✅ Payment token created successfully!");

    return {
      success: true,
      transToken: result.TransToken,
      transRef: result.TransRef || "",
      paymentURL: `https://secure.3gdirectpay.com/payv3.php?ID=${result.TransToken}`,
    };
  } catch (error) {
    console.error("=== Payment Token Error ===");
    console.error("Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);

    return {
      success: false,
      error: errorMessage,
      details: errorStack?.substring(0, 500),
    };
  }
}
