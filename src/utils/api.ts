import { getAuthHeader } from '../store/authStore'

// API基础URL
const API_BASE_URL = '/api'

// API响应接口
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// HTTP方法类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// 请求配置接口
interface RequestConfig {
  method: HttpMethod
  headers?: Record<string, string>
  body?: any
}

/**
 * API请求客户端类
 * 封装HTTP请求，自动处理认证和错误
 */
class ApiClient {
  /**
   * 发送HTTP请求
   * @param endpoint - API端点
   * @param config - 请求配置
   * @returns Promise<ApiResponse>
   */
  private async request<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    }

    // 添加认证头部
    const authHeader = getAuthHeader()
    if (authHeader) {
      headers.Authorization = authHeader
    }

    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败'
      }
    }
  }

  /**
   * GET请求
   * @param endpoint - API端点
   * @param headers - 额外的请求头
   * @returns Promise<ApiResponse>
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers })
  }

  /**
   * POST请求
   * @param endpoint - API端点
   * @param body - 请求体数据
   * @param headers - 额外的请求头
   * @returns Promise<ApiResponse>
   */
  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers })
  }

  /**
   * PUT请求
   * @param endpoint - API端点
   * @param body - 请求体数据
   * @param headers - 额外的请求头
   * @returns Promise<ApiResponse>
   */
  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers })
  }

  /**
   * DELETE请求
   * @param endpoint - API端点
   * @param headers - 额外的请求头
   * @returns Promise<ApiResponse>
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers })
  }
}

// 导出API客户端实例
export const apiClient = new ApiClient()

// 认证相关API
export const authApi = {
  /**
   * 用户注册
   * @param userData - 注册数据
   */
  register: (userData: { email: string; password: string; username: string }) =>
    apiClient.post('/auth/register', userData),

  /**
   * 用户登录
   * @param credentials - 登录凭据
   */
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  /**
   * 获取用户信息
   */
  getProfile: () => apiClient.get('/auth/profile'),

  /**
   * 用户登出
   */
  logout: () => apiClient.post('/auth/logout')
}

// 问卷相关API
export const surveyApi = {
  /**
   * 获取问卷列表
   * @param params - 查询参数
   */
  getList: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status) query.append('status', params.status)
    const queryString = query.toString()
    return apiClient.get(`/surveys${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 获取问卷详情
   * @param id - 问卷ID
   */
  getById: (id: string) => apiClient.get(`/surveys/${id}`),

  /**
   * 创建问卷
   * @param surveyData - 问卷数据
   */
  create: (surveyData: any) => apiClient.post('/surveys', surveyData),

  /**
   * 更新问卷
   * @param id - 问卷ID
   * @param surveyData - 更新数据
   */
  update: (id: string, surveyData: any) => apiClient.put(`/surveys/${id}`, surveyData),

  /**
   * 删除问卷
   * @param id - 问卷ID
   */
  delete: (id: string) => apiClient.delete(`/surveys/${id}`),

  /**
   * 添加问题到问卷
   * @param surveyId - 问卷ID
   * @param questionData - 问题数据
   */
  addQuestion: (surveyId: string, questionData: any) =>
    apiClient.post(`/surveys/${surveyId}/questions`, questionData)
}

// 问卷回答相关API
export const responseApi = {
  /**
   * 提交问卷回答
   * @param responseData - 回答数据
   */
  submit: (responseData: any) => apiClient.post('/responses', responseData),

  /**
   * 获取问卷的所有回答
   * @param surveyId - 问卷ID
   */
  getBySurvey: (surveyId: string) => apiClient.get(`/responses/survey/${surveyId}`),

  /**
   * 获取问卷统计数据
   * @param surveyId - 问卷ID
   */
  getStats: (surveyId: string) => apiClient.get(`/responses/survey/${surveyId}/stats`)
}