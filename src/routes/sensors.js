const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// Lazy load Prisma
let prisma;
const getPrisma = () => {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
};

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

// @route   GET /api/sensors/:id
// @desc    Get single sensor
// @access  Protected
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const sensor = await getPrisma().sensor.findUnique({
      where: { id: parseInt(id) },
      include: {
        robot: true
      }
    });

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    res.json({
      success: true,
      data: sensor
    });
  } catch (error) {
    console.error('Error fetching sensor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor',
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

// @route   PUT /api/sensors/:id
// @desc    Update sensor
// @access  Protected
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value, unit } = req.body;

    const sensor = await getPrisma().sensor.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(unit && { unit })
      }
    });

    res.json({
      success: true,
      message: 'Sensor updated successfully',
      data: sensor
    });
  } catch (error) {
    console.error('Error updating sensor:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update sensor',
      error: error.message
    });
  }
});

// @route   DELETE /api/sensors/:id
// @desc    Delete sensor
// @access  Protected
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await getPrisma().sensor.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Sensor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete sensor',
      error: error.message
    });
  }
});

module.exports = router;
