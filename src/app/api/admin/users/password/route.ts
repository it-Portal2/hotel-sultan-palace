import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { sendEmail, generatePasswordChangedEmail } from '@/lib/emailService';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const auth = getAdminAuth();
        const user = await auth.getUserByEmail(email);
        await auth.updateUser(user.uid, {
            password: password
        });

        // Send notification email (Non-blocking)
        try {
            const htmlContent = generatePasswordChangedEmail(email);
            await sendEmail({
                to: email,
                subject: 'Security Alert: Your Password Has Been Changed',
                html: htmlContent
            });
            console.log(`[PASSWORD_CHANGE] Notification sent to ${email}`);
        } catch (emailError) {
            console.error('[PASSWORD_CHANGE] Failed to send notification:', emailError);
            // We do not fail the request if email fails, but we log it.
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
    }
}
