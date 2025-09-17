import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

/**
 * 首页组件
 * 展示问卷系统的介绍、功能特点和导航
 */
export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // 功能特点列表
  const features = [
    {
      icon: FileText,
      title: '简单易用',
      description: '直观的界面设计，让您轻松创建和管理问卷'
    },
    {
      icon: Users,
      title: '多人协作',
      description: '支持团队协作，共同完成问卷设计和数据收集'
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '实时统计分析，帮您深入了解调研结果'
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '企业级安全保障，保护您的数据隐私'
    },
    {
      icon: Zap,
      title: '快速响应',
      description: '高性能架构，确保问卷填写和数据处理的流畅体验'
    },
    {
      icon: Globe,
      title: '随时随地',
      description: '支持多设备访问，随时随地进行问卷管理'
    }
  ]

  // 使用场景列表
  const useCases = [
    '市场调研和用户反馈收集',
    '员工满意度和绩效评估',
    '学术研究和数据收集',
    '活动报名和信息登记',
    '产品评价和改进建议'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">问卷调查系统</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  进入控制台
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        {/* 英雄区域 */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                专业的问卷调查平台
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                轻松创建问卷，高效收集数据，深入分析结果。为您的调研工作提供全方位支持，让数据驱动决策变得简单。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                  >
                    进入控制台
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                      免费开始
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 px-8 rounded-lg border border-gray-300 transition-colors"
                    >
                      立即登录
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 功能特点 */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                为什么选择我们？
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                我们提供完整的问卷调查解决方案，从创建到分析，一站式满足您的需求
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 使用场景 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  适用于各种场景
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  无论是企业调研、学术研究还是活动组织，我们的平台都能为您提供专业的支持
                </p>
                <ul className="space-y-4">
                  {useCases.map((useCase, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    立即开始您的第一个问卷
                  </h3>
                  <p className="text-gray-600 mb-6">
                    注册账户，几分钟内即可创建专业的问卷调查
                  </p>
                  {!isAuthenticated && (
                    <Link
                      to="/register"
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                      免费注册
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">问卷调查系统</span>
            </div>
            <p className="text-gray-400">
              © 2024 问卷调查系统. 专业的数据收集与分析平台.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}