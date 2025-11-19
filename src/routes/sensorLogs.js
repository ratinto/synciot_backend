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

// GET /api/sensor-logs - Get sensor logs with pagination, filtering, sorting, searching
router.get('/', async (req, res) => {
  try {
    const db = getPrisma();

    // Query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const roverId = req.query.roverId ? parseInt(req.query.roverId) : undefined;
    const sortBy = req.query.sortBy || 'createdAt'; // temperature, humidity, distance, battery, createdAt
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = req.query.search || ''; // search in rover name
    const temperatureMin = req.query.tempMin ? parseFloat(req.query.tempMin) : undefined;
    const temperatureMax = req.query.tempMax ? parseFloat(req.query.tempMax) : undefined;
    const batteryMin = req.query.batteryMin ? parseFloat(req.query.batteryMin) : undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : undefined;

    // Build where clause
    const whereClause = {};

    if (roverId) {
      whereClause.roverId = roverId;
    }

    if (temperatureMin !== undefined || temperatureMax !== undefined) {
      whereClause.temperature = {};
      if (temperatureMin !== undefined) whereClause.temperature.gte = temperatureMin;
      if (temperatureMax !== undefined) whereClause.temperature.lte = temperatureMax;
    }

    if (batteryMin !== undefined) {
      whereClause.battery = { gte: batteryMin };
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    // Build sort order
    const orderBy = {};
    const validSortFields = ['temperature', 'humidity', 'distance', 'battery', 'signalStrength', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;

    // If search is provided, we need to search in rover names
    if (search) {
      const rovers = await db.rover.findMany({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      const roverIds = rovers.map((r) => r.id);
      if (roverIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      whereClause.roverId = { in: roverIds };
    }

    // Get total count
    const total = await db.sensorLog.count({ where: whereClause });

    // Get paginated results
    const sensorLogs = await db.sensorLog.findMany({
      where: whereClause,
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
      orderBy,
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: sensorLogs,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      filters: {
        roverId,
        temperatureRange: temperatureMin || temperatureMax ? { min: temperatureMin, max: temperatureMax } : null,
        batteryMin,
        dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching sensor logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor logs',
      error: error.message,
    });
  }
});

// POST /api/sensor-logs - Create new sensor log
router.post('/', async (req, res) => {
  try {
    const { roverId, temperature, humidity, distance, battery, signalStrength } = req.body;

    // Validation
    if (!roverId || temperature === undefined || humidity === undefined || distance === undefined) {
      return res.status(400).json({
        success: false,
        message: 'roverId, temperature, humidity, and distance are required',
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

    // Create sensor log
    const sensorLog = await db.sensorLog.create({
      data: {
        roverId: parseInt(roverId),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        distance: parseFloat(distance),
        battery: parseInt(battery) || 0,
        signalStrength: parseInt(signalStrength) || 0,
      },
      include: {
        rover: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sensor log created successfully',
      data: sensorLog,
    });
  } catch (error) {
    console.error('Error creating sensor log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sensor log',
      error: error.message,
    });
  }
});

// GET /api/sensor-logs/stats - Get aggregated sensor statistics for dashboard
router.get('/stats/aggregated', async (req, res) => {
  try {
    const db = getPrisma();
    const roverId = req.query.roverId ? parseInt(req.query.roverId) : undefined;
    const days = parseInt(req.query.days) || 30;

    const whereClause = {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (roverId) {
      whereClause.roverId = roverId;
    }

    // Get aggregated stats
    const logs = await db.sensorLog.findMany({
      where: whereClause,
      select: {
        temperature: true,
        humidity: true,
        distance: true,
        battery: true,
        signalStrength: true,
        createdAt: true,
        rover: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (logs.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReadings: 0,
          avgTemperature: 0,
          avgHumidity: 0,
          avgDistance: 0,
          avgBattery: 0,
          avgSignalStrength: 0,
          minTemperature: 0,
          maxTemperature: 0,
          readings: [],
        },
      });
    }

    const avgTemperature = logs.reduce((sum, log) => sum + log.temperature, 0) / logs.length;
    const avgHumidity = logs.reduce((sum, log) => sum + log.humidity, 0) / logs.length;
    const avgDistance = logs.reduce((sum, log) => sum + log.distance, 0) / logs.length;
    const avgBattery = logs.reduce((sum, log) => sum + log.battery, 0) / logs.length;
    const avgSignalStrength = logs.reduce((sum, log) => sum + log.signalStrength, 0) / logs.length;
    const minTemperature = Math.min(...logs.map((log) => log.temperature));
    const maxTemperature = Math.max(...logs.map((log) => log.temperature));

    // Group by date for chart data
    const dailyStats = {};
    logs.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          temperature: [],
          humidity: [],
          battery: [],
          count: 0,
        };
      }
      dailyStats[date].temperature.push(log.temperature);
      dailyStats[date].humidity.push(log.humidity);
      dailyStats[date].battery.push(log.battery);
      dailyStats[date].count += 1;
    });

    const chartData = Object.values(dailyStats).map((stat) => ({
      date: stat.date,
      temperature: Math.round((stat.temperature.reduce((a, b) => a + b, 0) / stat.temperature.length) * 10) / 10,
      humidity: Math.round((stat.humidity.reduce((a, b) => a + b, 0) / stat.humidity.length) * 10) / 10,
      battery: Math.round((stat.battery.reduce((a, b) => a + b, 0) / stat.battery.length) * 10) / 10,
    }));

    res.json({
      success: true,
      data: {
        totalReadings: logs.length,
        avgTemperature: Math.round(avgTemperature * 10) / 10,
        avgHumidity: Math.round(avgHumidity * 10) / 10,
        avgDistance: Math.round(avgDistance * 10) / 10,
        avgBattery: Math.round(avgBattery * 10) / 10,
        avgSignalStrength: Math.round(avgSignalStrength * 10) / 10,
        minTemperature: Math.round(minTemperature * 10) / 10,
        maxTemperature: Math.round(maxTemperature * 10) / 10,
        chartData,
      },
    });
  } catch (error) {
    console.error('Error fetching sensor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor statistics',
      error: error.message,
    });
  }
});

module.exports = router;
