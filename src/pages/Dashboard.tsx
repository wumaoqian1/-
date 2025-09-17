import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import {
  Plus,
  FileText,
  Users,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Calendar,
  TrendingUp
} from 'lucide-react'

// 问卷接口定义
interface Survey {
  id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'closed'
  created_at: string
  updated_at: string
  response_count?: number
}

// 统计数据接口
interface DashboardStats {
  totalSurveys: number
  publishedSurveys: number
  totalResponses: number
  recentActivity: number
}

/**
 * 仪表盘页面组件
 * 展示用户的问卷概览、统计数据和快速操作
 */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalSurveys: 0,
    publishedSurveys: 0,
    totalResponses: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // 获取问卷列表
  const fetchSurveys = async () => {
    try {
      const response = await apiClient.get('/api/surveys')
      if (response.success) {
        setSurveys(response.data as Survey[])
        // 计算统计数据
        const surveyData = response.data as Survey[]
        const totalSurveys = surveyData.length
        const publishedSurveys = surveyData.filter((s: Survey) => s.status === 'published').length
        const totalResponses = surveyData.reduce((sum: number, s: Survey) => sum + (s.response_count || 0), 0)
        
        setStats({
          totalSurveys,
          publishedSurveys,
          totalResponses,
          recentActivity: totalSurveys // 简化处理
        })
      }
    } catch (error) {
      console.error('获取问卷列表失败:', error)
      toast.error('获取问卷列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除问卷
  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('确定要删除这个问卷吗？此操作不可恢复。')) {
      return
    }

    setDeleteLoading(surveyId)
    try {
      const response = await apiClient.delete(`/api/surveys/${surveyId}`)
      if (response.success) {
        toast.success('问卷删除成功')
        fetchSurveys() // 重新获取列表
      } else {
        toast.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除问卷失败:', error)
      toast.error('删除问卷失败')
    } finally {
      setDeleteLoading(null)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 获取状态显示文本和样式
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { text: '草稿', className: 'bg-gray-100 text-gray-800' }
      case 'published':
        return { text: '已发布', className: 'bg-green-100 text-green-800' }
      case 'closed':
        return { text: '已关闭', className: 'bg-red-100 text-red-800' }
      default:
        return { text: '未知', className: 'bg-gray-100 text-gray-800' }
    }
  }

  useEffect(() => {
    fetchSurveys()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            欢迎回来，{user?.username || '用户'}！
          </h1>
          <p className="text-gray-600 mt-2">
            管理您的问卷调查，查看数据统计和最新动态
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总问卷数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已发布</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedSurveys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总回答数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本月活动</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">快速操作</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/surveys/new"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">创建新问卷</h3>
                  <p className="text-sm text-gray-500">开始设计您的调查问卷</p>
                </div>
              </Link>

              <Link
                to="/surveys"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <FileText className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">管理问卷</h3>
                  <p className="text-sm text-gray-500">查看和编辑现有问卷</p>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">数据分析</h3>
                  <p className="text-sm text-gray-500">查看问卷统计结果</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 最近的问卷 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">最近的问卷</h2>
            <Link
              to="/surveys"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              查看全部
            </Link>
          </div>
          <div className="p-6">
            {surveys.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">还没有问卷</h3>
                <p className="text-gray-500 mb-4">创建您的第一个问卷开始收集数据</p>
                <Link
                  to="/surveys/new"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建问卷
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.slice(0, 5).map((survey) => {
                  const statusInfo = getStatusInfo(survey.status)
                  return (
                    <div key={survey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{survey.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(survey.created_at)}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {survey.response_count || 0} 回答
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/surveys/${survey.id}/analytics`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="查看统计"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/surveys/${survey.id}`}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="预览"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/surveys/${survey.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteSurvey(survey.id)}
                          disabled={deleteLoading === survey.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          {deleteLoading === survey.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}