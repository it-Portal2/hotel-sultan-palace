import { NextRequest, NextResponse } from 'next/server';
import { automatedNightAudit } from '@/app/actions/nightAuditActions';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    
    // Check for Vercel Cron header or custom secret
    // Vercel adds 'Authorization: Bearer <CRON_SECRET>' if configured
    const isCronTrigger = 
        authHeader === `Bearer ${process.env.CRON_SECRET}` || 
        request.nextUrl.searchParams.get('key') === process.env.CRON_SECRET ||
        process.env.NODE_ENV === 'development'; // Allow local calls for testing

    if (!isCronTrigger) {
        return new NextResponse('Unauthorized', { status: 401 });
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
