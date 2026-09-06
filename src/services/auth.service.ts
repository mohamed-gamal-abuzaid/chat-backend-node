import { db } from '../config/db';
import { users } from '../db/models/users';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

export class AuthService {


  static async register(data: { name: string; email: string; password: string }) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, data.email));
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [newUser] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

    return newUser;
  }


  static async login(data: { email: string; password: string }) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email));
    if (!user) throw new Error('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

}