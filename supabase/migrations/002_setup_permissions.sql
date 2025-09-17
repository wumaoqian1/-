-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 为匿名用户授予基本权限
GRANT SELECT ON users TO anon;
GRANT SELECT ON surveys TO anon;
GRANT SELECT ON questions TO anon;
GRANT INSERT, SELECT ON responses TO anon;
GRANT INSERT, SELECT ON answers TO anon;

-- 为认证用户授予完整权限
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON surveys TO authenticated;
GRANT ALL PRIVILEGES ON questions TO authenticated;
GRANT ALL PRIVILEGES ON responses TO authenticated;
GRANT ALL PRIVILEGES ON answers TO authenticated;

-- 用户表的RLS策略
-- 用户只能查看和更新自己的信息
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 问卷表的RLS策略
-- 所有人都可以查看已发布的问卷
CREATE POLICY "Anyone can view published surveys" ON surveys
    FOR SELECT USING (status = 'published');

-- 创建者可以管理自己的问卷
CREATE POLICY "Users can manage own surveys" ON surveys
    FOR ALL USING (auth.uid() = creator_id);

-- 问题表的RLS策略
-- 所有人都可以查看已发布问卷的问题
CREATE POLICY "Anyone can view questions of published surveys" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = questions.survey_id 
            AND surveys.status = 'published'
        )
    );

-- 问卷创建者可以管理问题
CREATE POLICY "Survey creators can manage questions" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = questions.survey_id 
            AND surveys.creator_id = auth.uid()
        )
    );

-- 回答表的RLS策略
-- 所有人都可以提交回答
CREATE POLICY "Anyone can submit responses" ON responses
    FOR INSERT WITH CHECK (true);

-- 问卷创建者可以查看回答
CREATE POLICY "Survey creators can view responses" ON responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = responses.survey_id 
            AND surveys.creator_id = auth.uid()
        )
    );

-- 答案表的RLS策略
-- 所有人都可以提交答案
CREATE POLICY "Anyone can submit answers" ON answers
    FOR INSERT WITH CHECK (true);

-- 问卷创建者可以查看答案
CREATE POLICY "Survey creators can view answers" ON answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM responses r
            JOIN surveys s ON s.id = r.survey_id
            WHERE r.id = answers.response_id 
            AND s.creator_id = auth.uid()
        )
    );