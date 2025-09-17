import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { hashPassword, comparePassword, generateToken, authenticateToken } from '../utils/auth.js'
import { z } from 'zod'

const router = Router()

// 注册请求验证模式
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  username: z.string().min(2, '用户名至少2位').max(50, '用户名最多50位')
})

// 登录请求验证模式
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

/**
 * 用户注册接口
 * @route POST /api/auth/register
 * @param req - 包含email, password, username的请求
 * @param res - 返回用户信息和JWT令牌
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const validatedData = registerSchema.parse(req.body)
    const { email, password, username } = validatedData

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' })
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        username,
        role: 'user'
      })
      .select('id, email, username, role, created_at')
      .single()

    if (error) {
      console.error('创建用户失败:', error)
      return res.status(500).json({ error: '注册失败，请稍后重试' })
    }

    // 生成JWT令牌
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    })

    res.status(201).json({
      message: '注册成功',
      user: newUser,
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('注册错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 用户登录接口
 * @route POST /api/auth/login
 * @param req - 包含email, password的请求
 * @param res - 返回用户信息和JWT令牌
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const validatedData = loginSchema.parse(req.body)
    const { email, password } = validatedData

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, role, password_hash')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // 返回用户信息（不包含密码哈希）
    const { password_hash, ...userInfo } = user

    res.json({
      message: '登录成功',
      user: userInfo,
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('登录错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 获取当前用户信息接口
 * @route GET /api/auth/me
 * @param req - 包含JWT令牌的请求
 * @param res - 返回当前用户信息
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, role, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({ user })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 用户登出接口（客户端处理）
 * @route POST /api/auth/logout
 * @param req - 请求对象
 * @param res - 返回登出成功消息
 */
router.post('/logout', (req: Request, res: Response) => {
  // JWT是无状态的，登出主要由客户端处理（删除本地存储的token）
  res.json({ message: '登出成功' })
})

export default router
