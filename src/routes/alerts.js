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

// GET /api/alerts - Get alerts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const db = getPrisma();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const severity = req.query.severity || undefined; // info, warning, critical
    const isResolved = req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined;
    const roverId = req.query.roverId ? parseInt(req.query.roverId) : undefined;

    // Build where clause
    const whereClause = {};

    if (severity) {
      const validSeverities = ['info', 'warning', 'critical'];
      if (validSeverities.includes(severity)) {
        whereClause.severity = severity;
      }
    }

    if (isResolved !== undefined) {
      whereClause.isResolved = isResolved;
    }

    if (roverId) {
      whereClause.roverId = roverId;
    }

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await db.alert.count({ where: whereClause });

    // Get paginated alerts
    const alerts = await db.alert.findMany({
      where: whereClause,
      include: {
        rover: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      filters: {
        severity: severity || null,
        isResolved: isResolved !== undefined ? isResolved : null,
        roverId: roverId || null,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
});

// GET /api/alerts/:id - Get specific alert
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPrisma();

    const alert = await db.alert.findUnique({
      where: { id: parseInt(id) },
      include: {
        rover: {
          select: {
            id: true,
            name: true,
            status: true,
            battery: true,
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message,
    });
  }
});

// POST /api/alerts/:id/resolve - Mark alert as resolved
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getPrisma();

    const alert = await db.alert.findUnique({
      where: { id: parseInt(id) },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    if (alert.isResolved) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved',
      });
    }

    // Update alert
    const updatedAlert = await db.alert.update({
      where: { id: parseInt(id) },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
      include: {
        rover: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: updatedAlert,
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message,
    });
  }
});

// POST /api/alerts - Create new alert (for IoT device)
router.post('/', async (req, res) => {
  try {
    const { roverId, type, severity, message } = req.body;

    // Validation
    if (!roverId || !type || !severity || !message) {
      return res.status(400).json({
        success: false,
        message: 'roverId, type, severity, and message are required',
      });
    }

    const validTypes = ['low_battery', 'obstacle_detected', 'connection_lost', 'high_temperature'];
    const validSeverities = ['info', 'warning', 'critical'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Valid types are: ${validTypes.join(', ')}`,
      });
    }

    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Valid severities are: ${validSeverities.join(', ')}`,
      });
    }

    const db = getPrisma();

    // Check if rover exists
    const rover = await db.rover.findUnique({
      where: { id: parseInt(roverId) },
    });

    if (!rover) {
      return res.status(404).json({
        success: false,
        message: 'Rover not found',
      });
    }

    // Create alert
    const newAlert = await db.alert.create({
      data: {
        roverId: parseInt(roverId),
        type,
        severity,
        message,
      },
      include: {
        rover: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: newAlert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message,
    });
  }
});

module.exports = router;
