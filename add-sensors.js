require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function addSensors() {
  try {
    console.log('🔗 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!');

    console.log('🔍 Finding robots...');
    const robots = await prisma.robot.findMany();
    console.log(`📊 Found ${robots.length} robots`);

    if (robots.length === 0) {
      console.log('❌ No robots found. Please add robots first.');
      return;
    }

    // Display robots
    robots.forEach((robot, index) => {
      console.log(`   ${index + 1}. ${robot.name} (ID: ${robot.id})`);
    });

    console.log('\n📡 Adding sensors to robots...');

    // Get first robot
    const robot1 = robots[0];
    console.log(`\n🤖 Adding sensors to: ${robot1.name}`);

    const robot1Sensors = [
      { name: 'Temperature Sensor', type: 'temperature', value: 22.5, unit: '°C' },
      { name: 'Humidity Sensor', type: 'humidity', value: 45, unit: '%' },
      { name: 'Distance Sensor Front', type: 'distance', value: 150, unit: 'cm' },
      { name: 'Distance Sensor Back', type: 'distance', value: 200, unit: 'cm' },
      { name: 'Battery Monitor', type: 'battery', value: 97, unit: '%' },
    ];

    for (const sensor of robot1Sensors) {
      const created = await prisma.sensor.create({
        data: {
          ...sensor,
          robotId: robot1.id,
        },
      });
      console.log(`   ✅ Created: ${created.name}`);
    }

    // Get second robot if exists
    if (robots.length > 1) {
      const robot2 = robots[1];
      console.log(`\n🤖 Adding sensors to: ${robot2.name}`);

      const robot2Sensors = [
        { name: 'Temperature Sensor', type: 'temperature', value: 21.0, unit: '°C' },
        { name: 'Humidity Sensor', type: 'humidity', value: 50, unit: '%' },
        { name: 'Altitude Sensor', type: 'pressure', value: 1013, unit: 'hPa' },
        { name: 'Light Sensor', type: 'light', value: 750, unit: 'lux' },
        { name: 'Signal Strength', type: 'signal', value: -65, unit: 'dBm' },
      ];

      for (const sensor of robot2Sensors) {
        const created = await prisma.sensor.create({
          data: {
            ...sensor,
            robotId: robot2.id,
          },
        });
        console.log(`   ✅ Created: ${created.name}`);
      }
    }

    console.log('\n✨ All sensors added successfully!');

    // Show final count
    const totalSensors = await prisma.sensor.count();
    console.log(`\n📊 Total sensors in database: ${totalSensors}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

addSensors()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
