const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();

let prisma = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// GET /api/dashboard/stats - Get dashboard overview statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getPrisma();

    // Get total rovers and their statuses
    const rovers = await db.rover.findMany({
      select: { id: true, status: true, battery: true, lastSeen: true },
    });

    const activeRovers = rovers.filter((r) => r.status === 'online').length;
    const offlineRovers = rovers.filter((r) => r.status === 'offline').length;
    const errorRovers = rovers.filter((r) => r.status === 'error').length;

    // Get total sensor readings
    const totalReadings = await db.sensorLog.count();

    // Get average battery across all rovers
    const avgBattery = rovers.length > 0 ? rovers.reduce((sum, r) => sum + r.battery, 0) / rovers.length : 0;

    // Get total commands
    const totalCommands = await db.roverCommand.count();
    const pendingCommands = await db.roverCommand.count({ where: { status: 'pending' } });
    const completedCommands = await db.roverCommand.count({ where: { status: 'completed' } });

    // Get alerts
    const totalAlerts = await db.alert.count();
    const activeAlerts = await db.alert.count({ where: { isResolved: false } });
    const resolvedAlerts = await db.alert.count({ where: { isResolved: true } });

    // Get recent sensor data for trends
    const latestReadings = await db.sensorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: {
        temperature: true,
        humidity: true,
        battery: true,
        signalStrength: true,
        rover: { select: { name: true } },
      },
    });

    // Get critical alerts
    const criticalAlerts = await db.alert.findMany({
      where: { severity: 'critical', isResolved: false },
      include: {
        rover: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Get last 7 days command counts for chart
    const commandsLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await db.roverCommand.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      commandsLast7Days.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // Connectivity status
    const connectivityStatus = {
      online: activeRovers,
      offline: offlineRovers,
      error: errorRovers,
      total: rovers.length,
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalRovers: rovers.length,
          activeRovers,
          totalReadings,
          avgBattery: Math.round(avgBattery * 10) / 10,
          connectivity: connectivityStatus,
        },
        commands: {
          total: totalCommands,
          pending: pendingCommands,
          completed: completedCommands,
          last7Days: commandsLast7Days,
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
          resolved: resolvedAlerts,
          critical: criticalAlerts,
        },
        latestReading: latestReadings[0] || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
});

module.exports = router;
