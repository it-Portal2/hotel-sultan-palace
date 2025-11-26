
This document explain of the DPO 

End–to–end flow when a guest completes a booking:

1. **User fills the checkout form** on `CheckoutPage`  
   - File: `src/app/checkout/page.tsx`
   - Enters guest details, address, and card details 

2. **User clicks “Confirm Booking”**  
   - `handleSubmit` in `CheckoutPage`:
     - Validates agreements, guest details, and card fields.
     - Builds a `bookingDetails` object (check‑in/out, room, add‑ons, totals).
     - Calls **`createDPOPaymentToken`** (client → server).

3. **Frontend calls your  API** to create a DPO token  
   - File: `src/lib/dpoPaymentService.ts`
     - `createDPOPaymentToken` sends a JSON request to:
       - `/api/payment/create-token`

4. **API Route talks to DPO servers (createToken)**  
   - File: `src/app/api/payment/create-token/route.ts`
   - This route:
     - Reads JSON from the frontend.
     - Builds an `API3G` XML payload as DPO requires.
     - Sends it to **`DPO_API_ENDPOINT`** using `application/x-www-form-urlencoded` with an `xml` parameter 
     - Parses DPO’s XML response.
     - Returns a JSON object back to the frontend:
       - On success: `{ Result: '000', TransToken, TransRef, ... }`
       - On error: `{ Result: '001', ResultExplanation: '...' }` with HTTP `4xx/5xx`.

5. **Frontend gets DPO token & redirects to hosted payment page**
   - File: `src/lib/dpoPaymentService.ts`
     - `getDPOPaymentURL(TransToken)` generates:  
       `NEXT_PUBLIC_DPO_PAYMENT_URL + "?ID=" + TransToken`
   - `CheckoutPage`:
     - Stores `bookingDetails` in `localStorage` as `pendingBooking`.
     - Redirects browser to the hosted DPO payment page.

6. **User pays on DPO’s hosted page**  
   - On success/failure, DPO redirects the user back to:
     - `RedirectURL` → `/payment/success`
     - `BackURL` → `/payment/failure`  
   - These URLs are set in the XML sent from `create-token` API route.

7. **Payment Success Page verifies with DPO (verifyToken)**  
   - File: `src/app/payment/success/page.tsx`
   - Reads DPO’s query param: `TransactionToken` or `ID`.
   - Calls **`verifyDPOPayment`**:
     - Client → `/api/payment/verify`
   - API route:
     - File: `src/app/api/payment/verify/route.ts`
     - Sends an `API3G` XML request with `<Request>verifyToken</Request>` to DPO.
     - Parses the result, returns JSON to the frontend.

8. **On verified success, booking is created in Firestore**  
   - `PaymentSuccessPage`:
     - Reads `pendingBooking` from `localStorage`.
     - Merges payment data from DPO response.
     - Calls `createBookingService` to create the booking in your DB.
     - Fetches booking to get allocated room type.
     - Stores final `bookingDetails` in `localStorage` for `/confirmation`.
     - Shows `BookingConfirmationPopup`.

9. **Failure case**  
   - File: `src/app/payment/failure/page.tsx`
   - Simply shows failure UI and a button to go back to `/checkout`.

---

## 2. Environment Variables

These variables control the DPO integration. 

### 2.1 Required (Backend – API routes)

- **`DPO_COMPANY_TOKEN`**
  - Your unique Company Token from DPO.
  - Used in `<CompanyToken>` in every `API3G` request.
  - Referenced in:
    - `src/app/api/payment/create-token/route.ts`
    - `src/app/api/payment/verify/route.ts`

- **`DPO_API_ENDPOINT`**
  - The DPO API URL, e.g.  
    - `https://secure.3gdirectpay.com/API/v6/`
  - Used as the `fetch` target in both:
    - `create-token` route – for `<Request>createToken</Request>`
    - `verify` route – for `<Request>verifyToken</Request>`

- **`DPO_SERVICE_TYPE`**
  - A service type code assigned/configured in  DPO account 
  - Sent under `<ServiceType>` in the `<Service>` section of the XML.

### 2.2 Optional / Frontend

- **`NEXT_PUBLIC_DPO_PAYMENT_URL`**
  - Public URL of DPO’s Hosted Payment Page (HPP).
  - Example (you must confirm with DPO docs/credentials):  
    `https://secure.3gdirectpay.com/payv2.php`
  - Used in `getDPOPaymentURL`:
    - `return `${baseURL}?ID=${token}`;`

> **Note:**  
> - Env vars starting with `NEXT_PUBLIC_` are exposed to the frontend.  
> - Others (`DPO_COMPANY_TOKEN`, `DPO_API_ENDPOINT`, `DPO_SERVICE_TYPE`) are **server‑only** and only used in API routes.

---

## 3. Client Library – `src/lib/dpoPaymentService.ts`

This file is the **frontend helper** for talking to your own backend API, and for building DPO redirect URLs.

```startLine:endLine:src/lib/dpoPaymentService.ts
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
```

### 3.1 `createDPOPaymentToken(request: DPOPaymentRequest)`

Responsibilities:

- Called from **checkout page** after form validation.
- Sends user + booking info to your backend to initiate a DPO transaction.
- Handles backend/DPO errors cleanly.

Key points:

```startLine:endLine:src/lib/dpoPaymentService.ts
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
```

- It **does not** talk directly to DPO; it talks to your Next.js API route.
- It expects the API to:
  - Return `Result: '000'` on success.
  - Throw a helpful error message otherwise.

### 3.2 `verifyDPOPayment(token: string)`

```startLine:endLine:src/lib/dpoPaymentService.ts
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
```

- Used on **payment success page**.
- Sends the transaction token to your backend to call DPO `<Request>verifyToken</Request>`.

### 3.3 `getDPOPaymentURL(token: string)`

```startLine:endLine:src/lib/dpoPaymentService.ts
export function getDPOPaymentURL(token: string): string {
  const baseURL = process.env.NEXT_PUBLIC_DPO_PAYMENT_URL ?? '';
  return `${baseURL}?ID=${token}`;
}
```

- Generates the **hosted payment URL**.
- Based on DPO convention from docs: `...?ID=<TransToken>`.

---

## 4. API Route – Create Token (`/api/payment/create-token`)

File: `src/app/api/payment/create-token/route.ts`

Purpose:

- Translate your internal `DPOPaymentRequest` JSON into DPO’s **XML API3G format**.
- Call DPO’s **createToken** endpoint.
- Parse XML response and return a **clean JSON** to the frontend.

### 4.1 Input JSON (from frontend)

Comes from `createDPOPaymentToken`:

- `amount` – payment amount (2 decimals).
- `currency` – e.g. `"USD"`.
- `companyRef` – your internal booking ID/reference.
- `redirectURL` – where DPO should send the customer on success (e.g. `/payment/success`).
- `backURL` – where DPO should send the customer on cancel/fail (e.g. `/payment/failure`).
- Customer info fields.
- `serviceDescription` – text describing what is being paid for.

### 4.2 Building the XML (mapping to DPO docs)

Core logic:

```startLine:endLine:src/app/api/payment/create-token/route.ts
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
```

- This structure matches the **API3G `createToken`** request shown in DPO docs:
  - `<CompanyToken>`
  - `<Request>createToken</Request>`
  - `<Transaction>` with `PaymentAmount`, `PaymentCurrency`, `CompanyRef`, `RedirectURL`, `BackURL`, etc.
  - `<Services>` with `<ServiceType>`, `<ServiceDescription>`, `<ServiceDate>`.
  - Customer fields.

The final request is:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<API3G>
  ... all of the above ...
</API3G>
```

This XML string is then wrapped into a **form‑encoded POST**:

```startLine:endLine:src/app/api/payment/create-token/route.ts
const params = new URLSearchParams();
params.append('xml', xmlRequest);
const requestBody = params.toString(); 

const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/xml',
    },
    body: requestBody,
});
```

This matches DPO’s requirement from docs: send `xml` payload via `application/x-www-form-urlencoded`.

### 4.3 Parsing DPO Response

1. Read raw XML:

```startLine:endLine:src/app/api/payment/create-token/route.ts
const xmlResponse = await response.text();
```

2. Extract tags:

```startLine:endLine:src/app/api/payment/create-token/route.ts
const parseXML = (xml: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
};

const result = parseXML(xmlResponse, 'Result');
const resultExplanation = parseXML(xmlResponse, 'ResultExplanation');
```

3. If `Result` exists:

- If `Result !== '000'` → error JSON.
- If `Result === '000'` → success JSON with `TransToken`/`TransRef`.

```startLine:endLine:src/app/api/payment/create-token/route.ts
if (result !== null) {
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
```

4. Fallback for non‑XML responses (like CloudFront HTML):

```startLine:endLine:src/app/api/payment/create-token/route.ts
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
```

This is where errors like **“The request could not be satisfied”** from CloudFront get captured and surfaced up to the frontend.

---

## 5. API Route – Verify Token (`/api/payment/verify`)

File: `src/app/api/payment/verify/route.ts`

Purpose:

- After the customer returns from DPO’s hosted page, verify the transaction using `<Request>verifyToken</Request>`.

### 5.1 Building the XML

```startLine:endLine:src/app/api/payment/verify/route.ts
const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?><API3G><CompanyToken>${companyToken}</CompanyToken><Request>verifyToken</Request><TransactionToken>${escapeXML(token.trim())}</TransactionToken><VerifyTransaction>1</VerifyTransaction></API3G>`;
```

- This matches DPO’s documented `verifyToken` request.
- Sent as `xml` form parameter just like `createToken`.

### 5.2 Parsing Response

Same pattern:

- Read `Result`, `ResultExplanation`, `TransToken`, `TransRef`, `TransactionAmount`, `TransactionCurrency`.
- Return JSON for the frontend to decide if payment is successful (usually `Result === '000'`).

```startLine:endLine:src/app/api/payment/verify/route.ts
const result = parseXML(xmlResponse, 'Result');
const resultExplanation = parseXML(xmlResponse, 'ResultExplanation');

if (result !== null) {
    const transToken = parseXML(xmlResponse, 'TransToken');
    const transRef = parseXML(xmlResponse, 'TransRef');
    const transactionAmount = parseXML(xmlResponse, 'TransactionAmount');
    const transactionCurrency = parseXML(xmlResponse, 'TransactionCurrency');
    
    return NextResponse.json({
        Result: result,
        ResultExplanation: resultExplanation || 'Unknown status',
        TransToken: transToken,
        TransRef: transRef,
        TransactionAmount: transactionAmount,
        TransactionCurrency: transactionCurrency,
    });
}
```

---

## 6. Checkout Page – Where Payment Starts

File: `src/app/checkout/page.tsx`

Key responsibilities:

- Collect guest, address, reservation details.
- Collect **card fields** but only for UI/validation (actual card processing happens on DPO hosted page).
- Validate form.
- Build `bookingDetails`.
- Call `createDPOPaymentToken`, then redirect to payment page.

### 6.1 Calling the token API and redirecting

The important part in `handleSubmit`:

```startLine:endLine:src/app/checkout/page.tsx
      // Payment flow - redirect to DPO payment gateway
      if (typeof window === 'undefined') {
        throw new Error('Payment processing is only available in the browser.');
      }

      localStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));

      const baseURL = window.location.origin;
      const successURL = `${baseURL}/payment/success`;
      const failureURL = `${baseURL}/payment/failure`;

      const paymentRequest = {
        amount: totalAmount,
        currency: 'USD',
        companyRef: bookingId,
        redirectURL: successURL,
        backURL: failureURL,
        customerFirstName: (guests[0]?.firstName || '').trim(),
        customerLastName: (guests[0]?.lastName || '').trim(),
        customerEmail: (guests[0]?.email || '').trim(),
        customerPhone: (guests[0]?.mobile || '').trim() || '0000000000',
        customerAddress: address?.address1 ? address.address1.trim() : undefined,
        customerCity: address?.city ? address.city.trim() : undefined,
        customerCountry: address?.country ? address.country.trim() : undefined,
        customerZip: address?.zipCode ? address.zipCode.trim() : undefined,
        serviceDescription: `Hotel Booking - ${rooms.length > 0 ? rooms[0].name : 'Room'} - ${getNumberOfNights()} night(s)`.trim()
      };

      const paymentTokenResponse = await createDPOPaymentToken(paymentRequest);

      if (!paymentTokenResponse.TransToken) {
        throw new Error(paymentTokenResponse.ResultExplanation || 'Failed to create payment token');
      }

      const paymentURL = getDPOPaymentURL(paymentTokenResponse.TransToken);

      if (!paymentURL) {
        throw new Error('Unable to generate payment URL. Please try again later.');
      }

      showToast('Redirecting to secure payment page...', 'success');
      window.location.href = paymentURL;
```

Summary:

- **Before redirect**: Save `bookingDetails` to `localStorage` as `pendingBooking`.
- **Then**: Ask DPO for a token via your API.
- **On success**: Redirect to DPO using `TransToken`.

---

## 7. Payment Success Page – Final Booking Creation

File: `src/app/payment/success/page.tsx`

Responsibilities:

- Verify payment with DPO (using verifyToken).
- On success, create a booking in your DB.
- Prepare and store confirmation data.

Key flow:

```startLine:endLine:src/app/payment/success/page.tsx
const token = searchParams?.get('TransactionToken') || searchParams?.get('ID');
...
const verificationResult = await verifyDPOPayment(token);

if (verificationResult.Result === '000') {
  // Payment successful
  setVerificationStatus('success');
  
  // Create booking in database
  await createBookingFromPayment(verificationResult);
} else {
  setVerificationStatus('failed');
  setErrorMessage(verificationResult.ResultExplanation || 'Payment verification failed');
}
```

Inside `createBookingFromPayment`:

- Reads `pendingBooking` from `localStorage`.
- Merges payment info (TransToken, TransRef) into booking details.
- Calls `createBookingService` (Firestore/DB logic).
- Stores final `bookingDetails` in `localStorage` for `/confirmation`.
- Shows `BookingConfirmationPopup`.

---

## 8. How This Matches DPO Official Docs

Based on the DPO docs ([DPO API Docs](https://docs.dpopay.com/api/index.html)), the integration is aligned as follows:

- **Request structure**:
  - Uses `API3G` root.
  - Uses `<CompanyToken>`, `<Request>createToken</Request>` and `<Request>verifyToken</Request>`.
  - Sends mandatory `Transaction` and `Services` blocks as required.

- **Transport format**:
  - XML is sent as `xml` field via `application/x-www-form-urlencoded` POST.

- **Hosted payment flow**:
  - Generate token (`createToken`) → redirect user to HPP with `?ID=<TransToken>` → **DPO handles card data**.
  - Then `verifyToken` from backend to validate payment.

- **Security**:
  - Sensitive credentials (`DPO_COMPANY_TOKEN`, `DPO_API_ENDPOINT`, `DPO_SERVICE_TYPE`) are used **only server‑side**.
  - Frontend sees only `NEXT_PUBLIC_DPO_PAYMENT_URL` and the hosted payment redirect URL.

---

## 9. How to Explain This to Your Company / Stakeholders

You can summarize the integration like this:

1. **We implement DPO exactly as per their API3G XML spec**:
   - `createToken` → hosted payment → `verifyToken`.
2. **Our application never sees card details**:
   - Card is entered on DPO’s hosted page.
3. **All credentials and XML communication happen server‑side**:
   - Through `/api/payment/create-token` and `/api/payment/verify`.
4. **Any “The request could not be satisfied” / CloudFront errors**:
   - Come from DPO’s infrastructure (CDN/WAF) before our request reaches the DPO API.
   - Our code logs these and surfaces them as `ResultExplanation` to help DPO support debug.

With this document, you can:

- Show exactly which file does what.
- Map each step to DPO’s official documentation.
- Provide logs + explanation to DPO or your company when something fails.

---



