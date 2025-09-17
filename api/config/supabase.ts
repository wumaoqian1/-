import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for backend')
}

/**
 * 后端Supabase客户端实例（使用Service Role Key）
 * 用于服务端与Supabase数据库的交互，具有管理员权限
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * 数据库表名常量
 */
export const TABLES = {
  USERS: 'users',
  SURVEYS: 'surveys',
  QUESTIONS: 'questions', 
  RESPONSES: 'responses',
  ANSWERS: 'answers'
} as const

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

/**
 * 问卷状态枚举
 */
export enum SurveyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed'
}

/**
 * 问题类型枚举
 */
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text', 
  RATING = 'rating'
}