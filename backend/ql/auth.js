// authService.js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // adjust based on performance tests

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}