import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 用户信息接口
interface User {
  id: string
  email: string
  username: string
  role: 'admin' | 'user'
  created_at: string
}

// 认证状态接口
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// 认证操作接口
interface AuthActions {
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
}

/**
 * 用户认证状态管理
 * 使用Zustand管理用户登录状态，支持持久化存储
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * 用户登录
       * @param user - 用户信息
       * @param token - JWT令牌
       */
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        })
      },

      /**
       * 用户登出
       * 清除所有认证信息
       */
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      /**
       * 设置加载状态
       * @param loading - 是否正在加载
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      /**
       * 更新用户信息
       * @param userData - 要更新的用户数据
       */
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          })
        }
      }
    }),
    {
      name: 'auth-storage', // 本地存储的键名
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }) // 只持久化这些字段
    }
  )
)

/**
 * 获取认证头部
 * @returns Authorization头部字符串或undefined
 */
export const getAuthHeader = (): string | undefined => {
  const token = useAuthStore.getState().token
  return token ? `Bearer ${token}` : undefined
}

/**
 * 检查用户是否为管理员
 * @returns 是否为管理员
 */
export const isAdmin = (): boolean => {
  const user = useAuthStore.getState().user
  return user?.role === 'admin'
}

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export const isLoggedIn = (): boolean => {
  return useAuthStore.getState().isAuthenticated
}