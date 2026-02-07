
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ChevronLeft, ChevronDown, Trophy, History, Settings, Share2, MoreHorizontal, User, Sparkles, Zap, PlusCircle, Crown, Camera, Edit2, Trash2, X, Search, Check, Copy, Loader2, Type, AlertTriangle } from 'lucide-react';
import { CHINA_REGIONS, getCitiesOfProvince, getDistrictsOfCity, Region } from '../utils/china_regions';
import { calculateBaZi, BaZiChart, getDaYun, getElement } from '../utils/bazi';
import { BaZiData, ChatMessage, HistoryItem } from '../types';
import { DetailedChartScreen } from './DetailedChartScreen';
import { ProfileScreen } from './ProfileScreen';
import { createHistory, sendChatMessage, CreateHistoryRequest, getCurrentUser } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import remarkGfm from 'remark-gfm';

interface ConsoleScreenProps {
  setFullScreen?: (isFull: boolean) => void;
  balance: number;
  deductBalance: (amount: number) => void;
  setBalanceDirectly?: (newBalance: number) => void;
  onAnalysisComplete: (title: string, chart: BaZiData, msgs: ChatMessage[], birthDetails: any) => void;
  userGender?: 'male' | 'female';
  onRecharge: (amount: number) => void;
  initialHistoryContext?: HistoryItem | null; // Data passed when opening from history
  onUpdateHistoryChat?: (historyId: string, msgs: ChatMessage[]) => void;
  onBackToProfile?: () => void; // 从历史记录打开时，返回个人中心
  username?: string;
  avatar?: string;
  onLogout?: () => void;
}

const QuantumIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.8" />
    <ellipse cx="12" cy="12" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 12 12)" />
    <ellipse cx="12" cy="12" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" transform="rotate(-45 12 12)" />
  </svg>
);

const ElementText = ({ char }: { char: string }) => {
  const el = getElement(char);
  let colorClass = "";
  switch (el) {
    case 'metal': colorClass = "text-amber-500 dark:text-amber-400"; break;
    case 'wood': colorClass = "text-green-600 dark:text-green-500"; break;
    case 'water': colorClass = "text-blue-600 dark:text-blue-400"; break;
    case 'fire': colorClass = "text-red-600 dark:text-red-500"; break;
    case 'earth': colorClass = "text-[#8B4513] dark:text-[#A0522D]"; break;
    default: colorClass = "text-gray-900 dark:text-gray-200";
  }
  return <span className={colorClass}>{char}</span>;
}

export const ConsoleScreen = React.memo<ConsoleScreenProps>(({ setFullScreen, balance, deductBalance, setBalanceDirectly, onAnalysisComplete, userGender, onRecharge, initialHistoryContext, onUpdateHistoryChat, onBackToProfile, username, avatar, onLogout }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<{ year: number; month: number; day: number; hour: number | null; minute: number | null }>({
    year: 1998, month: 5, day: 21, hour: 9, minute: 30
  });
  const [location, setLocation] = useState<{ province: string, city: string, district: string, lat?: number, lng?: number }>({
    province: '北京市', city: '市辖区', district: '东城区',
    lat: 39.9285, lng: 116.4163
  });
  const [chart, setChart] = useState<BaZiChart | null>(null);
  const [daYun, setDaYun] = useState<any[]>([]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isLocationPickerOpen, setLocationPickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(birthDate);
  const [tempLocation, setTempLocation] = useState(location);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null); // { id, finalAmount, expiresAt }
  const [isPaying, setIsPaying] = useState(false);
  const [isRechargeClosing, setIsRechargeClosing] = useState(false); // 正在关闭弹窗
  const [paymentCountdown, setPaymentCountdown] = useState(0); // 支付倒计时（秒）
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // 是否已初始化出厂参数
  const [hasBenchmarkStarted, setHasBenchmarkStarted] = useState(false); // 是否已开始基准测试
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState<{ id: string; idx: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Message Interaction State
  // Message Interaction State removed as per request (native copy)

  // Copy State
  const [copyTooltip, setCopyTooltip] = useState<{ id: number, x: number, y: number, text: string } | null>(null);


  const chatEndRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);
  const dayListRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isScrollingRef = useRef(false);

  const RECHARGE_TIERS = [
    { price: 12.8, points: 158, label: '首充' },
    { price: 28.8, points: 368, label: '' },
    { price: 58.8, points: 748, label: '热销' },
    { price: 118.8, points: 1588, label: '' },
    { price: 328, points: 4888, label: '' },
    { price: 648, points: 13148, label: '流光金', isVip: true },
  ];



  // 日期选择器打开时，滚动到当前选中的值
  // 日期选择器打开时，滚动到当前选中的值
  useEffect(() => {
    if (isDatePickerOpen) {
      isScrollingRef.current = true;
      const scrollToValue = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
        if (ref.current) {
          // 每个项高度32px，内边距64px (py-16 = 4rem = 64px)
          ref.current.scrollTop = index * 32;
        }
      };

      setTimeout(() => {
        // 年份滚动到基准年
        const yearIndex = tempDate.year - 1930;
        scrollToValue(yearListRef, yearIndex);

        // 其他列也滚动到当前值
        scrollToValue(monthListRef, tempDate.month - 1);
        scrollToValue(dayListRef, tempDate.day - 1);
        scrollToValue(hourListRef, tempDate.hour === null ? 0 : tempDate.hour + 1);
        scrollToValue(minuteListRef, tempDate.minute === null ? 0 : tempDate.minute + 1);

        // 滚动完成后允许 handlePickerScroll 执行
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);
      }, 100);
    }
  }, [isDatePickerOpen]); // 仅在打开时执行一次

  // ---------------- 支付逻辑集成 ----------------
  // 充值逻辑：创建订单
  const handleCreateOrder = async (price: number, points: number) => {
    try {
      setIsPaying(true);
      const { createPaymentOrder } = await import('../utils/api');
      const res = await createPaymentOrder(price, points);
      setPaymentOrder({
        id: res.order_id,
        finalAmount: res.final_amount,
        points: res.points,
        expiresAt: res.expires_at
      });
      setPaymentCountdown(300); // 5分钟 = 300秒
    } catch (error: any) {
      showToast(error.message || '创建支付订单失败，请重试');
    } finally {
      setIsPaying(false);
    }
  };

  // 关闭弹窗逻辑（带动画周期）
  const handleCloseRechargeModal = () => {
    setIsRechargeClosing(true);
    setTimeout(() => {
      setShowRechargeModal(false);
      setIsRechargeClosing(false);
      setPaymentOrder(null);
      setPaymentCountdown(0);
    }, 500); // 对齐 slide-out 动画时间
  };

  // 轮询订单状态
  useEffect(() => {
    let timer: any;
    if (showRechargeModal && paymentOrder?.id) {
      const pollStatus = async () => {
        try {
          const { checkPaymentStatus } = await import('../utils/api');
          const res = await checkPaymentStatus(paymentOrder.id);
          if (res.status === 1) {
            // 支付成功
            clearInterval(timer);
            handleCloseRechargeModal();
            // 提示用户
            showToast(`充值成功！已为您增加 ${paymentOrder.points} 算力。`);
          }
        } catch (e) {
          console.warn('轮询支付状态异常:', e);
        }
      };

      timer = setInterval(pollStatus, 3000); // 3秒轮询一次
    }
    return () => timer && clearInterval(timer);
  }, [showRechargeModal, paymentOrder]);

  // 支付倒计时处理
  useEffect(() => {
    let interval: any;
    if (showRechargeModal && paymentOrder && paymentCountdown > 0) {
      interval = setInterval(() => {
        setPaymentCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPaymentOrder(null);
            setShowRechargeModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showRechargeModal, paymentOrder, paymentCountdown]);

  // 主动检查支付状态
  const handleCheckPaymentStatus = async () => {
    if (!paymentOrder?.id) return;
    try {
      const { checkPaymentStatus } = await import('../utils/api');
      const res = await checkPaymentStatus(paymentOrder.id);
      if (res.status === 1) {
        handleCloseRechargeModal();
        showToast(`支付成功！已为您增加 ${paymentOrder.points} 算力。`);
      } else {
        showToast('暂未查询到支付记录，请确认是否已完成转账。如有疑问请联系客服。');
      }
    } catch (e: any) {
      showToast('查询状态失败，请重试');
    }
  };
  // 自动清除 Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  const showToast = (msg: string) => setToastMessage(msg);

  // ---------------- Search Logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const matches: { id: string; idx: number }[] = [];
    messages.forEach(msg => {
      // Find all occurrences in the message - Using improved regex for global search
      if (!searchTerm.trim()) return;
      try {
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        let i = 0;
        // Reset lastIndex because execute is stateful with global tag
        while ((match = regex.exec(msg.text)) !== null) {
          matches.push({ id: msg.id.toString(), idx: i });
          i++;
        }
      } catch (e) {
        // Fallback or ignore invalid regex
      }
    });

    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      // Auto jump to first match immediately
      setTimeout(() => {
        scrollToMatch(0, matches);
      }, 50); // Slightly faster response
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchTerm, messages]);

  // Enhanced Scroll to Match
  const scrollToMatch = (index: number, matches: { id: string; idx: number }[] = searchMatches) => {
    if (index >= 0 && index < matches.length) {
      const match = matches[index];
      const msgEl = document.getElementById(`msg-${match.id}`);

      if (msgEl) {
        // Find the specific match element by index within the message
        const matchEls = msgEl.getElementsByClassName('highlight-match');
        const el = matchEls[match.idx] as HTMLElement;

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Flash effect
          el.classList.add('ring-4', 'ring-amber-500/50');
          setTimeout(() => el.classList.remove('ring-4', 'ring-amber-500/50'), 1000);
        } else {
          // Fallback to message container
          msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          msgEl.classList.add('ring-4', 'ring-amber-500/50');
          setTimeout(() => msgEl.classList.remove('ring-4', 'ring-amber-500/50'), 1000);
        }
      }
      setCurrentMatchIndex(index);
    }
  };

  const traverseSearch = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    let newIndex = direction === 'next' ? currentMatchIndex + 1 : currentMatchIndex - 1;
    if (newIndex >= searchMatches.length) newIndex = 0;
    if (newIndex < 0) newIndex = searchMatches.length - 1;
    scrollToMatch(newIndex);
  };

  const confirmLogout = () => {
    if (onLogout) {
      setShowLogoutConfirm(false);
      onLogout();
    }
  };


  // Restore state from history context if present
  useEffect(() => {
    if (initialHistoryContext) {
      const item = initialHistoryContext;

      // 设置当前历史记录ID（用于后续对话）
      setCurrentHistoryId(item.id);

      // 先清空消息，等待从数据库加载
      setMessages([]);

      if (item.birthYear && item.birthMonth) {
        setBirthDate({
          year: item.birthYear,
          month: item.birthMonth,
          day: item.birthDay || 1,
          hour: item.birthHour || 12,
          minute: 0
        });
      }
      if (item.gender) setGender(item.gender);
      if (item.name) setName(item.name);

      // 从后端加载对话消息
      const loadChatMessages = async () => {
        try {
          const { getChatMessages } = await import('../utils/api');
          const response = await getChatMessages(item.id);
          if (response.messages && response.messages.length > 0) {
            // 转换后端格式为前端格式
            const msgs = response.messages
              .map((msg: any) => ({
                id: msg.id,
                text: msg.text,
                isUser: msg.is_user,
                timestamp: new Date(msg.created_at).getTime()
              }))
              .filter((msg: any) => {
                // Hide any user message that looks like the system prompt
                // Check for key phrases "请分析我的命盘" AND "出生地" AND "经度" to be specific
                if (msg.isUser && msg.text.includes('请分析我的命盘') && (msg.text.includes('出生地') || msg.text.includes('性别')) && msg.text.includes('经度')) {
                  return false;
                }
                // Keep legacy filter just in case
                if (msg.isUser && msg.text.includes('分析命盘') && msg.text.length > 20) {
                  return false;
                }
                return true;
              });
            setMessages(msgs);
            console.log('加载了', msgs.length, '条对话记录');
          } else if (item.chatLog && item.chatLog.length > 0) {
            // 回退到本地缓存的对话记录
            setMessages(item.chatLog);
            console.log('使用本地缓存的', item.chatLog.length, '条对话记录');
          } else {
            console.log('没有找到对话记录');
          }
        } catch (error) {
          console.error('加载对话记录失败:', error);
          // 回退到本地缓存
          if (item.chatLog && item.chatLog.length > 0) {
            setMessages(item.chatLog);
          }
        }
      };
      loadChatMessages();

      // Re-calculate chart for display using saved date or current date if missing (fallback)
      const y = item.birthYear || 1998;
      const m = item.birthMonth || 1;
      const d = item.birthDay || 1;
      const h = item.birthHour || 9;

      const dateObj = new Date(y, m - 1, d, h);
      const result = calculateBaZi(dateObj, h, 0); // Pass hour explicitly
      const dy = getDaYun(
        result.year.gan,
        result.month.gan,
        result.month.zhi,
        item.gender || 'male',
        dateObj
      );

      setChart(result);
      setDaYun(dy);
      setShowResult(true);
      setHasInitialized(true);
      setHasBenchmarkStarted(true); // 从历史恢复视为已开始
      if (setFullScreen) setFullScreen(true);
    } else {
      // Reset if no history context (fresh console)
      // 重置所有状态，准备新建基准测试
      setShowResult(false);
      setHasInitialized(false);
      setHasBenchmarkStarted(false);
      setMessages([]);
      setCurrentHistoryId(null);
      if (setFullScreen) setFullScreen(false);
    }
  }, [initialHistoryContext]);

  // Recalculate chart whenever Date or Location changes (Silent update)
  useEffect(() => {
    if (hasInitialized && birthDate.year && birthDate.month && birthDate.day) {
      const h = birthDate.hour;
      const m = birthDate.minute;
      const dateObj = new Date(birthDate.year, birthDate.month - 1, birthDate.day, h || 0);
      // Pass longitude for True Solar Time
      const result = calculateBaZi(dateObj, h, m, location.lng);
      const dy = getDaYun(
        result.year.gan,
        result.month.gan,
        result.month.zhi,
        gender,
        dateObj
      );
      setChart(result);
      setDaYun(dy);
    }
  }, [birthDate, location, gender, hasInitialized]);

  useEffect(() => {
    if (showResult && chatEndRef.current) {
      // Only scroll on new message arrival (length change), not every token update
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showResult, messages.length, isSending]); // Added isSending to ensure scroll on start of generation

  // 1. 初始化出厂参数 (原 startBenchmark)
  const initializeParameters = () => {
    // 新建时清空状态
    setMessages([]);
    setCurrentHistoryId(null);
    setHasBenchmarkStarted(false);

    if (!birthDate.year || !birthDate.month || !birthDate.day) {
      alert('请选择完整的出生日期 (年、月、日)');
      return;
    }

    // Initial calculation with animation
    const dateObj = new Date(birthDate.year, birthDate.month - 1, birthDate.day, birthDate.hour || 0);
    const result = calculateBaZi(dateObj, birthDate.hour, birthDate.minute, location.lng);
    const dy = getDaYun(
      result.year.gan,
      result.month.gan,
      result.month.zhi,
      gender,
      dateObj
    );

    setChart(result);
    setDaYun(dy);

    // 模拟计算加载
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowResult(true);
      setHasInitialized(true);
      if (setFullScreen) setFullScreen(true);
    }, 800);
  };

  // 2. 开始基准测试 (真正扣费和AI对话)
  const runBenchmark = async () => {
    if (balance < 50) {
      setShowRechargeModal(true);
      return;
    }

    setAnalyzing(true); // show breathing effect

    // 准备数据
    const baziData: BaZiData = {
      year: chart!.year.gan + chart!.year.zhi,
      month: chart!.month.gan + chart!.month.zhi,
      day: chart!.day.gan + chart!.day.zhi,
      // Ensure handling of '?' for hour gan/zhi
      hour: (chart!.hour.gan === '?' || chart!.hour.zhi === '?') ? "未知" : (chart!.hour.gan + chart!.hour.zhi),
      yearShen: chart!.year.ganShen,
      monthShen: chart!.month.ganShen,
      dayShen: '日主',
      hourShen: chart!.hour.ganShen
    };

    const birthDetails = {
      birthYear: birthDate.year,
      birthMonth: birthDate.month,
      birthDay: birthDate.day,
      birthHour: birthDate.hour,
      gender: gender,
      name: name,
      // Pass location info if API supported it, but mainly needed for Prompt below
    };

    // 保存历史记录到后端 (创建 Session)
    try {
      const historyRequest: CreateHistoryRequest = {
        title: `${birthDate.year}年${birthDate.month}月 命盘解析`,
        t_level: 'T' + Math.floor(Math.random() * 5 + 1),
        birth_year: birthDate.year,
        birth_month: birthDate.month,
        birth_day: birthDate.day,
        birth_hour: birthDate.hour,
        gender: gender,
        name: name || undefined,
        chart_data: baziData as unknown as Record<string, unknown>
      };
      const savedHistory = await createHistory(historyRequest);
      setCurrentHistoryId(savedHistory.id);

      // 显示思考中状态
      setAnalyzing(true);

      // 开始 AI 对话 (模拟流式输出)
      // 构造 Prompt (后续会替换为真 Prompt) - 优化：移除 JSON，使用自然语言，避免 Token 浪费和隐私泄露
      const locationStr = `${location.province}${location.city}${location.district}`;
      const coordStr = location.lng ? ` (经度: ${location.lng.toFixed(2)}°, 真太阳时修正)` : '';
      const prompt = `请分析我的命盘，性别：${gender === 'male' ? '男' : '女'}，出生地：${locationStr}${coordStr}。`;

      // 调用后端 sendChatMessage
      const response = await sendChatMessage(savedHistory.id, prompt);

      // 收到回复，停止思考动画
      setAnalyzing(false);

      // 更新余额 (后端返回)
      if (setBalanceDirectly) {
        setBalanceDirectly(response.balance);
      }

      setHasBenchmarkStarted(true);

      // 模拟打字机效果
      const fullText = response.message.text;
      let currentText = "";
      const msgId = Date.now();

      // 添加一条空的 AI 消息与 "AI" 标识
      const aiMsg: ChatMessage = {
        id: msgId,
        text: "",
        isUser: false,
        timestamp: Date.now()
      };
      setMessages([aiMsg]);

      // 极速流式输出 (15ms)
      let i = 0;
      const interval = setInterval(() => {
        currentText += fullText[i];
        setMessages(prev => {
          const newMsgs = [...prev];
          const targetIndex = newMsgs.findIndex(m => m.id === msgId);
          if (targetIndex !== -1) {
            newMsgs[targetIndex] = { ...newMsgs[targetIndex], text: currentText };
          }
          return newMsgs;
        });
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          onAnalysisComplete(`${birthDate.year}年${birthDate.month}月 命盘解析`, baziData, [...messages, { ...aiMsg, text: fullText }], birthDetails);
        }
      }, 15); // Speed up to 15ms

    } catch (error: any) {
      console.error('基准测试启动失败:', error);
      alert(`启动失败: ${error.message || '网络连接错误'}`);
      setAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
      setMessages([]);
      setCurrentHistoryId(null);
      if (setFullScreen) setFullScreen(false);

      // 如果是从历史记录打开的，返回个人中心
      if (initialHistoryContext && onBackToProfile) {
        onBackToProfile();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    if (balance < 50) {
      setShowRechargeModal(true);
      return;
    }

    // 统一使用 currentHistoryId（在新建时创建，在历史模式时从 initialHistoryContext 设置）
    if (!currentHistoryId) {
      console.error('没有历史记录ID，无法发送消息。请先完成命盘分析。');
      return;
    }

    const userMessageText = inputText;
    const newMessage = { id: Date.now(), text: userMessageText, isUser: true, timestamp: Date.now() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsSending(true);

    try {
      // 调用后端 AI API（后端已扣除余额）
      const response = await sendChatMessage(currentHistoryId, userMessageText);

      // 直接用后端返回的余额更新本地状态（不再调用 API）
      if (setBalanceDirectly) {
        setBalanceDirectly(response.balance);
      }

      // 收到回复，停止思考动画 (允许全双工输入，所以 setIsSending(false))
      setIsSending(false);

      const fullText = response.message.text;
      const msgId = Date.now();

      // 添加 AI 消息容器 (空)
      const aiMsg = {
        id: msgId,
        text: "",
        isUser: false,
        timestamp: Date.now()
      };

      // 使用函数式更新确保基于最新状态
      setMessages(prev => [...prev, aiMsg]);

      // 极速流式输出 (15ms)
      let currentText = "";
      let i = 0;

      const interval = setInterval(() => {
        // 防止溢出
        if (i >= fullText.length) {
          clearInterval(interval);
          return;
        }

        currentText += fullText[i];
        setMessages(prev => {
          const newMsgs = [...prev];
          const targetIndex = newMsgs.findIndex(m => m.id === msgId);
          if (targetIndex !== -1) {
            newMsgs[targetIndex] = { ...newMsgs[targetIndex], text: currentText };
          }
          return newMsgs;
        });
        i++;
      }, 15);

      // 如果在历史模式，流式结束后理论上应该更新，但由于闭包问题，暂不实时更新历史列表Context
      if (initialHistoryContext && onUpdateHistoryChat) {
        // 仅在开始时通知一次，或者不做处理，下次重进会加载
      }

    } catch (error: any) {
      console.error('AI 对话失败:', error);
      setIsSending(false);
      // 显示错误消息
      const errorMsg = {
        id: Date.now(),
        text: `发送失败: ${error.message || '网络错误'}`,
        isUser: false,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // ... DatePicker and LocationPicker (same as before)
  // 自动选择处理逻辑
  const handlePickerScroll = (ref: React.RefObject<HTMLDivElement | null>, type: 'year' | 'month' | 'day' | 'hour' | 'minute') => {
    if (ref.current && !isScrollingRef.current) {
      const index = Math.round(ref.current.scrollTop / 32);

      setTempDate(prev => {
        const next = { ...prev };
        if (type === 'year') next.year = 1930 + index;
        if (type === 'month') next.month = 1 + index;
        if (type === 'day') next.day = 1 + index;
        if (type === 'hour') next.hour = index === 0 ? null : index - 1;
        if (type === 'minute') next.minute = index === 0 ? null : index - 1;

        // 确保范围合法
        if (next.month > 12) next.month = 12;
        if (next.day > 31) next.day = 31;
        if (next.year > 2099) next.year = 2099;

        return next;
      });
    }
  };

  const renderDatePicker = () => {
    if (!isDatePickerOpen) return null;
    const years = Array.from({ length: 170 }, (_, i) => 1930 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = [null, ...Array.from({ length: 24 }, (_, i) => i)];
    const minutes = [null, ...Array.from({ length: 60 }, (_, i) => i)];

    const renderColumn = (label: string, items: any[], type: 'year' | 'month' | 'day' | 'hour' | 'minute', listRef: React.RefObject<HTMLDivElement | null>) => (
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] text-gray-500 text-center mb-1 font-medium">{label}</div>
        <div className="relative h-40 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden shadow-inner border border-gray-100 dark:border-white/5">
          {/* Gradients */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-50 dark:from-[#1E1E1E] via-gray-50/60 dark:via-[#1E1E1E]/60 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50 dark:from-[#1E1E1E] via-gray-50/60 dark:via-[#1E1E1E]/60 to-transparent z-10 pointer-events-none"></div>

          {/* Selection Box - Exactly centered (160px height, 32px item height) */}
          <div className="absolute inset-x-1 top-[64px] h-8 border-y border-blue-500/30 bg-blue-500/10 z-0 rounded-sm"></div>

          <div
            ref={listRef}
            onScroll={() => handlePickerScroll(listRef, type)}
            className="h-full overflow-y-auto hide-scrollbar snap-y snap-mandatory relative z-20 py-16 scroll-smooth"
          >
            {items.map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  setTempDate(prev => ({ ...prev, [type]: item }));
                }}
                className={`h-8 flex items-center justify-center snap-center text-sm font-medium transition-colors ${(type === 'year' ? tempDate.year === item :
                  type === 'month' ? tempDate.month === item :
                    type === 'day' ? tempDate.day === item :
                      type === 'hour' ? tempDate.hour === item :
                        tempDate.minute === item) ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 opacity-40'}`}
              >
                {item === null ? '未知' : item.toString().padStart(label === '年' ? 4 : 2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-t-3xl p-6 pb-10 mb-20 animate-in slide-in-from-bottom duration-300 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">选择出生时间</h3>
            <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
              <span className="px-3 py-1 text-xs rounded-md font-medium bg-white dark:bg-white/20 shadow-sm text-primary">公历</span>
            </div>
          </div>
          <div className="flex gap-1.5 mb-6">
            {renderColumn('年', years, 'year', yearListRef)}
            {renderColumn('月', months, 'month', monthListRef)}
            {renderColumn('日', days, 'day', dayListRef)}
            {renderColumn('时', hours, 'hour', hourListRef)}
            {renderColumn('分', minutes, 'minute', minuteListRef)}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setDatePickerOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 font-bold text-gray-500 dark:text-gray-400 active:scale-95 transition-transform">取消</button>
            <button onClick={() => { setBirthDate(tempDate); setDatePickerOpen(false); }} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-transform">确认</button>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationPicker = () => {
    if (!isLocationPickerOpen) return null;

    // Get lists based on current selection
    const cityList = getCitiesOfProvince(tempLocation.province);
    const districtList = getDistrictsOfCity(tempLocation.province, tempLocation.city);

    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-t-3xl p-6 pb-10 mb-20 animate-in slide-in-from-bottom duration-300">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">选择出生地点</h3>
          <div className="flex gap-2 mb-6 h-56">
            {/* Province Column */}
            <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl overflow-y-auto hide-scrollbar p-2">
              {CHINA_REGIONS.map(p => (
                <div key={p.name}
                  onClick={() => {
                    const firstCity = p.children?.[0];
                    const firstDist = firstCity?.children?.[0];
                    setTempLocation({
                      province: p.name,
                      city: firstCity?.name || '',
                      district: firstDist?.name || '',
                      lat: firstDist?.lat,
                      lng: firstDist?.lng
                    });
                  }}
                  className={`py-2.5 px-2 text-xs text-center rounded-lg mb-1 transition-colors ${tempLocation.province === p.name ? 'bg-white dark:bg-white/20 shadow-sm font-bold text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  {p.name}
                </div>
              ))}
            </div>

            {/* City Column */}
            <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl overflow-y-auto hide-scrollbar p-2">
              {cityList.map(c => (
                <div key={c.name}
                  onClick={() => {
                    const firstDist = c.children?.[0];
                    setTempLocation({
                      ...tempLocation,
                      city: c.name,
                      district: firstDist?.name || '',
                      lat: firstDist?.lat,
                      lng: firstDist?.lng
                    });
                  }}
                  className={`py-2.5 px-2 text-xs text-center rounded-lg mb-1 transition-colors ${tempLocation.city === c.name ? 'bg-white dark:bg-white/20 shadow-sm font-bold text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  {c.name}
                </div>
              ))}
            </div>

            {/* District Column */}
            <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl overflow-y-auto hide-scrollbar p-2">
              {districtList.map(d => (
                <div key={d.name}
                  onClick={() => setTempLocation({ ...tempLocation, district: d.name, lat: d.lat, lng: d.lng })}
                  className={`py-2.5 px-2 text-xs text-center rounded-lg mb-1 transition-colors ${tempLocation.district === d.name ? 'bg-white dark:bg-white/20 shadow-sm font-bold text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  {d.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setLocationPickerOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 font-bold text-gray-500 dark:text-gray-400">取消</button>
            <button onClick={() => { setLocation(tempLocation); setLocationPickerOpen(false); }} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-amber-500/20">确认</button>
          </div>
        </div>
      </div>
    );
  };

  // Render Logout Confirmation Modal using Portal
  const renderLogoutConfirmModal = () => {
    if (!showLogoutConfirm) return null;
    return createPortal(
      <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowLogoutConfirm(false)}>
        <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-white">确定退出登录吗？</h3>
          <p className="text-sm text-gray-400 mb-6">退出后需要重新验证手机号登录</p>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-gray-300 transition-colors">取消</button>
            <button onClick={confirmLogout} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors">退出</button>
          </div>
        </div>
      </div>,
      document.body
    );
  };



  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-[#050507] relative overflow-y-auto hide-scrollbar overflow-x-hidden transition-colors duration-300">
      {showDetailModal && chart && (
        <DetailedChartScreen
          chart={chart}
          birthDate={new Date(birthDate.year, birthDate.month - 1, birthDate.day, birthDate.hour || 0, birthDate.minute || 0)}
          gender={gender}
          onClose={() => setShowDetailModal(false)}
          username={username || '用户'}
          avatar={avatar}
        />
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isRechargeClosing ? 'bg-black/0 backdrop-blur-0' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div
            className={`bg-white dark:bg-[#1C1C1E] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-[101] ${isRechargeClosing ? 'translate-y-full opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}
            style={{
              animation: !isRechargeClosing ? 'iosSlideUp 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards' : 'none',
              willChange: 'transform, opacity'
            }}
          >
            <style>{`
              @keyframes iosSlideUp {
                from { transform: translateY(100%) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
              }
            `}</style>
            <button onClick={handleCloseRechargeModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-2 bg-gray-100 dark:bg-white/5 rounded-full"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-white">
              {paymentOrder ? '请按金额扫码' : '余额不足，请充值'}
            </h2>

            {!paymentOrder ? (
              <div className="relative min-h-[280px] flex flex-col justify-center">
                <div className={`grid grid-cols-2 gap-3 mb-6 transition-all duration-700 ${isPaying ? 'filter blur-md opacity-20 scale-[0.98] pointer-events-none' : 'scale-100 opacity-100'}`}>
                  {RECHARGE_TIERS.map((tier, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCreateOrder(tier.price, tier.points)}
                      className={`relative rounded-xl p-4 border flex flex-col items-center cursor-pointer transition-all active:scale-95 ${tier.isVip ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300 dark:from-amber-900/20 dark:to-black dark:border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)] overflow-hidden' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-amber-500'}`}
                    >
                      {tier.isVip && <div className="absolute inset-0 border-2 border-amber-400/50 rounded-xl animate-pulse" />}
                      {tier.isVip && <div className="absolute -right-8 top-2 bg-amber-500 text-white text-[9px] px-8 py-0.5 rotate-45 font-bold shadow-sm">皇冠</div>}
                      {tier.label && !tier.isVip && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">{tier.label}</div>}
                      <div className={`text-xl font-bold mb-1 ${tier.isVip ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>¥{tier.price}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{tier.points} 算力</div>
                    </div>
                  ))}
                </div>

                {/* iOS 极致丝滑 Loading - 修正物理动效算法 */}
                {isPaying && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-in fade-in duration-500 bg-white/10 dark:bg-black/5 backdrop-blur-[2px] rounded-3xl">
                    <div className="relative w-10 h-10">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-[8.5%] h-[28%] bg-gray-600 dark:bg-gray-300 rounded-full left-[45.75%] top-0 origin-[50%_178%]"
                          style={{
                            transform: `rotate(${i * 30}deg)`,
                            animation: 'ios-spinner-fade 0.8s linear infinite',
                            animationDelay: `${(i - 12) * 0.066}s`
                          }}
                        />
                      ))}
                    </div>
                    <style>{`
                      @keyframes ios-spinner-fade {
                        0% { opacity: 1; }
                        100% { opacity: 0.15; }
                      }
                    `}</style>
                    <p className="mt-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-[0.1em] opacity-80">
                      正在接入支付环境...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <style>{`
                  @keyframes breathe {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.04); text-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
                  }
                  .animate-breathe { animation: breathe 2s ease-in-out infinite; }
                `}</style>

                {/* REMOVED: <div className="text-xs text-gray-400 mb-1 tracking-widest">支持支付宝/微信</div> */}

                <div className="text-4xl font-black text-red-500 mb-1 flex items-baseline">
                  <span className="text-xl mr-1">￥</span>
                  {paymentOrder.finalAmount.toFixed(2)}
                </div>

                <div className="flex items-center gap-1.5 mb-3 text-amber-500 font-mono text-sm bg-amber-500/10 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  <span>剩余支付时间</span>
                  <span className="font-bold">
                    {Math.floor(paymentCountdown / 60)}:{(paymentCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 bg-red-50 dark:bg-red-900/20 px-6 py-1.5 rounded-full border border-red-200 dark:border-red-800/50">
                  请按此金额支付，切勿修改
                </div>

                <div className="w-36 h-36 bg-white dark:bg-white rounded-xl flex items-center justify-center border-2 border-gray-100 dark:border-white/20 relative overflow-hidden mb-2 shadow-inner">
                  <img src="/payment_qr.jpg" alt="收款二维码" className="w-full h-full object-contain" />
                </div>

                <div className="flex items-center justify-center gap-4 mb-2 w-full px-6">
                  <img src="/pay_channels.png" alt="支付渠道" className="h-5 w-full object-contain opacity-90" />
                </div>

                <div className="flex flex-col items-center gap-4 w-full px-4">
                  <div className="flex items-center space-x-3 text-gray-400 dark:text-gray-500 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-sm tracking-[0.2em] font-bold text-blue-500 opacity-90 animate-pulse">检测支付中... </span>
                  </div>

                  <button
                    onClick={handleCheckPaymentStatus}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all text-sm mb-1"
                  >
                    我已支付
                  </button>

                  <button
                    onClick={() => handleCloseRechargeModal()}
                    className="text-xs text-blue-500/60 hover:text-blue-500 underline underline-offset-4 transition-colors p-2"
                  >
                    更换套餐金额
                  </button>
                </div>
              </div>
            )}
            <p className="text-center text-[10px] text-gray-400 mt-2 leading-tight">
              支付成功后系统自动识别<br />如有疑问请联系客服
            </p>
          </div>
        </div>
      )}

      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>

      <header className="pt-12 px-5 pb-4 flex items-center z-30 sticky top-0 bg-[#F3F4F6]/90 dark:bg-[#050507]/90 backdrop-blur-md transition-all duration-300 min-h-[88px]">
        {/* Left: Back Button */}
        <div className="w-20 flex items-center">
          {showResult && !isSearchOpen && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
        </div>

        {/* Center: Title OR Search Bar */}
        <div className="absolute left-1/2 -translate-x-1/2 flex justify-center w-full max-w-[60%] pointer-events-none z-40">
          <div className="pointer-events-auto w-full flex justify-center">
            <AnimatePresence mode="wait">
              {isSearchOpen ? (
                <motion.div
                  key="search"
                  initial={{ width: 40, opacity: 0, x: 100 }}
                  animate={{ width: '100%', opacity: 1, x: 0 }}
                  exit={{ width: 40, opacity: 0, x: 100 }}
                  transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
                  className="flex items-center justify-center w-full"
                >
                  <div className="relative w-full max-w-[500px] flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        const newTerm = e.target.value;
                        setSearchTerm(newTerm);
                      }}
                      placeholder="搜索对话内容"
                      className="w-full bg-white dark:bg-white/10 px-4 py-2.5 pl-10 pr-10 rounded-full text-sm border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-lg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          traverseSearch('next');
                        }
                      }}
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

                    <button
                      onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/30 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="title"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
                  className="text-center"
                >
                  <h1 className="text-lg font-bold tracking-widest text-gray-900 dark:text-white">微量玄妙</h1>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 tracking-wider font-medium">智能排盘控制台</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-auto ml-auto flex justify-end items-center gap-2 min-w-[80px]">
          {!isSearchOpen && hasBenchmarkStarted && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => {
                  if (confirm('确定要开启新对话吗？当前对话将保存到历史记录。')) {
                    setShowResult(false);
                    setMessages([]);
                    setCurrentHistoryId(null);
                    setHasBenchmarkStarted(false);
                    setHasInitialized(false);
                    setTimeout(() => {
                      setHasInitialized(true);
                      setShowResult(true);
                    }, 100);
                  }
                }}
                className="h-9 px-3 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-transform hover:text-amber-500"
              >
                <span>新对话</span>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-90 transition-transform hover:text-amber-500"
              >
                <Search size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </header>

      <main className="px-4 pb-32 relative z-10 min-h-[80vh] overflow-x-hidden">
        <div className={`transition-all duration-500 ease-in-out ${showResult || analyzing ? 'opacity-0 translate-y-10 pointer-events-none absolute' : 'opacity-100 translate-y-0'}`}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
            {/* Input Form... same as before */}
            <div className="space-y-5 relative z-10">
              {/* Inputs for Nickname, Gender, Date, Location, Button */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1 block pl-1">昵称</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入昵称 (可选)" className="w-full bg-[#F3F4F6] dark:bg-[#121217] border-0 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div className="w-32 flex flex-col justify-end">
                  <div className="bg-[#F3F4F6] dark:bg-[#121217] rounded-xl p-1 flex h-[44px] items-center transition-colors">
                    <button onClick={() => setGender('male')} className={`flex-1 h-full rounded-lg flex items-center justify-center space-x-1 transition-all ${gender === 'male' ? 'bg-white dark:bg-[#1C1C1E] shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      <span className="text-sm font-bold">♂</span><span className="text-xs font-bold">男</span>
                    </button>
                    <button onClick={() => setGender('female')} className={`flex-1 h-full rounded-lg flex items-center justify-center space-x-1 transition-all ${gender === 'female' ? 'bg-white dark:bg-[#1C1C1E] shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      <span className="text-sm font-bold">♀</span><span className="text-xs font-bold">女</span>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">出生日期</label>
                  <div className="bg-[#F3F4F6] dark:bg-[#121217] rounded-lg p-0.5 flex text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1C1C1E] shadow-sm text-primary font-medium">公历</span>
                  </div>
                </div>
                <div onClick={() => { setTempDate(birthDate); setDatePickerOpen(true); }} className="flex space-x-2 cursor-pointer">
                  {[{ l: '年', v: birthDate.year }, { l: '月', v: birthDate.month.toString().padStart(2, '0') }, { l: '日', v: birthDate.day.toString().padStart(2, '0') }, { l: '时', v: birthDate.hour === null ? '未知' : birthDate.hour.toString().padStart(2, '0') + ':' + (birthDate.minute === null ? '未知' : birthDate.minute.toString().padStart(2, '0')) }].map((item, idx) => (
                    <div key={idx} className="flex-1 bg-[#F3F4F6] dark:bg-[#121217] rounded-xl py-3 flex flex-col items-center justify-center group border-2 border-transparent hover:border-primary/10 transition-all active:scale-95">
                      <span className="text-[10px] text-gray-400 group-hover:text-primary transition-colors">{item.l}</span>
                      <span className="text-lg font-bold mt-0.5 font-mono text-gray-800 dark:text-gray-200 text-center">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block pl-1">出生地点</label>
                <div onClick={() => { setTempLocation(location); setLocationPickerOpen(true); }} className="bg-[#F3F4F6] dark:bg-[#121217] rounded-xl p-3 flex items-center space-x-3 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors active:scale-[0.99]">
                  <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white w-full truncate pl-2">
                    <span>{location.province}</span><span className="mx-1 text-gray-400">/</span><span>{location.city}</span><span className="mx-1 text-gray-400">/</span><span>{location.district}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 ml-auto" />
                </div>
              </div>
              <button onClick={initializeParameters} className="w-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset hover:from-[#F0E5D5] hover:to-[#D5C4A8] active:scale-[0.98] text-white rounded-xl py-4 font-bold shadow-[0_10px_25px_-5px_rgba(202,186,156,0.5),inset_0_0_12px_rgba(255,255,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center space-x-2 transition-all backdrop-blur-sm"><span>初始化出厂参数</span></button>
            </div>
          </div>
        </div>

        {
          analyzing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-[#F3F4F6] dark:bg-[#050507]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-white/10 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Zap size={20} className="text-primary animate-pulse" /></div>
              </div>
              <p className="text-xs text-gray-500 tracking-widest animate-pulse">
                测试报告生成需要约3分钟，请勿离开此页面...
              </p>
            </div>
          )
        }

        {
          showResult && chart && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
              {/* 顶部: 详细命盘条 (可点击查看详情) */}
              {/* 顶部: 详细命盘条 (去除高亮样式) */}
              {/* 顶部: 详细命盘条 (去除高亮样式 - 透明背景，无阴影，无边框) */}
              <div onClick={() => setShowDetailModal(true)} className="relative z-20 bg-white/80 dark:bg-[#050507]/80 backdrop-blur-md rounded-2xl mb-6 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform border border-gray-100 dark:border-white/5">
                <div className="grid grid-cols-4 divide-x divide-transparent border-b border-transparent">
                  {[
                    { title: '年柱', gan: chart.year.gan, zhi: chart.year.zhi, ganShen: chart.year.ganShen, zhiShen: chart.year.zhiShen },
                    { title: '月柱', gan: chart.month.gan, zhi: chart.month.zhi, ganShen: chart.month.ganShen, zhiShen: chart.month.zhiShen },
                    { title: '日柱', gan: chart.day.gan, zhi: chart.day.zhi, ganShen: gender === 'male' ? '元男' : '元女', zhiShen: chart.day.zhiShen },
                    { title: '时柱', gan: chart.hour.gan, zhi: chart.hour.zhi, ganShen: chart.hour.ganShen, zhiShen: chart.hour.zhiShen }
                  ].map((col, i) => (
                    <div key={i} className="flex flex-col items-center py-3 relative group">
                      <span className="text-[10px] text-gray-400 mb-1">{col.title}</span>
                      <span className="text-[10px] font-medium text-primary mb-1 scale-90">{col.ganShen}</span>
                      <span className="text-xl font-serif font-bold leading-none mb-1"><ElementText char={col.gan} /></span>
                      <span className="text-xl font-serif font-bold leading-none mb-1"><ElementText char={col.zhi} /></span>
                      <span className="text-[10px] font-medium text-primary scale-90">{col.zhiShen}</span>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/0 group-hover:bg-primary/50 transition-colors"></div>
                    </div>
                  ))}
                </div>
                <div className="py-2 bg-transparent">
                  <div className="flex overflow-x-auto px-4 space-x-4 hide-scrollbar justify-center">
                    <div className="flex-shrink-0 flex flex-col justify-center items-center pr-2 border-r border-gray-200/50 dark:border-white/5">
                      <span className="text-[10px] text-gray-400 writing-mode-vertical">大运</span>
                    </div>
                    {daYun.map((cycle, idx) => (
                      <div key={idx} className="flex flex-col items-center space-y-1 min-w-[40px] opacity-80">
                        <span className="text-[10px] font-serif font-bold text-gray-900 dark:text-gray-200">{cycle.gan}{cycle.zhi}</span>
                        <span className="text-[9px] text-gray-500">{cycle.age}岁</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 聊天对话框区域 */}
              {/* Chat Area Container */}
              <div className="bg-white/50 dark:bg-[#1C1C1E]/50 rounded-2xl p-5 border border-dashed border-gray-300 dark:border-white/10 min-h-[400px] flex flex-col relative transition-all">
                {/* Balance Badge */}
                <div className="absolute top-4 left-4 pointer-events-none z-10">
                  <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm pointer-events-auto">
                    <Zap size={12} className="text-amber-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{balance}</span>
                  </div>
                </div>

                {/* AI Avatar */}
                <div className="flex items-center justify-center gap-2 mb-4 mt-8">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset shadow-[inset_0_0_8px_rgba(255,255,255,0.5)] flex items-center justify-center transition-all ${analyzing ? 'animate-pulse ring-4 ring-[#CABA9C]/30 scale-110' : ''}`}>
                    <QuantumIcon />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">FateDiffusion AI</span>
                </div>

                {!hasBenchmarkStarted ? (
                  <div className="flex-1 flex flex-col items-center justify-center pb-20 animate-in fade-in zoom-in duration-500">
                    <button
                      onClick={runBenchmark}
                      className="bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white rounded-full px-8 py-4 font-bold shadow-[0_15px_35px_-5px_rgba(202,186,156,0.6),inset_0_0_15px_rgba(255,255,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group backdrop-blur-sm"
                    >
                      <Zap size={20} fill="currentColor" className="group-hover:animate-pulse" />
                      <span>开始基准测试</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">-50算力</span>
                    </button>
                    <p className="text-[10px] text-gray-400 mt-4 text-center leading-relaxed font-mono whitespace-nowrap">
                      构建多维时空全息模型 &nbsp; 演算大概率世界线收束
                    </p>
                    <p className="text-[10px] text-gray-400/60 mt-2 text-center">
                      可在个人主页中查看历史记录
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-4 mb-4 pb-24 overflow-y-auto no-scrollbar scroll-smooth">
                    {messages.length === 0 && !isSending ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 opacity-60">
                        <p className="text-[10px] tracking-widest uppercase animate-pulse">AI is ready...</p>
                      </div>
                    ) : (
                      <>
                        {messages.map(msg => {
                          const isMatch = searchMatches.some(m => m.id === msg.id.toString());
                          const currentMatch = searchMatches[currentMatchIndex];
                          const isCurrent = currentMatch && currentMatch.id === msg.id.toString();

                          // Custom Renderer for Highlighting
                          const HighlightRenderer = ({ children }: { children: React.ReactNode }) => {
                            if (!searchTerm.trim()) return <>{children}</>;

                            return (
                              <>
                                {React.Children.map(children, (child) => {
                                  if (typeof child === 'string') {
                                    try {
                                      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                      const parts = child.split(new RegExp(`(${escapedTerm})`, 'gi'));
                                      return parts.map((part, i) => {
                                        if (part.toLowerCase() === searchTerm.toLowerCase()) {
                                          return <span key={i} className="highlight-match bg-orange-400 text-white px-0.5 rounded shadow-sm font-bold">{part}</span>;
                                        }
                                        return part;
                                      });
                                    } catch (e) {
                                      return child;
                                    }
                                  }
                                  return child;
                                })}
                              </>
                            );
                          };

                          return (
                            <div key={msg.id} id={`msg-${msg.id}`} className={`relative flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 scroll-mt-32 group`}>
                              {/* AI Avatar Removed for cleaner text view */}
                              <div
                                className={`w-full rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300 ${isCurrent ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.01]' :
                                  isMatch ? 'ring-1 ring-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10' : ''
                                  } ${msg.isUser ? 'bg-primary text-white rounded-br-none max-w-[85%] ml-auto select-text' : 'bg-transparent text-gray-800 dark:text-gray-200 rounded-bl-none border-none p-0 markdown-body select-text cursor-pointer active:bg-gray-100 dark:active:bg-white/5'}`}
                              // interactions removed for native copy
                              >
                                {msg.isUser ? msg.text : (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></p>,
                                      strong: ({ node, ...props }) => <span className="font-bold text-primary" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></span>,
                                      // Ensure other elements also use HighlightRenderer if text content matches
                                      li: ({ node, ...props }) => <li className="mb-1" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></li>,
                                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></h1>,
                                      h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></h2>,
                                      h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1 mt-2" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></h3>,
                                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-gray-500 my-2" {...props}><HighlightRenderer>{props.children}</HighlightRenderer></blockquote>,
                                      table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-3 -mx-2">
                                          <table className="w-full text-xs rounded-xl overflow-hidden border border-gray-200 dark:border-white/10" {...props} />
                                        </div>
                                      ),
                                      thead: ({ node, ...props }) => <thead className="bg-gradient-to-r from-amber-500/10 to-gray-500/10 dark:from-amber-500/20 dark:to-gray-500/20" {...props} />,
                                      th: ({ node, ...props }) => (
                                        <th className="px-2 py-2.5 text-[10px] font-bold text-primary uppercase tracking-wider text-center whitespace-nowrap" {...props} />
                                      ),
                                      tr: ({ node, ...props }) => <tr className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-blue-50/50 dark:hover:bg-white/10 transition-colors" {...props} />,
                                      td: ({ node, children, ...props }) => {
                                        // 检测是否是五行元素单元格并应用颜色
                                        const text = String(children);
                                        let colorClass = '';
                                        if (text.includes('金') || text.includes('Metal')) colorClass = 'text-amber-500 font-bold';
                                        return (
                                          <td className={`px-2 py-2 text-center border-t border-gray-100 dark:border-white/5 ${colorClass}`} {...props}>
                                            <HighlightRenderer>{children}</HighlightRenderer>
                                          </td>
                                        );
                                      },
                                    }}
                                  >
                                    {msg.text}
                                  </ReactMarkdown>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* 思考状态 (当 isSending 为 true 时显示) */}
                        {isSending && (
                          <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset shadow-[inset_0_0_8px_rgba(255,255,255,0.5)] flex items-center justify-center mr-2 mt-1 flex-shrink-0 animate-pulse ring-4 ring-[#CABA9C]/20 backdrop-blur-sm">
                              <QuantumIcon />
                            </div>
                            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 dark:border-white/5 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <span className="text-xs text-gray-400 ml-2">正在思考...</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div ref={chatEndRef}></div>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </main >

      {/* Sticky Bottom Input - Moved Outside Main */}
      {/* Sticky Bottom Input - Moved Outside Main */}
      {
        showResult && hasBenchmarkStarted && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#050507]/80 backdrop-blur-xl p-4 z-50 border-t border-gray-100 dark:border-white/5 flex justify-center pb-8 sm:pb-4">
            <div className="w-full max-w-4xl relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; // Max height ~5 rows
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending && hasBenchmarkStarted) handleSendMessage();
                  }
                }}
                placeholder="了解更多您的底层代码..."
                disabled={!hasBenchmarkStarted || isSending}
                className="w-full bg-gray-100 dark:bg-[#1C1C1E] border-0 rounded-2xl pl-5 pr-12 py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg resize-none overflow-y-auto min-h-[56px]"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending || !hasBenchmarkStarted}
                className="absolute right-3 bottom-0 top-0 my-auto w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:text-gray-400 hover:bg-blue-50/50 dark:hover:bg-white/5 active:scale-95 transition-all"
              >
                {isSending ? <Loader2 size={24} className="animate-spin" /> : <ArrowUp size={24} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        )
      }
      {renderLogoutConfirmModal()}

      {/* Context Menu Removed */}

      {/* Toast Notification */}
      {
        toastMessage && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none px-6 py-3 bg-black/80 backdrop-blur-md text-white text-sm font-medium rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span>{toastMessage}</span>
            </div>
          </div>
        )
      }
      {/* AnimatePresence for Profile Modal - iOS Curve */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-[#F3F4F6] dark:bg-[#050507]"
          >
            <ProfileScreen
              user={{
                id: 'current-user',
                isLoggedIn: true,
                phone: '13800000000',
                uid: '888888',
                username: username || '用户',
                avatar: avatar || null,
                balance: balance,
                history: [], // Dummy, loaded internally by ProfileScreen
                hasAgreedPrivacy: true,
                chats: [],
                theme: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
              }}
              onBack={() => setIsProfileOpen(false)}
              onUpdateProfile={(n, a) => {
                if (n) setName(n);
              }}
              onToggleTheme={() => {
                const isDark = document.documentElement.classList.toggle('dark');
                // You might want to persist this setting
              }}
              onLogout={() => {
                setIsProfileOpen(false);
                setShowLogoutConfirm(true);
              }}
              onRecharge={() => setShowRechargeModal(true)}
              onLoadHistory={async (item) => {
                setIsProfileOpen(false);
                setCurrentHistoryId(item.id);
                setMessages([]);
                if (item.birthYear) {
                  setBirthDate({
                    year: item.birthYear,
                    month: item.birthMonth || 1,
                    day: item.birthDay || 1,
                    hour: item.birthHour || 0,
                    minute: 0
                  });
                }
                if (item.gender) setGender(item.gender);
                if (item.name) setName(item.name);

                try {
                  const { getChatMessages } = await import('../utils/api');
                  const res = await getChatMessages(item.id);
                  if (res && res.messages) {
                    const messages = res.messages.map((msg: any) => ({
                      id: msg.id,
                      text: msg.text,
                      isUser: msg.is_user || msg.isUser,
                      timestamp: msg.timestamp || Date.now()
                    }));

                    // Filter out the initial system command prompt
                    const filteredMessages = messages.filter((msg: any) => {
                      // Hide any user message that looks like the system prompt
                      // Check for key phrases "请分析我的命盘" AND "出生地" AND "经度" to be specific
                      if (msg.isUser && msg.text.includes('请分析我的命盘') && (msg.text.includes('出生地') || msg.text.includes('性别')) && msg.text.includes('经度')) {
                        return false;
                      }
                      return true;
                    });

                    setMessages(filteredMessages);
                  }
                } catch (e) { console.error('Failed to load history chat', e); }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );


}); // End of React.memo
