import 'dotenv/config';
import { getLibraryForChapter } from '../src/services/videoLibraryService';

async function test() {
  console.log('🧪 Testing getLibraryForChapter for Solid State...');
  try {
    const result = await getLibraryForChapter('che_12_solid_state', 'JEE', 'Chemistry', 'Class 12', true);
    console.log('✅ Result count:', result.length);
    console.log('Result details:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('❌ Error caught during getLibraryForChapter:', e.stack || e.message);
  }
}

test();
