const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignRobotsToUser() {
  try {
    console.log('🔄 Assigning existing robots to demo user...\n');

    // Find the demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    });

    if (!demoUser) {
      console.log('❌ Demo user not found!');
      console.log('Please create demo user first with:');
      console.log('Email: demo@example.com');
      console.log('Password: demo123');
      return;
    }

    console.log(`✅ Found user: ${demoUser.name} (ID: ${demoUser.id})`);
    console.log();

    // Find all robots without a user
    const robotsWithoutUser = await prisma.robot.findMany({
      where: { userId: null }
    });

    console.log(`📋 Found ${robotsWithoutUser.length} robots without owner`);
    console.log();

    if (robotsWithoutUser.length === 0) {
      console.log('✅ All robots already have owners!');
      return;
    }

    // Assign all robots to demo user
    for (const robot of robotsWithoutUser) {
      await prisma.robot.update({
        where: { id: robot.id },
        data: { userId: demoUser.id }
      });
      console.log(`✅ Assigned "${robot.name}" (ID: ${robot.id}) to ${demoUser.name}`);
    }

    console.log();
    console.log('🎉 All robots assigned successfully!');
    console.log();

    // Show final summary
    const userRobots = await prisma.robot.findMany({
      where: { userId: demoUser.id },
      include: { _count: { select: { sensors: true } } }
    });

    console.log('📊 User robots summary:');
    console.log(`User: ${demoUser.name} (${demoUser.email})`);
    console.log(`Robots: ${userRobots.length}`);
    userRobots.forEach(robot => {
      console.log(`  - ${robot.name} (${robot._count.sensors} sensors)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignRobotsToUser();
