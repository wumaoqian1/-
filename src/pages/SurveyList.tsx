import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  BarChart3,
  Copy,
  ExternalLink
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

/**
 * 问卷列表页面组件
 * 展示所有问卷，提供搜索、筛选、管理功能
 */
export default function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 获取问卷列表
  const fetchSurveys = async () => {
    try {
      const response = await apiClient.get('/api/surveys')
      if (response.success) {
        setSurveys(response.data as Survey[])
        setFilteredSurveys(response.data as Survey[])
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

  // 复制问卷链接
  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success('问卷链接已复制到剪贴板')
    }).catch(() => {
      toast.error('复制失败')
    })
  }

  // 筛选和排序问卷
  const filterAndSortSurveys = () => {
    let filtered = surveys.filter(survey => {
      const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           survey.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || survey.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'created_at':
        case 'updated_at':
          aValue = new Date(a[sortBy]).getTime()
          bValue = new Date(b[sortBy]).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredSurveys(filtered)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  useEffect(() => {
    filterAndSortSurveys()
  }, [surveys, searchTerm, statusFilter, sortBy, sortOrder])

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
        {/* 页面标题和操作 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">问卷管理</h1>
            <p className="text-gray-600 mt-2">
              管理您的所有问卷，查看状态和统计数据
            </p>
          </div>
          <Link
            to="/surveys/new"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建问卷
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索问卷标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 状态筛选 */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">所有状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>

              {/* 排序方式 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'updated_at' | 'title')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">按创建时间</option>
                <option value="updated_at">按更新时间</option>
                <option value="title">按标题</option>
              </select>

              {/* 排序顺序 */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 问卷列表 */}
        <div className="bg-white rounded-lg shadow">
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? '没有找到匹配的问卷' : '还没有问卷'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' ? '尝试调整搜索条件或筛选器' : '创建您的第一个问卷开始收集数据'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link
                  to="/surveys/new"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建问卷
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSurveys.map((survey) => {
                const statusInfo = getStatusInfo(survey.status)
                return (
                  <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {survey.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {survey.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            创建于 {formatDate(survey.created_at)}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {survey.response_count || 0} 回答
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            更新于 {formatDate(survey.updated_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2 ml-4">
                        {survey.status === 'published' && (
                          <button
                            onClick={() => handleCopyLink(survey.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="复制问卷链接"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                        
                        <Link
                          to={`/surveys/${survey.id}/analytics`}
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="查看统计"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        
                        <Link
                          to={`/surveys/${survey.id}`}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="预览问卷"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        {survey.status === 'published' && (
                          <a
                            href={`/survey/${survey.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="在新窗口中打开"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        
                        <Link
                          to={`/surveys/${survey.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="编辑问卷"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteSurvey(survey.id)}
                          disabled={deleteLoading === survey.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="删除问卷"
                        >
                          {deleteLoading === survey.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {filteredSurveys.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            显示 {filteredSurveys.length} 个问卷，共 {surveys.length} 个
          </div>
        )}
      </div>
    </div>
  )
}