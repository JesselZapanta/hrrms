import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'

export const AuthService = {
  login(username, password) {
    const user = getDb()
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(String(username).trim())

    if (!user) throw new Error('Invalid username or password')
    if (user.status !== 'active') throw new Error('Account is inactive')

    const valid = bcrypt.compareSync(String(password), user.password_hash)
    if (!valid) throw new Error('Invalid username or password')

    const { password_hash, ...safe } = user
    return safe
  }
}
