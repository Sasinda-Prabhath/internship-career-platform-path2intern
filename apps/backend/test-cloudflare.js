import dotenv from 'dotenv';
import { generateSimulationMcqs } from './src/services/cloudflare.service.js';

dotenv.config();

async function testCloudflare() {
  try {
    console.log('Testing Cloudflare Workers AI integration...');
    const result = await generateSimulationMcqs({
      moduleCode: 'SE',
      total: 3,
      timeLimitMinutes: 15,
      difficultyMix: 'easy=1, medium=1, hard=1'
    });

    console.log('Success! Generated questions:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCloudflare();