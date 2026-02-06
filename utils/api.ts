/**
 * API 客户端模块
 * 封装所有后端 API 请求
 */

// 后端 API 地址
const API_BASE_URL = '/api'; // 使用代理，避免跨域和端口问题

// 存储访问令牌
let accessToken: string | null = null;

/**
 * 设置访问令牌
 */
export function setAccessToken(token: string | null): void {
    accessToken = token;
    if (token) {
        localStorage.setItem('access_token', token);
    } else {
        localStorage.removeItem('access_token');
    }
}

/**
 * 获取访问令牌
 */
export function getAccessToken(): string | null {
    if (!accessToken) {
        accessToken = localStorage.getItem('access_token');
    }
    return accessToken;
}

/**
 * 通用请求函数
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `请求失败 (${response.status} ${response.statusText})` }));
        throw new Error(error.detail || `请求失败 (${response.status} ${response.statusText})`);
    }

    return response.json();
}

// ==================== 认证 API ====================

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: UserResponse;
}

export interface UserResponse {
    id: string;
    uid?: number;  // 纯数字 UID 用于显示
    phone?: string;
    email?: string;
    username: string;
    avatar_url: string | null;
    balance: number;
    has_agreed_privacy: boolean;
    theme: string;
    created_at: string;
}

/**
 * 发送手机验证码
 */
export async function sendCode(phone: string): Promise<{ message: string; code?: string }> {
    return request('/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

/**
 * 发送邮箱验证码
 */
export async function sendEmailCode(email: string): Promise<{ message: string; code?: string }> {
    return request('/auth/send-email-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

/**
 * 手机登录/注册
 */
export async function login(
    phone: string,
    code: string,
    inviteCode?: string
): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, code, invite_code: inviteCode }),
    });

    // 保存令牌
    setAccessToken(response.access_token);

    return response;
}

/**
 * 邮箱登录/注册
 */
export async function emailLogin(
    email: string,
    code: string,
    inviteCode?: string
): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/email-login', {
        method: 'POST',
        body: JSON.stringify({ email, code, invite_code: inviteCode }),
    });

    // 保存令牌
    setAccessToken(response.access_token);

    return response;
}

/**
 * 手机+邮箱组合登录/注册（使用邮箱验证码）
 */
export async function combinedLogin(
    phone: string,
    email: string,
    code: string,
    inviteCode?: string
): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/combined-login', {
        method: 'POST',
        body: JSON.stringify({ phone, email, code, invite_code: inviteCode }),
    });

    // 保存令牌
    setAccessToken(response.access_token);

    return response;
}

/**
 * 上传头像 (本地后端)
 */
export async function uploadAvatar(file: File): Promise<UserResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Authorization header handled by getAccessToken() logic inside request?
    // Wait, the request wrapper handles JSON. For FormData, we need to handle headers differently or let browser set Content-Type

    // We can't use the 'request' wrapper easily if it forces Content-Type: application/json
    // Let's check 'request' implementation
    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: headers, // Do NOT set Content-Type for FormData, browser sets it with boundary
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `上传失败 (${response.status})` }));
        throw new Error(error.detail || `上传失败 (${response.status})`);
    }

    return response.json();
}


/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UserResponse> {
    return request('/auth/me');
}

/**
 * 获取完整详情 (Avatar, etc.)
 */
export async function getUserDetails(): Promise<UserResponse> {
    return request('/users/details');
}


/**
 * 注销
 */
export function logout(): void {
    setAccessToken(null);
}

// ==================== 用户 API ====================

/**
 * 更新用户资料
 */
export async function updateProfile(
    username?: string,
    avatarUrl?: string
): Promise<UserResponse> {
    return request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username, avatar_url: avatarUrl }),
    });
}

/**
 * 充值算力
 */
export async function recharge(amount: number): Promise<UserResponse> {
    return request('/users/recharge', {
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
}

/**
 * 切换主题
 */
export async function updateTheme(theme: 'dark' | 'light'): Promise<UserResponse> {
    return request('/users/theme', {
        method: 'PUT',
        body: JSON.stringify({ theme }),
    });
}

/**
 * 更新隐私设置
 */
export async function updatePrivacy(hasAgreed: boolean): Promise<UserResponse> {
    return request('/users/privacy', {
        method: 'PUT',
        body: JSON.stringify({ has_agreed_privacy: hasAgreed }),
    });
}

// ==================== 历史记录 API ====================

export interface HistoryItem {
    id: string;
    title: string;
    t_level: string;
    birth_year: number;
    birth_month: number;
    birth_day: number;
    birth_hour: number;
    gender: string;
    name: string | null;
    chart_data: Record<string, unknown> | null;
    created_at: string;
}

export interface CreateHistoryRequest {
    title: string;
    t_level: string;
    birth_year: number;
    birth_month: number;
    birth_day: number;
    birth_hour: number;
    gender: 'male' | 'female';
    name?: string;
    chart_data?: Record<string, unknown>;
}

/**
 * 获取历史记录列表
 */
export async function getHistoryList(): Promise<{ items: HistoryItem[]; total: number }> {
    return request('/history');
}

/**
 * 创建历史记录
 */
export async function createHistory(data: CreateHistoryRequest): Promise<HistoryItem> {
    return request('/history', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * 获取历史详情
 */
export async function getHistoryDetail(historyId: string): Promise<HistoryItem> {
    return request(`/history/${historyId}`);
}

/**
 * 删除历史记录
 */
export async function deleteHistory(historyId: string): Promise<{ message: string }> {
    return request(`/history/${historyId}`, {
        method: 'DELETE',
    });
}

// ==================== AI 对话 API ====================

export interface ChatMessage {
    id: string;
    text: string;
    is_user: boolean;
    created_at: string;
}

export interface AIResponse {
    message: ChatMessage;
    balance: number;
}

/**
 * 发送消息给 AI
 */
export async function sendChatMessage(
    historyId: string,
    text: string
): Promise<AIResponse> {
    return request('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ history_id: historyId, text }),
    });
}

/**
 * 获取对话历史
 */
export async function getChatMessages(historyId: string): Promise<{ messages: ChatMessage[] }> {
    return request(`/chat/${historyId}/messages`);
}
/**
 * 获取我的邀请码
 */
export async function getInviteCode(): Promise<{ invite_code: string }> {
    return request('/users/invite/code');
}

/**
 * 填写邀请码
 */
export async function applyInviteCode(inviteCode: string): Promise<{
    success: boolean;
    message: string;
    balance: number;
}> {
    return request('/users/invite/apply', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode }),
    });
}

// ==================== 支付 API ====================

export interface CreatePaymentResponse {
    order_id: string;
    final_amount: number;
    points: number;
    expires_at: string;
}

export interface PaymentStatus {
    order_id: string;
    status: number;
    balance?: number;
}

/**
 * 创建支付订单
 */
export async function createPaymentOrder(amount: number, points: number): Promise<CreatePaymentResponse> {
    return request('/pay/create_order', {
        method: 'POST',
        body: JSON.stringify({ amount, points }),
    });
}

/**
 * 检查订单状态
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
    return request(`/pay/check_status/${orderId}`);
}
