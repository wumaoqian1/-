import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, optionalAuth } from '../utils/auth.js'
import { z } from 'zod'

const router = Router()

// 答案验证模式
const answerSchema = z.object({
  question_id: z.string().uuid('问题ID格式不正确'),
  answer_text: z.string().optional(),
  answer_options: z.array(z.string()).optional()
})

// 问卷回答提交验证模式
const responseSchema = z.object({
  survey_id: z.string().uuid('问卷ID格式不正确'),
  respondent_email: z.string().email('邮箱格式不正确').optional(),
  respondent_name: z.string().min(1, '姓名不能为空').optional(),
  answers: z.array(answerSchema).min(1, '至少需要回答一个问题')
})

/**
 * 提交问卷回答接口
 * @route POST /api/responses
 * @param req - 包含问卷回答数据的请求
 * @param res - 返回提交结果
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = responseSchema.parse(req.body)
    const { survey_id, respondent_email, respondent_name, answers } = validatedData

    // 检查问卷是否存在且已发布
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('surveys')
      .select('id, status, title')
      .eq('id', survey_id)
      .single()

    if (surveyError || !survey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (survey.status !== 'published') {
      return res.status(400).json({ error: '问卷未发布，无法提交回答' })
    }

    // 获取问卷的所有问题，验证必填项
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, is_required, question_text')
      .eq('survey_id', survey_id)

    if (questionsError) {
      console.error('获取问题列表失败:', questionsError)
      return res.status(500).json({ error: '获取问题列表失败' })
    }

    // 检查必填问题是否都已回答
    const requiredQuestions = questions.filter(q => q.is_required)
    const answeredQuestionIds = answers.map(a => a.question_id)
    
    for (const requiredQuestion of requiredQuestions) {
      if (!answeredQuestionIds.includes(requiredQuestion.id)) {
        return res.status(400).json({ 
          error: `必填问题未回答: ${requiredQuestion.question_text}` 
        })
      }
    }

    // 验证所有回答的问题都属于该问卷
    const validQuestionIds = questions.map(q => q.id)
    for (const answer of answers) {
      if (!validQuestionIds.includes(answer.question_id)) {
        return res.status(400).json({ error: '回答包含无效的问题ID' })
      }
    }

    // 创建回答记录
    const { data: response, error: responseError } = await supabaseAdmin
      .from('responses')
      .insert({
        survey_id,
        respondent_email,
        respondent_name
      })
      .select('id')
      .single()

    if (responseError) {
      console.error('创建回答记录失败:', responseError)
      return res.status(500).json({ error: '提交回答失败' })
    }

    // 批量插入答案
    const answersToInsert = answers.map(answer => ({
      response_id: response.id,
      question_id: answer.question_id,
      answer_text: answer.answer_text,
      answer_options: answer.answer_options
    }))

    const { error: answersError } = await supabaseAdmin
      .from('answers')
      .insert(answersToInsert)

    if (answersError) {
      console.error('保存答案失败:', answersError)
      // 如果答案保存失败，删除已创建的回答记录
      await supabaseAdmin.from('responses').delete().eq('id', response.id)
      return res.status(500).json({ error: '保存答案失败' })
    }

    res.status(201).json({ 
      message: '问卷提交成功',
      response_id: response.id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('提交问卷回答错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 获取问卷的所有回答接口（仅问卷创建者可访问）
 * @route GET /api/responses/survey/:surveyId
 * @param req - 包含问卷ID的请求
 * @param res - 返回问卷的所有回答数据
 */
router.get('/survey/:surveyId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params
    const user = (req as any).user

    // 检查问卷是否存在且用户有权限查看
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('surveys')
      .select('id, title, creator_id')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (survey.creator_id !== user.id) {
      return res.status(403).json({ error: '无权查看此问卷的回答数据' })
    }

    // 获取问卷的所有回答
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('responses')
      .select(`
        id, respondent_email, respondent_name, submitted_at,
        answers(
          id, question_id, answer_text, answer_options,
          question:questions(id, question_text, question_type)
        )
      `)
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false })

    if (responsesError) {
      console.error('获取回答数据失败:', responsesError)
      return res.status(500).json({ error: '获取回答数据失败' })
    }

    res.json({ 
      survey: { id: survey.id, title: survey.title },
      responses,
      total_responses: responses.length
    })
  } catch (error) {
    console.error('获取问卷回答错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 获取问卷统计数据接口（仅问卷创建者可访问）
 * @route GET /api/responses/survey/:surveyId/stats
 * @param req - 包含问卷ID的请求
 * @param res - 返回问卷的统计分析数据
 */
router.get('/survey/:surveyId/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params
    const user = (req as any).user

    // 检查问卷是否存在且用户有权限查看
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('surveys')
      .select('id, title, creator_id')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (survey.creator_id !== user.id) {
      return res.status(403).json({ error: '无权查看此问卷的统计数据' })
    }

    // 获取总回答数
    const { count: totalResponses, error: countError } = await supabaseAdmin
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId)

    if (countError) {
      console.error('获取回答总数失败:', countError)
      return res.status(500).json({ error: '获取统计数据失败' })
    }

    // 获取问题和答案统计
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select(`
        id, question_text, question_type, options,
        answers(
          answer_text, answer_options
        )
      `)
      .eq('survey_id', surveyId)
      .order('order_index')

    if (questionsError) {
      console.error('获取问题统计失败:', questionsError)
      return res.status(500).json({ error: '获取统计数据失败' })
    }

    // 处理统计数据
    const questionStats = questions.map(question => {
      const stats: any = {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        total_answers: question.answers.length
      }

      if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
        // 选择题统计
        const optionCounts: { [key: string]: number } = {}
        
        question.answers.forEach(answer => {
          if (answer.answer_options) {
            answer.answer_options.forEach((option: string) => {
              optionCounts[option] = (optionCounts[option] || 0) + 1
            })
          }
        })
        
        stats.option_stats = optionCounts
      } else if (question.question_type === 'rating') {
        // 评分题统计
        const ratings = question.answers
          .map(answer => parseFloat(answer.answer_text || '0'))
          .filter(rating => !isNaN(rating))
        
        if (ratings.length > 0) {
          stats.average_rating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          stats.rating_distribution = ratings.reduce((dist: { [key: string]: number }, rating) => {
            const key = rating.toString()
            dist[key] = (dist[key] || 0) + 1
            return dist
          }, {})
        }
      }

      return stats
    })

    res.json({
      survey: { id: survey.id, title: survey.title },
      total_responses: totalResponses || 0,
      question_stats: questionStats
    })
  } catch (error) {
    console.error('获取问卷统计错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

export default router