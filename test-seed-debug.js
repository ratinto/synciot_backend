console.log('=== SEED DEBUG TEST ===');
console.log('1. Script started');

require('dotenv').config();
console.log('2. Dotenv loaded');
console.log('3. DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');

const { PrismaClient } = require('@prisma/client');
console.log('4. PrismaClient imported');

const prisma = new PrismaClient();
console.log('5. Prisma client created');

async function test() {
  console.log('6. Test function started');
  
  try {
    console.log('7. Connecting to database...');
    await prisma.$connect();
    console.log('8. Connected!');
    
    console.log('9. Counting users...');
    const count = await prisma.user.count();
    console.log('10. User count:', count);
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('11. Disconnected');
  }
}

console.log('12. Calling test function...');
test()
  .then(() => console.log('13. Test completed'))
  .catch((e) => console.error('14. Test failed:', e));
