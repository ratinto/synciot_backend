const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Count robots
    const robotCount = await prisma.robot.count();
    console.log('Robot count:', robotCount);
    
    // Count sensors
    const sensorCount = await prisma.sensor.count();
    console.log('Sensor count:', sensorCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
