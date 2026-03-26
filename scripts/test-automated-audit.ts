import * as dotenv from 'dotenv';
dotenv.config();
import { automatedNightAudit } from '../src/app/actions/nightAuditActions';

async function test() {
    console.log('--- TESTING AUTOMATED NIGHT AUDIT ---');
    try {
        const result = await automatedNightAudit();
        console.log('Result:', result);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
