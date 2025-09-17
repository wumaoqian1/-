import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-here'
const JWT_EXPIRES_IN = '7d'

/**
 * 密码加密
 * @param password - 明文密码
 * @returns 加密后的密码哈希
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * 密码验证
 * @param password - 明文密码
 * @param hashedPassword - 加密后的密码哈希
 * @returns 密码是否匹配
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * 生成JWT令牌
 * @param payload - 令牌载荷数据
 * @returns JWT令牌字符串
 */
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 验证JWT令牌
 * @param token - JWT令牌字符串
 * @returns 解码后的载荷数据或null
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * JWT认证中间件
 * 验证请求头中的Authorization令牌
 * @param req - Express请求对象
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(403).json({ error: '无效的访问令牌' })
  }

  // 将用户信息添加到请求对象中
  ;(req as any).user = decoded
  next()
}

/**
 * 可选的JWT认证中间件
 * 如果有令牌则验证，没有令牌也允许通过
 * @param req - Express请求对象
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      ;(req as any).user = decoded
    }
  }

  next()
}

/**
 * 管理员权限验证中间件
 * @param req - Express请求对象
 * @param res - Express响应对象
 * @param next - Express下一个中间件函数
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  
  next()
}