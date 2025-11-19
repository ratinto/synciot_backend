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

// GET /api/rover - List all rovers with stats
router.get('/', async (req, res) => {
  try {
    const db = getPrisma();

    const rovers = await db.rover.findMany({
      include: {
        sensorLogs: {
          select: { temperature: true, humidity: true, battery: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        commands: {
          select: { status: true },
        },
        alerts: {
          select: { isResolved: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each rover
    const roversWithStats = rovers.map((rover) => {
      const latestSensor = rover.sensorLogs[0];
      const pendingCommands = rover.commands.filter((c) => c.status === 'pending').length;
      const activeAlerts = rover.alerts.filter((a) => !a.isResolved).length;

      return {
        id: rover.id,
        name: rover.name,
        status: rover.status,
        battery: rover.battery,
        lastSeen: rover.lastSeen,
        latestSensor: latestSensor || null,
        pendingCommands,
        activeAlerts,
        createdAt: rover.createdAt,
        updatedAt: rover.updatedAt,
      };
    });

    res.json({
      success: true,
      data: roversWithStats,
      count: roversWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching rovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rovers',
      error: error.message,
    });
  }
});

// GET /api/rover/:id - Get specific rover details with recent data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPrisma();

    const rover = await db.rover.findUnique({
      where: { id: parseInt(id) },
      include: {
        sensorLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        commands: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!rover) {
      return res.status(404).json({
        success: false,
        message: 'Rover not found',
      });
    }

    res.json({
      success: true,
      data: rover,
    });
  } catch (error) {
    console.error('Error fetching rover details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rover details',
      error: error.message,
    });
  }
});

// POST /api/rover/:id/command - Send command to rover
router.post('/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required',
      });
    }

    const validCommands = ['forward', 'backward', 'left', 'right', 'stop'];
    if (!validCommands.includes(command.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid command. Valid commands are: ${validCommands.join(', ')}`,
      });
    }

    const db = getPrisma();

    // Check if rover exists
    const rover = await db.rover.findUnique({
      where: { id: parseInt(id) },
    });

    if (!rover) {
      return res.status(404).json({
        success: false,
        message: 'Rover not found',
      });
    }

    if (rover.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Rover is not online',
      });
    }

    // Create command record
    const newCommand = await db.roverCommand.create({
      data: {
        roverId: parseInt(id),
        command: command.toLowerCase(),
        status: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Command sent successfully',
      data: newCommand,
    });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send command',
      error: error.message,
    });
  }
});

module.exports = router;
