import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason, comments } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists in Firebase Auth
    const auth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(trimmedEmail);
    } catch {
      // User not found — still return success to avoid email enumeration
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, your deletion request has been submitted. You will receive a confirmation within 7 business days.",
      });
    }

    // Check for existing pending request
    const db = getAdminFirestore();
    const existingRequest = await db
      .collection("deletion_requests")
      .where("email", "==", trimmedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingRequest.empty) {
      return NextResponse.json({
        success: true,
        message:
          "A deletion request for this email is already being processed. You will receive a confirmation within 7 business days.",
      });
    }

    // Save deletion request to Firestore
    await db.collection("deletion_requests").add({
      email: trimmedEmail,
      uid: userRecord.uid,
      displayName: userRecord.displayName || null,
      reason: reason || "Not specified",
      comments: comments || "",
      status: "pending",
      requestedAt: new Date(),
      processedAt: null,
      processedBy: null,
    });

    return NextResponse.json({
      success: true,
      message:
        "Your account deletion request has been submitted successfully. Your account and associated data will be deleted within 7 business days.",
    });
  } catch (error) {
    console.error("Account deletion request error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong. Please try again or contact us directly at portalholdingsznz@gmail.com",
      },
      { status: 500 },
    );
  }
}
