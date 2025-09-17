import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  BarChart3, 
  LogOut, 
  User,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface LayoutProps {
  children: React.ReactNode
}

/**
 * 主布局组件
 * 包含导航栏、侧边栏和主内容区域
 * @param children - 子组件内容
 */
function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    logout()
    toast.success('已成功登出')
    navigate('/login')
  }

  /**
   * 检查当前路径是否激活
   * @param path - 路径
   * @returns 是否激活
   */
  const isActivePath = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // 导航菜单项
  const navigationItems = [
    {
      name: '仪表板',
      href: '/dashboard',
      icon: Home,
      current: isActivePath('/dashboard')
    },
    {
      name: '问卷管理',
      href: '/surveys',
      icon: FileText,
      current: isActivePath('/surveys')
    }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo区域 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">问卷系统</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${item.current 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* 创建问卷按钮 */}
            <Link
              to="/surveys/new"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus className="mr-3 h-5 w-5" />
              创建问卷
            </Link>
          </nav>

          {/* 用户信息区域 */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || '用户'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigationItems.find(item => item.current)?.name || '仪表板'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                欢迎，{user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout