import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { AuthenticatedRequest, JWT_SECRET } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword, userType, preferredLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const emailNormalized = email.trim().toLowerCase();
    const existingUser = await db.users.findOne((u) => u.email === emailNormalized);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // CRITICAL: Public registration MUST always create role = USER
    const newUser = await db.users.insert({
      name: name.trim(),
      email: emailNormalized,
      passwordHash,
      role: 'USER',
      userType: userType || 'BEGINNER',
      preferredLanguage: preferredLanguage || 'en',
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userType: newUser.userType,
        preferredLanguage: newUser.preferredLanguage,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to register at this time. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const emailNormalized = email.trim().toLowerCase();
    const user = await db.users.findOne((u) => u.email === emailNormalized);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const user = await db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile' });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Cascade delete user data
    await db.transactions.deleteMany((t) => t.userId === userId);
    await db.budgets.deleteMany((b) => b.userId === userId);
    await db.savingsGoals.deleteMany((g) => g.userId === userId);
    await db.documents.deleteMany((d) => d.userId === userId);
    await db.notifications.deleteMany((n) => n.userId === userId);
    await db.resourceReports.deleteMany((r) => r.reportedBy === userId);
    await db.users.deleteById(userId);

    return res.status(200).json({
      success: true,
      message: 'Account and associated financial data have been permanently deleted',
    });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};
