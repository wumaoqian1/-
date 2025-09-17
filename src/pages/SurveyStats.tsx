import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Eye
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// 问题接口
interface Question {
  id: string
  type: string
  title: string
  required: boolean
  options?: Array<{
    id: string
    text: string
    value: string
  }>
}

// 问卷接口
interface Survey {
  id: string
  title: string
  description: string
  status: string
  questions: Question[]
  created_at: string
}

// 统计数据接口
interface SurveyStats {
  total_responses: number
  completion_rate: number
  average_time: number
  response_trend: Array<{
    date: string
    count: number
  }>
  question_stats: Array<{
    question_id: string
    question_title: string
    question_type: string
    stats: {
      total_responses: number
      option_counts?: Record<string, number>
      text_responses?: string[]
      rating_average?: number
      rating_distribution?: Record<string, number>
    }
  }>
}

// 颜色配置
const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
]

/**
 * 问卷统计分析页面组件
 * 提供问卷数据可视化和统计分析功能
 */
export default function SurveyStats() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // 获取问卷信息
  const fetchSurvey = async () => {
    if (!id) return
    
    try {
      const response = await apiClient.get(`/api/surveys/${id}`)
      if (response.success) {
        setSurvey(response.data as Survey)
      } else {
        toast.error('获取问卷信息失败')
      }
    } catch (error) {
      console.error('获取问卷失败:', error)
      toast.error('获取问卷信息失败')
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    if (!id) return
    
    try {
      const response = await apiClient.get(`/api/responses/${id}/stats`)
      if (response.success) {
        setStats(response.data as SurveyStats)
      } else {
        toast.error('获取统计数据失败')
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      toast.error('获取统计数据失败')
    }
  }

  // 导出数据
  const handleExport = async () => {
    if (!id) return
    
    setExporting(true)
    try {
      const response = await apiClient.get(`/api/responses/${id}/export`, {
        responseType: 'blob'
      })
      
      if (response.success) {
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `survey_${id}_responses.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        toast.success('数据导出成功')
      } else {
        toast.error('导出失败')
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error('导出数据失败')
    } finally {
      setExporting(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  // 渲染选择题统计图表
  const renderChoiceChart = (questionStat: SurveyStats['question_stats'][0]) => {
    if (!questionStat.stats.option_counts) return null
    
    const question = survey?.questions.find(q => q.id === questionStat.question_id)
    if (!question?.options) return null
    
    const chartData = Object.entries(questionStat.stats.option_counts).map(([value, count]) => {
      const option = question.options?.find(opt => opt.value === value)
      return {
        name: option?.text || value,
        value: count,
        percentage: ((count / questionStat.stats.total_responses) * 100).toFixed(1)
      }
    })
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 柱状图 */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-4">选项分布</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [value, '回答数']}
                labelFormatter={(label) => `选项: ${label}`}
              />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 饼图 */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-4">比例分布</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name, props: any) => [
                  `${value} (${props.payload?.percentage || 0}%)`, 
                  '回答数'
                ]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload?.percentage || 0}%)
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // 渲染评分题统计
  const renderRatingChart = (questionStat: SurveyStats['question_stats'][0]) => {
    if (!questionStat.stats.rating_distribution) return null
    
    const chartData = Object.entries(questionStat.stats.rating_distribution).map(([rating, count]) => ({
      rating: `${rating}星`,
      count,
      percentage: ((count / questionStat.stats.total_responses) * 100).toFixed(1)
    }))
    
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">评分分布</h4>
          <div className="text-sm text-gray-600">
            平均分: <span className="font-medium text-blue-600">
              {questionStat.stats.rating_average?.toFixed(1)}/5.0
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number, name, props: any) => [
                `${value} (${props.payload?.percentage || 0}%)`, 
                '回答数'
              ]}
            />
            <Bar dataKey="count" fill={COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 渲染文本题回答
  const renderTextResponses = (questionStat: SurveyStats['question_stats'][0]) => {
    if (!questionStat.stats.text_responses?.length) {
      return (
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-500 text-center">暂无回答</p>
        </div>
      )
    }
    
    return (
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-900 mb-4">
          文本回答 ({questionStat.stats.text_responses.length}条)
        </h4>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {questionStat.stats.text_responses.slice(0, 10).map((response, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{response}</p>
            </div>
          ))}
          {questionStat.stats.text_responses.length > 10 && (
            <p className="text-sm text-gray-500 text-center">
              还有 {questionStat.stats.text_responses.length - 10} 条回答...
            </p>
          )}
        </div>
      </div>
    )
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSurvey(), fetchStats()])
      setLoading(false)
    }
    
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!survey || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">数据加载失败</h2>
          <p className="text-gray-600 mb-4">无法获取问卷统计数据</p>
          <Link
            to="/surveys"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            返回问卷列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/surveys"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
              <p className="text-gray-600">统计分析</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/surveys/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              预览问卷
            </Link>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? '导出中...' : '导出数据'}
            </button>
          </div>
        </div>

        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总回答数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_responses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">完成率</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均用时</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(stats.average_time)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">问题数量</p>
                <p className="text-2xl font-bold text-gray-900">{survey.questions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 回答趋势图 */}
        {stats.response_trend.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">回答趋势</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.response_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatDate}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(label) => `日期: ${formatDate(label)}`}
                    formatter={(value: number) => [value, '回答数']}
                  />
                  <Bar dataKey="count" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 问题统计 */}
        <div className="space-y-8">
          {stats.question_stats.map((questionStat, index) => (
            <div key={questionStat.question_id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      问题 {index + 1}: {questionStat.question_title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>类型: {questionStat.question_type}</span>
                      <span>回答数: {questionStat.stats.total_responses}</span>
                    </div>
                  </div>
                </div>
                
                {/* 根据问题类型渲染不同的统计图表 */}
                {['radio', 'checkbox', 'select'].includes(questionStat.question_type) && 
                  renderChoiceChart(questionStat)
                }
                
                {questionStat.question_type === 'rating' && 
                  renderRatingChart(questionStat)
                }
                
                {['text', 'textarea'].includes(questionStat.question_type) && 
                  renderTextResponses(questionStat)
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}