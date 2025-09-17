import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff
} from 'lucide-react'

// 问题选项接口
interface QuestionOption {
  id: string
  text: string
  value: string
}

// 问题接口
interface Question {
  id: string
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating'
  title: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  order_index: number
}

// 问卷接口
interface Survey {
  id: string
  title: string
  description: string
  status: string
  questions: Question[]
  created_at: string
  updated_at: string
}

// 答案接口
interface Answer {
  question_id: string
  answer_text?: string
  selected_options?: string[]
  rating_value?: number
}

/**
 * 问卷填写页面组件
 * 提供用户填写问卷的功能
 */
export default function SurveyFill() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 获取问卷数据
  const fetchSurvey = async () => {
    if (!id) {
      navigate('/')
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.get(`/api/surveys/${id}`)
      if (response.success) {
        if ((response.data as any).status !== 'published') {
          toast.error('该问卷暂未发布或已关闭')
          navigate('/')
          return
        }
        setSurvey(response.data as Survey)
        // 初始化答案对象
        const initialAnswers: Record<string, Answer> = {}
        ;(response.data as Survey).questions.forEach((question: Question) => {
          initialAnswers[question.id] = {
            question_id: question.id
          }
        })
        setAnswers(initialAnswers)
      } else {
        toast.error('问卷不存在或已删除')
        navigate('/')
      }
    } catch (error) {
      console.error('获取问卷失败:', error)
      toast.error('获取问卷失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  // 更新答案
  const updateAnswer = (questionId: string, updates: Partial<Answer>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...updates
      }
    }))
    
    // 清除该问题的错误信息
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  // 验证答案
  const validateAnswers = (): boolean => {
    if (!survey) return false
    
    const newErrors: Record<string, string> = {}
    
    survey.questions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id]
        
        switch (question.type) {
          case 'text':
          case 'textarea':
            if (!answer.answer_text?.trim()) {
              newErrors[question.id] = '此题为必填项'
            }
            break
          case 'radio':
          case 'select':
            if (!answer.selected_options?.length) {
              newErrors[question.id] = '请选择一个选项'
            }
            break
          case 'checkbox':
            if (!answer.selected_options?.length) {
              newErrors[question.id] = '请至少选择一个选项'
            }
            break
          case 'rating':
            if (!answer.rating_value || answer.rating_value < 1) {
              newErrors[question.id] = '请进行评分'
            }
            break
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交问卷
  const handleSubmit = async () => {
    if (!validateAnswers()) {
      toast.error('请完成所有必填项')
      return
    }

    setSubmitting(true)
    try {
      const answersArray = Object.values(answers).map(answer => ({
        question_id: answer.question_id,
        answer_text: answer.answer_text || null,
        selected_options: answer.selected_options || null,
        rating_value: answer.rating_value || null
      }))

      const response = await apiClient.post('/api/responses', {
        survey_id: id,
        answers: answersArray
      })

      if (response.success) {
        setSubmitted(true)
        toast.success('问卷提交成功！感谢您的参与')
      } else {
        toast.error(response.message || '提交失败，请重试')
      }
    } catch (error) {
      console.error('提交问卷失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 渲染评分组件
  const renderRating = (question: Question) => {
    const currentRating = answers[question.id]?.rating_value || 0
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => updateAnswer(question.id, { rating_value: rating })}
            className="p-1 transition-colors"
          >
            {rating <= currentRating ? (
              <Star className="h-8 w-8 text-yellow-400 fill-current" />
            ) : (
              <StarOff className="h-8 w-8 text-gray-300" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {currentRating > 0 ? `${currentRating}/5` : '未评分'}
        </span>
      </div>
    )
  }

  // 渲染问题
  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id]
    const hasError = errors[question.id]
    
    return (
      <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                <span className="text-blue-600 mr-2">{index + 1}.</span>
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              {question.description && (
                <p className="text-gray-600 text-sm mb-4">{question.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* 单行文本 */}
          {question.type === 'text' && (
            <input
              type="text"
              placeholder="请输入您的答案"
              value={answer.answer_text || ''}
              onChange={(e) => updateAnswer(question.id, { answer_text: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}

          {/* 多行文本 */}
          {question.type === 'textarea' && (
            <textarea
              placeholder="请输入您的答案"
              value={answer.answer_text || ''}
              onChange={(e) => updateAnswer(question.id, { answer_text: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}

          {/* 单选题 */}
          {question.type === 'radio' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option.value}
                    checked={answer.selected_options?.[0] === option.value}
                    onChange={(e) => updateAnswer(question.id, { selected_options: [e.target.value] })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* 多选题 */}
          {question.type === 'checkbox' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={answer.selected_options?.includes(option.value) || false}
                    onChange={(e) => {
                      const currentOptions = answer.selected_options || []
                      if (e.target.checked) {
                        updateAnswer(question.id, {
                          selected_options: [...currentOptions, option.value]
                        })
                      } else {
                        updateAnswer(question.id, {
                          selected_options: currentOptions.filter(opt => opt !== option.value)
                        })
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* 下拉选择 */}
          {question.type === 'select' && question.options && (
            <select
              value={answer.selected_options?.[0] || ''}
              onChange={(e) => updateAnswer(question.id, { selected_options: [e.target.value] })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">请选择...</option>
              {question.options.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          )}

          {/* 评分题 */}
          {question.type === 'rating' && renderRating(question)}
        </div>

        {/* 错误信息 */}
        {hasError && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {hasError}
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    fetchSurvey()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功！</h2>
            <p className="text-gray-600 mb-6">感谢您参与本次问卷调查，您的意见对我们非常重要。</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">问卷不存在</h2>
          <p className="text-gray-600 mb-4">您访问的问卷可能已被删除或链接有误</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600 mt-1">{survey.description}</p>
            )}
          </div>
        </div>

        {/* 问卷说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">填写说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>标有 <span className="text-red-500">*</span> 的问题为必填项</li>
                <li>请仔细阅读每个问题，如实填写</li>
                <li>填写完成后点击提交按钮</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 问题列表 */}
        <div className="mb-8">
          {survey.questions
            .sort((a, b) => a.order_index - b.order_index)
            .map((question, index) => renderQuestion(question, index))}
        </div>

        {/* 提交按钮 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {survey.questions.length} 道题目
              {Object.keys(errors).length > 0 && (
                <span className="text-red-600 ml-2">
                  还有 {Object.keys(errors).length} 个必填项未完成
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? '提交中...' : '提交问卷'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}