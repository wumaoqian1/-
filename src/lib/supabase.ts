import { createClient } from '@supabase/supabase-js'

// 获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase客户端实例
 * 用于前端与Supabase数据库的交互
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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