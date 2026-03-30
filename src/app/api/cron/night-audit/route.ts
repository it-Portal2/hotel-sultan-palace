import { NextRequest, NextResponse } from 'next/server';
import { automatedNightAudit } from '@/app/actions/nightAuditActions';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 1. Initial Auth Check (No Token)
    if (!authHeader) {
        console.warn('[Cron] Unauthorized attempt: No token provided at', new Date().toISOString());
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Secret Configuration Check
    if (!cronSecret) {
        console.error('[Cron] Security Critical: CRON_SECRET is missing from environment variables.');
        return new NextResponse('Forbidden: Configuration Error', { status: 403 });
    }

    // 3. Strict Validation (Only Header Auth)
    const isAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!isAuthorized) {
        console.warn('[Cron] Forbidden: Invalid token attempt at', new Date().toISOString());
        return new NextResponse('Forbidden: Invalid Token', { status: 403 });
    }

    console.log('[Cron] Starting automated Night Audit at', new Date().toISOString());

    try {
        const result = await automatedNightAudit();
        
        return NextResponse.json({
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString()
        }, { 
            status: result.success ? 200 : 400 
        });

    } catch (error) {
        console.error('[Cron API] Route Exception:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
