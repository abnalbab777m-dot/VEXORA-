import { hasDatabase } from '../../db/index';
import { userRepository } from '../repositories/userRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export class AuthService {
  async register(data: any) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured. Registration unavailable.');
    }

    const { username, email, password, efootballUsername, jawakerUsername, gameUsername } = data;

    const existingUser = await userRepository.findByEmailOrUsername(email, username);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email is already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username is already taken');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      username,
      email,
      passwordHash,
      efootballUsername: efootballUsername?.trim() || '',
      jawakerUsername: jawakerUsername?.trim() || '',
      gameUsername: gameUsername?.trim() || efootballUsername?.trim() || '',
      role: 'USER',
      status: 'ACTIVE',
    });

    const token = this.generateToken(newUser.id, newUser.role);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = newUser;

    // Async Telegram Notification
    import('./telegramService').then(({ telegramService }) => {
      telegramService.notifyNewUser({
        id: newUser.id,
        username,
        email,
        efootballUsername: newUser.efootballUsername,
        jawakerUsername: newUser.jawakerUsername,
        gameUsername: newUser.gameUsername,
        role: newUser.role
      }).catch(e => console.error('Telegram notification failed:', e));
    });

    return { user: safeUser, token };
  }

  async login(data: any) {
    if (!hasDatabase()) {
      throw new Error('Database is not configured. Login unavailable.');
    }

    const { identifier, password } = data; // identifier can be email or username

    let user = await userRepository.findByEmail(identifier);
    if (!user) {
      user = await userRepository.findByUsername(identifier);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(`Account is ${user.status.toLowerCase()}`);
    }

    const token = this.generateToken(user.id, user.role);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  private generateToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (err) {
      return null;
    }
  }
}

export const authService = new AuthService();
