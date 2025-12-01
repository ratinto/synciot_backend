const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Lazy load Prisma
let prisma;
const getPrisma = () => {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
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
