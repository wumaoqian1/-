import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, optionalAuth } from '../utils/auth.js'
import { z } from 'zod'

const router = Router()

// 问卷创建/更新验证模式
const surveySchema = z.object({
  title: z.string().min(1, '问卷标题不能为空').max(255, '标题最多255字符'),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional()
})

// 问题验证模式
const questionSchema = z.object({
  question_text: z.string().min(1, '问题内容不能为空'),
  question_type: z.enum(['single_choice', 'multiple_choice', 'text', 'rating']),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().default(false),
  order_index: z.number().int().min(0)
})

/**
 * 获取问卷列表接口
 * @route GET /api/surveys
 * @param req - 请求对象，可选认证
 * @param res - 返回问卷列表
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    let query = supabaseAdmin.from('surveys').select(`
      id, title, description, status, created_at, updated_at,
      creator:users!creator_id(id, username)
    `)

    // 如果用户已登录，显示自己的所有问卷；否则只显示已发布的问卷
    if (user) {
      query = query.or(`creator_id.eq.${user.id},status.eq.published`)
    } else {
      query = query.eq('status', 'published')
    }

    const { data: surveys, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('获取问卷列表失败:', error)
      return res.status(500).json({ error: '获取问卷列表失败' })
    }

    res.json({ surveys })
  } catch (error) {
    console.error('获取问卷列表错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 获取单个问卷详情接口
 * @route GET /api/surveys/:id
 * @param req - 包含问卷ID的请求
 * @param res - 返回问卷详情和问题列表
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    // 获取问卷基本信息
    const { data: survey, error: surveyError } = await supabaseAdmin
      .from('surveys')
      .select(`
        id, title, description, status, created_at, updated_at,
        creator:users!creator_id(id, username)
      `)
      .eq('id', id)
      .single()

    if (surveyError || !survey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    // 检查访问权限：已发布的问卷所有人可见，草稿只有创建者可见
    if (survey.status !== 'published' && (!user || user.id !== (survey.creator as any)?.id)) {
      return res.status(403).json({ error: '无权访问此问卷' })
    }

    // 获取问卷问题
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index')

    if (questionsError) {
      console.error('获取问题列表失败:', questionsError)
      return res.status(500).json({ error: '获取问题列表失败' })
    }

    res.json({ survey, questions })
  } catch (error) {
    console.error('获取问卷详情错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 创建问卷接口
 * @route POST /api/surveys
 * @param req - 包含问卷信息的请求
 * @param res - 返回创建的问卷信息
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const validatedData = surveySchema.parse(req.body)

    const { data: survey, error } = await supabaseAdmin
      .from('surveys')
      .insert({
        ...validatedData,
        creator_id: user.id,
        status: validatedData.status || 'draft'
      })
      .select(`
        id, title, description, status, created_at, updated_at,
        creator:users!creator_id(id, username)
      `)
      .single()

    if (error) {
      console.error('创建问卷失败:', error)
      return res.status(500).json({ error: '创建问卷失败' })
    }

    res.status(201).json({ message: '问卷创建成功', survey })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('创建问卷错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 更新问卷接口
 * @route PUT /api/surveys/:id
 * @param req - 包含问卷ID和更新信息的请求
 * @param res - 返回更新后的问卷信息
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user
    const validatedData = surveySchema.parse(req.body)

    // 检查问卷是否存在且用户有权限修改
    const { data: existingSurvey } = await supabaseAdmin
      .from('surveys')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!existingSurvey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (existingSurvey.creator_id !== user.id) {
      return res.status(403).json({ error: '无权修改此问卷' })
    }

    const { data: survey, error } = await supabaseAdmin
      .from('surveys')
      .update(validatedData)
      .eq('id', id)
      .select(`
        id, title, description, status, created_at, updated_at,
        creator:users!creator_id(id, username)
      `)
      .single()

    if (error) {
      console.error('更新问卷失败:', error)
      return res.status(500).json({ error: '更新问卷失败' })
    }

    res.json({ message: '问卷更新成功', survey })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('更新问卷错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 删除问卷接口
 * @route DELETE /api/surveys/:id
 * @param req - 包含问卷ID的请求
 * @param res - 返回删除结果
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    // 检查问卷是否存在且用户有权限删除
    const { data: existingSurvey } = await supabaseAdmin
      .from('surveys')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!existingSurvey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (existingSurvey.creator_id !== user.id) {
      return res.status(403).json({ error: '无权删除此问卷' })
    }

    const { error } = await supabaseAdmin
      .from('surveys')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除问卷失败:', error)
      return res.status(500).json({ error: '删除问卷失败' })
    }

    res.json({ message: '问卷删除成功' })
  } catch (error) {
    console.error('删除问卷错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

/**
 * 添加问题到问卷接口
 * @route POST /api/surveys/:id/questions
 * @param req - 包含问卷ID和问题信息的请求
 * @param res - 返回创建的问题信息
 */
router.post('/:id/questions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user
    const validatedData = questionSchema.parse(req.body)

    // 检查问卷是否存在且用户有权限修改
    const { data: survey } = await supabaseAdmin
      .from('surveys')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' })
    }

    if (survey.creator_id !== user.id) {
      return res.status(403).json({ error: '无权修改此问卷' })
    }

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({
        ...validatedData,
        survey_id: id
      })
      .select('*')
      .single()

    if (error) {
      console.error('添加问题失败:', error)
      return res.status(500).json({ error: '添加问题失败' })
    }

    res.status(201).json({ message: '问题添加成功', question })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('添加问题错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

export default router