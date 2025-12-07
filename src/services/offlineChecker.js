const { PrismaClient } = require('@prisma/client');

// Lazy load Prisma
let prisma;
const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      errorFormat: 'pretty',
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
};

/**
 * Check and mark robots as offline if they haven't sent data in 30 seconds
 */
async function checkOfflineRobots() {
  try {
    const thirtySecondsAgo = new Date(Date.now() - 30000); // 30 seconds ago

    // Find all robots that were online but haven't sent data in 30 seconds
    const offlineRobots = await getPrisma().robot.updateMany({
      where: {
        status: 'online',
        lastSeen: {
          lt: thirtySecondsAgo
        }
      },
      data: {
        status: 'offline'
      }
    });

    if (offlineRobots.count > 0) {
      console.log(`🔴 Marked ${offlineRobots.count} robot(s) as offline`);
    }

    return offlineRobots.count;
  } catch (error) {
    console.error('Error checking offline robots:', error);
    return 0;
  }
}

/**
 * Start the offline checker service
 * Runs every 10 seconds to check for offline robots
 */
function startOfflineChecker() {
  console.log('🔄 Starting offline robot checker service...');
  console.log('⏱️  Will mark robots offline if no data for 30 seconds');
  
  // Run immediately
  checkOfflineRobots();
  
  // Then run every 10 seconds
  const interval = setInterval(checkOfflineRobots, 10000); // Check every 10 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping offline checker service...');
    clearInterval(interval);
    getPrisma().$disconnect();
    process.exit(0);
  });

  return interval;
}

module.exports = {
  checkOfflineRobots,
  startOfflineChecker
};
