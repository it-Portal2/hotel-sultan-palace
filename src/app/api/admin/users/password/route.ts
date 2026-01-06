import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

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

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
    }
}
