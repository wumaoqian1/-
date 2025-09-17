import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  GripVertical,
  Settings,
  Copy
} from 'lucide-react'

// 问题类型定义
type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating'

// 问题选项接口
interface QuestionOption {
  id: string
  text: string
  value: string
}

// 问题接口
interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  order_index: number
}

// 问卷接口
interface Survey {
  id?: string
  title: string
  description: string
  status: 'draft' | 'published' | 'closed'
  questions: Question[]
}

// 问题类型选项
const questionTypes = [
  { value: 'text', label: '单行文本', icon: '📝' },
  { value: 'textarea', label: '多行文本', icon: '📄' },
  { value: 'radio', label: '单选题', icon: '⚪' },
  { value: 'checkbox', label: '多选题', icon: '☑️' },
  { value: 'select', label: '下拉选择', icon: '📋' },
  { value: 'rating', label: '评分题', icon: '⭐' }
]

/**
 * 问卷编辑器组件
 * 提供问卷创建和编辑功能
 */
export default function SurveyEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id && id !== 'new')
  
  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    status: 'draft',
    questions: []
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null)

  // 获取问卷数据（编辑模式）
  const fetchSurvey = async () => {
    if (!isEditing) return
    
    setLoading(true)
    try {
      const response = await apiClient.get(`/api/surveys/${id}`)
      if (response.success) {
        setSurvey(response.data as Survey)
      } else {
        toast.error('获取问卷数据失败')
        navigate('/surveys')
      }
    } catch (error) {
      console.error('获取问卷失败:', error)
      toast.error('获取问卷数据失败')
      navigate('/surveys')
    } finally {
      setLoading(false)
    }
  }

  // 保存问卷
  const handleSave = async (status?: 'draft' | 'published') => {
    if (!survey.title.trim()) {
      toast.error('请输入问卷标题')
      return
    }

    if (survey.questions.length === 0) {
      toast.error('请至少添加一个问题')
      return
    }

    setSaving(true)
    try {
      const surveyData = {
        ...survey,
        status: status || survey.status
      }

      let response
      if (isEditing) {
        response = await apiClient.put(`/api/surveys/${id}`, surveyData)
      } else {
        response = await apiClient.post('/api/surveys', surveyData)
      }

      if (response.success) {
        toast.success(isEditing ? '问卷更新成功' : '问卷创建成功')
        if (!isEditing) {
          navigate(`/surveys/${response.data.id}/edit`)
        } else {
          setSurvey(response.data as Survey)
        }
      } else {
        toast.error(response.message || '保存失败')
      }
    } catch (error) {
      console.error('保存问卷失败:', error)
      toast.error('保存问卷失败')
    } finally {
      setSaving(false)
    }
  }

  // 添加问题
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      title: '',
      required: false,
      order_index: survey.questions.length,
      options: ['radio', 'checkbox', 'select'].includes(type) ? [
        { id: `opt_${Date.now()}_1`, text: '选项1', value: 'option1' },
        { id: `opt_${Date.now()}_2`, text: '选项2', value: 'option2' }
      ] : undefined
    }

    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  // 更新问题
  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }))
  }

  // 删除问题
  const deleteQuestion = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  // 复制问题
  const duplicateQuestion = (questionId: string) => {
    const question = survey.questions.find(q => q.id === questionId)
    if (!question) return

    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}`,
      title: `${question.title} (副本)`,
      order_index: survey.questions.length,
      options: question.options?.map(opt => ({
        ...opt,
        id: `opt_${Date.now()}_${opt.value}`
      }))
    }

    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  // 添加选项
  const addOption = (questionId: string) => {
    const question = survey.questions.find(q => q.id === questionId)
    if (!question || !question.options) return

    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      text: `选项${question.options.length + 1}`,
      value: `option${question.options.length + 1}`
    }

    updateQuestion(questionId, {
      options: [...question.options, newOption]
    })
  }

  // 更新选项
  const updateOption = (questionId: string, optionId: string, text: string) => {
    const question = survey.questions.find(q => q.id === questionId)
    if (!question || !question.options) return

    const updatedOptions = question.options.map(opt => 
      opt.id === optionId ? { ...opt, text, value: text.toLowerCase().replace(/\s+/g, '_') } : opt
    )

    updateQuestion(questionId, { options: updatedOptions })
  }

  // 删除选项
  const deleteOption = (questionId: string, optionId: string) => {
    const question = survey.questions.find(q => q.id === questionId)
    if (!question || !question.options || question.options.length <= 2) return

    const updatedOptions = question.options.filter(opt => opt.id !== optionId)
    updateQuestion(questionId, { options: updatedOptions })
  }

  // 渲染问题编辑器
  const renderQuestionEditor = (question: Question, index: number) => {
    const questionType = questionTypes.find(t => t.value === question.type)
    
    return (
      <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <span className="text-sm font-medium text-gray-500">问题 {index + 1}</span>
            <span className="text-sm text-gray-400">{questionType?.icon} {questionType?.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => duplicateQuestion(question.id)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="复制问题"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteQuestion(question.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="删除问题"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 问题标题 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="请输入问题标题"
            value={question.title}
            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 问题描述 */}
        <div className="mb-4">
          <textarea
            placeholder="问题描述（可选）"
            value={question.description || ''}
            onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 选项编辑（单选、多选、下拉） */}
        {question.options && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">选项</label>
              <button
                onClick={() => addOption(question.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + 添加选项
              </button>
            </div>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-8">{optIndex + 1}.</span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {question.options!.length > 2 && (
                    <button
                      onClick={() => deleteOption(question.id, option.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 问题设置 */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">必填</span>
          </label>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchSurvey()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/surveys')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? '编辑问卷' : '创建问卷'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? '修改问卷内容和设置' : '设计您的调查问卷'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing && (
              <Link
                to={`/surveys/${id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                预览
              </Link>
            )}
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? '发布中...' : '发布问卷'}
            </button>
          </div>
        </div>

        {/* 问卷基本信息 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问卷标题 *
                </label>
                <input
                  type="text"
                  placeholder="请输入问卷标题"
                  value={survey.title}
                  onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问卷描述
                </label>
                <textarea
                  placeholder="请输入问卷描述"
                  value={survey.description}
                  onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 问题列表 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">问题设计</h2>
            <span className="text-sm text-gray-500">{survey.questions.length} 个问题</span>
          </div>
          
          {survey.questions.map((question, index) => 
            renderQuestionEditor(question, index)
          )}
        </div>

        {/* 添加问题 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加问题</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {questionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => addQuestion(type.value as QuestionType)}
                  className="flex items-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-lg mr-2">{type.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}