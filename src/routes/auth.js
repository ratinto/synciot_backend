const express = require('express');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();

// Lazy-load Prisma client
let prisma = null;

function getPrisma() {
  if (!prisma) {
    console.log('🔄 Initializing Prisma Client...');
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
      .then(() => console.log('✅ Database connected'))
      .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        // Retry after 2 seconds
        setTimeout(() => {
          prisma.$connect()
            .then(() => console.log('✅ Database reconnected'))
            .catch(() => console.error('❌ Database reconnection failed'));
        }, 2000);
      });
  }
  return prisma;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const db = getPrisma();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    }).catch(err => {
      console.error('Database error in findUnique:', err);
      throw err;
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'operator', // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    }).catch(err => {
      console.error('Database error in create:', err);
      throw err;
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = getPrisma();

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    }).catch(err => {
      console.error('Database error in findUnique:', err);
      throw err;
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
