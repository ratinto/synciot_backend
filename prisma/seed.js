const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.alert.deleteMany({});
  await prisma.roverCommand.deleteMany({});
  await prisma.sensorLog.deleteMany({});
  await prisma.rover.deleteMany({});
  console.log('✅ Data cleared');

  // Create 3 rovers with different statuses
  console.log('🤖 Creating rovers...');
  const rover1 = await prisma.rover.create({
    data: {
      name: 'Rover Alpha',
      status: 'online',
      battery: 85,
      lastSeen: new Date(),
    },
  });
  console.log(`✅ Created Rover Alpha (ID: ${rover1.id})`);

  const rover2 = await prisma.rover.create({
    data: {
      name: 'Rover Beta',
      status: 'online',
      battery: 62,
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
    },
  });
  console.log(`✅ Created Rover Beta (ID: ${rover2.id})`);

  const rover3 = await prisma.rover.create({
    data: {
      name: 'Rover Gamma',
      status: 'offline',
      battery: 15,
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
    },
  });
  console.log(`✅ Created Rover Gamma (ID: ${rover3.id})`);

  // Create sensor logs for each rover (50+ total)
  console.log('📊 Creating sensor logs...');
  const generateSensorLogs = (roverId, roverName) => {
    const logs = [];
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Create logs for each day
    for (let day = 0; day < 30; day++) {
      // Multiple readings per day (morning, afternoon, evening)
      for (let reading = 0; reading < 3; reading++) {
        const logDate = new Date(baseDate);
        logDate.setDate(logDate.getDate() + day);
        logDate.setHours(6 + reading * 8, Math.random() * 60);

        logs.push({
          roverId,
          temperature: 20 + Math.random() * 15, // 20-35°C
          humidity: 40 + Math.random() * 40, // 40-80%
          distance: 5 + Math.random() * 45, // 5-50 meters
          battery: Math.max(10, 100 - day * 2 - Math.random() * 10),
          signalStrength: -40 - Math.random() * 50, // -40 to -90 dBm
          createdAt: logDate,
        });
      }
    }
    return logs;
  };

  let totalLogsCreated = 0;

  const logs1 = generateSensorLogs(rover1.id, 'Rover Alpha');
  await prisma.sensorLog.createMany({ data: logs1 });
  totalLogsCreated += logs1.length;
  console.log(`✅ Created ${logs1.length} sensor logs for Rover Alpha`);

  const logs2 = generateSensorLogs(rover2.id, 'Rover Beta');
  await prisma.sensorLog.createMany({ data: logs2 });
  totalLogsCreated += logs2.length;
  console.log(`✅ Created ${logs2.length} sensor logs for Rover Beta`);

  const logs3 = generateSensorLogs(rover3.id, 'Rover Gamma');
  await prisma.sensorLog.createMany({ data: logs3 });
  totalLogsCreated += logs3.length;
  console.log(`✅ Created ${logs3.length} sensor logs for Rover Gamma`);

  console.log(`📊 Total sensor logs created: ${totalLogsCreated}`);

  // Create rover commands
  console.log('🎮 Creating rover commands...');
  const commands = [
    { roverId: rover1.id, command: 'forward', status: 'completed', createdAt: new Date(Date.now() - 7200000), executedAt: new Date(Date.now() - 7100000) },
    { roverId: rover1.id, command: 'left', status: 'completed', createdAt: new Date(Date.now() - 6000000), executedAt: new Date(Date.now() - 5950000) },
    { roverId: rover1.id, command: 'right', status: 'completed', createdAt: new Date(Date.now() - 5000000), executedAt: new Date(Date.now() - 4950000) },
    { roverId: rover1.id, command: 'stop', status: 'pending', createdAt: new Date(Date.now() - 60000) },
    
    { roverId: rover2.id, command: 'forward', status: 'completed', createdAt: new Date(Date.now() - 10000000), executedAt: new Date(Date.now() - 9950000) },
    { roverId: rover2.id, command: 'backward', status: 'pending', createdAt: new Date(Date.now() - 120000) },
    
    { roverId: rover3.id, command: 'forward', status: 'failed', createdAt: new Date(Date.now() - 3600000) },
  ];

  await prisma.roverCommand.createMany({ data: commands });
  console.log(`✅ Created ${commands.length} rover commands`);

  // Create alerts
  console.log('⚠️  Creating alerts...');
  const alerts = [
    {
      roverId: rover1.id,
      type: 'low_battery',
      severity: 'warning',
      message: 'Battery level critically low (15%)',
      isResolved: false,
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      roverId: rover2.id,
      type: 'connection_lost',
      severity: 'critical',
      message: 'Lost connection to rover',
      isResolved: true,
      createdAt: new Date(Date.now() - 7200000),
      resolvedAt: new Date(Date.now() - 6000000),
    },
    {
      roverId: rover1.id,
      type: 'obstacle_detected',
      severity: 'info',
      message: 'Obstacle detected ahead',
      isResolved: true,
      createdAt: new Date(Date.now() - 3600000),
      resolvedAt: new Date(Date.now() - 3500000),
    },
    {
      roverId: rover3.id,
      type: 'high_temperature',
      severity: 'warning',
      message: 'Temperature exceeds normal range (35°C)',
      isResolved: false,
      createdAt: new Date(Date.now() - 900000),
    },
    {
      roverId: rover2.id,
      type: 'low_battery',
      severity: 'warning',
      message: 'Battery level low (25%)',
      isResolved: false,
      createdAt: new Date(Date.now() - 300000),
    },
  ];

  await prisma.alert.createMany({ data: alerts });
  console.log(`✅ Created ${alerts.length} alerts`);

  console.log('✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Rovers created: 3`);
  console.log(`  - Sensor logs created: ${totalLogsCreated}`);
  console.log(`  - Commands created: ${commands.length}`);
  console.log(`  - Alerts created: ${alerts.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
