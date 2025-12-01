const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// Lazy load Prisma
let prisma;
const getPrisma = () => {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      errorFormat: 'pretty',
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Add connection retry logic
    prisma.$connect()
      .then(() => console.log('✅ Robots DB connected'))
      .catch((err) => {
        console.error('❌ Robots DB connection failed:', err.message);
        setTimeout(() => {
          prisma.$connect()
            .then(() => console.log('✅ Robots DB reconnected'))
            .catch(() => console.error('❌ Robots DB reconnection failed'));
        }, 2000);
      });
  }
  return prisma;
};

// @route   GET /api/robots
// @desc    Get all robots (for dashboard list)
// @access  Protected
router.get('/', authenticateToken, async (req, res) => {
  try {
    const robots = await getPrisma().robot.findMany({
      include: {
        _count: {
          select: { sensors: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: robots
    });
  } catch (error) {
    console.error('Error fetching robots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch robots',
      error: error.message
    });
  }
});

// ==================== SENSOR ROUTES (nested under robots) ====================
// NOTE: These MUST come BEFORE /:id routes to avoid route conflicts

// @route   GET /api/robots/:robotId/sensors
// @desc    Get all sensors for a specific robot
// @access  Protected
router.get('/:robotId/sensors', authenticateToken, async (req, res) => {
  try {
    const { robotId } = req.params;

    // Check if robot exists
    const robot = await getPrisma().robot.findUnique({
      where: { id: parseInt(robotId) }
    });

    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    const sensors = await getPrisma().sensor.findMany({
      where: { robotId: parseInt(robotId) },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: sensors
    });
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensors',
      error: error.message
    });
  }
});

// @route   POST /api/robots/:robotId/sensors
// @desc    Add sensor to robot
// @access  Protected
router.post('/:robotId/sensors', authenticateToken, async (req, res) => {
  try {
    const { robotId } = req.params;
    const { name, type, value, unit } = req.body;

    console.log('Adding sensor to robot:', robotId);
    console.log('Sensor data:', { name, type, value, unit });

    // Validation
    if (!name || !type || value === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, value, and unit are required'
      });
    }

    // Check if robot exists
    const robot = await getPrisma().robot.findUnique({
      where: { id: parseInt(robotId) }
    });

    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    const sensor = await getPrisma().sensor.create({
      data: {
        robotId: parseInt(robotId),
        name,
        type,
        value: parseFloat(value),
        unit
      }
    });

    console.log('Sensor created:', sensor);

    res.status(201).json({
      success: true,
      message: 'Sensor added successfully',
      data: sensor
    });
  } catch (error) {
    console.error('Error adding sensor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add sensor',
      error: error.message
    });
  }
});

// @route   POST /api/robots/:robotId/sensors/bulk
// @desc    Bulk update/create sensors for a robot (for ESP32/IoT devices)
// @access  Protected
router.post('/:robotId/sensors/bulk', authenticateToken, async (req, res) => {
  try {
    const { robotId } = req.params;
    const { sensors } = req.body;

    console.log('Bulk sensor update for robot:', robotId);
    console.log('Sensor count:', sensors?.length);

    // Validation
    if (!sensors || !Array.isArray(sensors) || sensors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sensors array is required and must not be empty'
      });
    }

    // Check if robot exists
    const robot = await getPrisma().robot.findUnique({
      where: { id: parseInt(robotId) }
    });

    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    // Process each sensor
    const results = [];
    for (const sensorData of sensors) {
      const { name, type, value, unit } = sensorData;

      // Validate each sensor
      if (!name || !type || value === undefined || !unit) {
        console.warn('Skipping invalid sensor:', sensorData);
        continue;
      }

      // Check if sensor already exists for this robot
      const existingSensor = await getPrisma().sensor.findFirst({
        where: {
          robotId: parseInt(robotId),
          name: name,
          type: type
        }
      });

      if (existingSensor) {
        // Update existing sensor
        const updated = await getPrisma().sensor.update({
          where: { id: existingSensor.id },
          data: {
            value: parseFloat(value),
            unit: unit,
            updatedAt: new Date()
          }
        });
        results.push({ action: 'updated', sensor: updated });
        console.log('Updated sensor:', name);
      } else {
        // Create new sensor
        const created = await getPrisma().sensor.create({
          data: {
            robotId: parseInt(robotId),
            name,
            type,
            value: parseFloat(value),
            unit
          }
        });
        results.push({ action: 'created', sensor: created });
        console.log('Created sensor:', name);
      }
    }

    // Update robot's lastSeen timestamp
    await getPrisma().robot.update({
      where: { id: parseInt(robotId) },
      data: { lastSeen: new Date() }
    });

    console.log('Bulk update complete. Processed:', results.length, 'sensors');

    res.status(200).json({
      success: true,
      message: 'Sensors updated successfully',
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk sensor update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sensors',
      error: error.message
    });
  }
});

// ==================== ROBOT ROUTES ====================

// @route   GET /api/robots/:id
// @desc    Get single robot with its sensors
// @access  Protected
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const robot = await getPrisma().robot.findUnique({
      where: { id: parseInt(id) },
      include: {
        sensors: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    console.error('Error fetching robot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch robot',
      error: error.message
    });
  }
});

// @route   POST /api/robots
// @desc    Add new robot
// @access  Protected
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, status, battery } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Robot name is required'
      });
    }

    const robot = await getPrisma().robot.create({
      data: {
        name,
        status: status || 'offline',
        battery: battery || 0,
        lastSeen: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Robot added successfully',
      data: robot
    });
  } catch (error) {
    console.error('Error adding robot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add robot',
      error: error.message
    });
  }
});

// @route   PUT /api/robots/:id
// @desc    Update robot
// @access  Protected
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, battery } = req.body;

    const robot = await getPrisma().robot.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(battery !== undefined && { battery }),
        lastSeen: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Robot updated successfully',
      data: robot
    });
  } catch (error) {
    console.error('Error updating robot:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update robot',
      error: error.message
    });
  }
});

// @route   DELETE /api/robots/:id
// @desc    Delete robot (and all its sensors)
// @access  Protected
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await getPrisma().robot.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Robot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting robot:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete robot',
      error: error.message
    });
  }
});

module.exports = router;
