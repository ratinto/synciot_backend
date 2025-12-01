require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('📊 Checking existing data...\n');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`👤 Users (${users.length}):`);
    users.forEach(u => console.log(`   - ${u.email} (${u.name})`));
    
    // Check robots
    const robots = await prisma.robot.findMany({
      include: {
        _count: {
          select: { sensors: true }
        }
      }
    });
    console.log(`\n🤖 Robots (${robots.length}):`);
    robots.forEach(r => console.log(`   - ${r.name} (${r.status}, ${r.battery}%, ${r._count.sensors} sensors)`));
    
    // Check sensors
    const sensors = await prisma.sensor.findMany();
    console.log(`\n📡 Sensors (${sensors.length}):`);
    sensors.forEach(s => console.log(`   - ${s.name}: ${s.value} ${s.unit} (Robot ID: ${s.robotId})`));
    
    console.log('\n✅ Data check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
