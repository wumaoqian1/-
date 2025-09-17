import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SurveyList from './pages/SurveyList'
import SurveyEditor from './pages/SurveyEditor'
import SurveyFill from './pages/SurveyFill'
import SurveyStats from './pages/SurveyStats'
import './App.css'

/**
 * 受保护的路由组件
 * 需要用户登录才能访问
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

/**
 * 主应用组件
 * 配置路由和全局组件
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/survey/:id/fill" element={<SurveyFill />} />
          
          {/* 受保护的路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <SurveyList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys" element={
            <ProtectedRoute>
              <Layout>
                <SurveyList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys/new" element={
            <ProtectedRoute>
              <Layout>
                <SurveyEditor />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys/:id/edit" element={
            <ProtectedRoute>
              <Layout>
                <SurveyEditor />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys/:id/analytics" element={
            <ProtectedRoute>
              <Layout>
                <SurveyStats />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* 404重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* 全局通知组件 */}
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  )
}

export default App
