import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Zap, PlusCircle, Users, Edit2, X, Copy, Camera, FileText, ChevronRight, Crown, Moon, Sun, LogOut, AlertTriangle, Trash2, MessageSquare, Mail, MessageCircle, Hash, Check, Loader2 } from 'lucide-react';
import { UserState, HistoryItem } from '../types';
import { updateProfile, updateTheme, getHistoryList, deleteHistory as apiDeleteHistory, getInviteCode, applyInviteCode, HistoryItem as ApiHistoryItem, getUserDetails, uploadAvatar } from '../utils/api';
import { supabase } from '../utils/supabaseClient'; // Import supabase client
import Cropper from 'react-easy-crop';
import { getCroppedImg, compressImage } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileScreenProps {
  user: UserState;
  onRecharge: (amount: number) => void;
  onUpdateProfile: (name: string, avatar: string | null) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onLoadHistory: (item: HistoryItem) => void;
}

export const ProfileScreen = React.memo<ProfileScreenProps>(({ user, onRecharge, onUpdateProfile, onToggleTheme, onLogout, onLoadHistory }) => {
  console.log("ProfileScreen Re-rendered. user:", user.username);
  const [showInvite, setShowInvite] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.username);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null); // { id, finalAmount, expiresAt, points }
  const [isPaying, setIsPaying] = useState(false);
  const [isRechargeClosing, setIsRechargeClosing] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // 删除确认相关状态
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 邀请相关状态
  const [myInviteCode, setMyInviteCode] = useState<string>('');
  const [inputInviteCode, setInputInviteCode] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success: boolean, message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 头像裁剪相关状态
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // State for exit animation

  const handleCloseCropModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedImage(null);
      setIsClosing(false);
      // Reset defaults
      setZoom(1);
      setRotation(0);
    }, 300); // Match animation duration
  };

  const hasCrown = user.balance >= 5000;

  // 加载我的邀请码
  useEffect(() => {
    const loadInviteCode = async () => {
      try {
        const res = await getInviteCode();
        setMyInviteCode(res.invite_code);
      } catch (error) {
        console.error('获取邀请码失败:', error);
      }
    };
    loadInviteCode();
  }, []);

  // ---------------- 支付逻辑集成 ----------------
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
      setPaymentCountdown(300); // 5分钟
    } catch (error: any) {
      showToast(error.message || '创建支付订单失败，请重试');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCloseRechargeModal = () => {
    setIsRechargeClosing(true);
    setTimeout(() => {
      setShowRechargeModal(false);
      setIsRechargeClosing(false);
      setPaymentOrder(null);
      setPaymentCountdown(0);
    }, 500);
  };

  useEffect(() => {
    let timer: any;
    if (showRechargeModal && paymentOrder?.id) {
      timer = setInterval(async () => {
        try {
          const { checkPaymentStatus } = await import('../utils/api');
          const res = await checkPaymentStatus(paymentOrder.id);
          if (res.status === 1) {
            clearInterval(timer);
            handleCloseRechargeModal();
            showToast(`充值成功！已为您增加 ${paymentOrder.points} 算力。`);
            // 触发余额同步
            onRecharge(0);
          }
        } catch (e) {
          console.warn('轮询支付状态异常:', e);
        }
      }, 3000);
    }
    return () => timer && clearInterval(timer);
  }, [showRechargeModal, paymentOrder]);

  // 倒计时逻辑
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
        onRecharge(0);
      } else {
        showToast('暂未查询到支付记录，请确认是否已完成转账。如有疑问请联系客服。');
      }
    } catch (e: any) {
      showToast('查询状态失败，请重试');
    }
  };

  // 自动清除 Toast 提示
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);
  // ---------------------------------------------

  // 从后端加载历史记录（带本地缓存）
  useEffect(() => {
    const HISTORY_CACHE_KEY = 'fateDiffusion_historyCache';

    const loadHistory = async () => {
      // 1. 先从本地缓存加载（秒开）
      const cached = localStorage.getItem(HISTORY_CACHE_KEY);
      if (cached) {
        try {
          const cachedItems = JSON.parse(cached) as HistoryItem[];
          setHistoryItems(cachedItems);
          console.log('从本地缓存加载了', cachedItems.length, '条历史记录');
        } catch (e) {
          console.error('解析缓存失败:', e);
        }
      } else {
        setIsLoadingHistory(true);
      }

      // 2. 后台从后端同步最新数据
      try {
        const response = await getHistoryList();
        // 转换后端格式为前端格式
        const items: HistoryItem[] = response.items.map((item: ApiHistoryItem) => ({
          id: item.id,
          title: item.title,
          date: new Date(item.created_at).toLocaleString('zh-CN', {
            hour12: false,
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          tLevel: item.t_level,
          chartData: item.chart_data as any,
          birthYear: item.birth_year,
          birthMonth: item.birth_month,
          birthDay: item.birth_day,
          birthHour: item.birth_hour,
          gender: item.gender as 'male' | 'female',
          name: item.name || undefined
        }));
        setHistoryItems(items);

        // 3. 更新本地缓存
        localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(items));
        console.log('同步了', items.length, '条历史记录到本地缓存');
      } catch (error) {
        console.error('加载历史记录失败:', error);
        // 如果后端失败且没有缓存，回退到本地状态
        if (!cached) {
          setHistoryItems(user.history);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  const RECHARGE_TIERS = [
    { price: 12.8, points: 158, label: '首充' },
    { price: 28.8, points: 368, label: '' },
    { price: 58.8, points: 748, label: '热销' },
    { price: 118.8, points: 1588, label: '' },
    { price: 328, points: 4888, label: '' },
    { price: 648, points: 13148, label: '流光金', isVip: true },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(tempName, user.avatar || undefined);
      onUpdateProfile(tempName, user.avatar);
    } catch (error) {
      console.error('保存资料失败:', error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleApplyInviteCode = async () => {
    if (!inputInviteCode || inputInviteCode.length !== 6) return;
    setIsApplyingCode(true);
    setInviteResult(null);
    try {
      const res = await applyInviteCode(inputInviteCode);
      setInviteResult({ success: true, message: res.message });
      // 刷新余额（可以通过 onRecharge 增加余额，或者重新拉取用户信息）
      if (res.balance) {
        // 这里比较tricky，onRecharge只是加，我们需要从后端同步最新余额
        // 暂时先手动加 58
        onRecharge(58);
      }
    } catch (error: any) {
      setInviteResult({ success: false, message: error.message || '填写失败' });
    } finally {
      setIsApplyingCode(false);
    }
  };

  // 处理删除历史记录
  const handleDeleteHistory = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await apiDeleteHistory(deleteConfirmItem.id);
      const newItems = historyItems.filter(h => h.id !== deleteConfirmItem.id);
      setHistoryItems(newItems);
      // 同步更新本地缓存
      localStorage.setItem('fateDiffusion_historyCache', JSON.stringify(newItems));
      setDeleteConfirmItem(null);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setShowSettings(false);
      setIsSettingsClosing(false);
    }, 300);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleCloseSettings();
    setTimeout(onLogout, 300);
  };

  // Render Settings Modal using Portal
  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return createPortal(
      <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={handleCloseSettings}>
        <div
          className={`bg-white dark:bg-[#1C1C1E] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative transition-transform duration-300 ease-out ${isSettingsClosing ? 'translate-y-full' : 'translate-y-0 animate-in slide-in-from-bottom'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
          <h2 className="text-lg font-bold mb-4 px-2 text-gray-900 dark:text-white">设置</h2>
          <div className="space-y-2 mb-6">
            <div onClick={() => {
              const newTheme = user.theme === 'dark' ? 'light' : 'dark';
              // 乐观更新：立即切换本地主题
              onToggleTheme();

              // 后台同步同步到后端，不阻塞 UI
              updateTheme(newTheme).catch(error => {
                console.error('后台同步主题失败:', error);
                // 如果同步失败，可以选择是否回滚，或者保持用户当前选择
              });
            }} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                {user.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="font-medium">显示模式</span>
              </div>
              <span className="text-sm text-gray-500">{user.theme === 'dark' ? '深色' : '浅色'}</span>
            </div>
            <div onClick={() => { handleCloseSettings(); setTimeout(() => setShowPolicy(true), 300); }} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                <FileText size={20} />
                <span className="font-medium">用户协议与隐私政策</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div onClick={() => { handleCloseSettings(); setTimeout(() => setShowSupport(true), 300); }} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                <MessageSquare size={20} />
                <span className="font-medium">联系客服</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="mt-4 pt-2 pb-6">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <LogOut size={20} />
              退出登录
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Render Logout Confirmation Modal using Portal with HIGHER Z-INDEX
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

  // 邀请好友弹窗
  const renderInviteModal = () => {
    if (!showInvite) return null;
    return createPortal(
      <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => setShowInvite(false)}>
        <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowInvite(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={24} /></button>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_10px_20px_rgba(202,186,156,0.4),inset_0_0_10px_rgba(255,255,255,0.5)]">
              <Users size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">邀请好友</h2>
            <p className="text-sm text-gray-500 mt-1">双方各得 58 算力奖励</p>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6 border border-gray-100 dark:border-white/5">
            <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-bold">我的邀请码</label>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-primary tracking-widest">{myInviteCode || 'waiting...'}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(myInviteCode);
                  // toast success
                  showToast("邀请码已复制");
                }}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">
            <p>邀请新用户注册，双方均可获得 58 算力奖励</p>
          </div>

        </div>
      </div>,
      document.body
    );
  };

  // 联系客服弹窗
  const renderSupportModal = () => {
    if (!showSupport) return null;

    const contactMethods = [
      { id: 'email', label: '官方邮箱', value: 'asd1009510609@icloud.com', icon: Mail },
      { id: 'wechat', label: '官方微信', value: 'MuFeng426', icon: MessageCircle },
      { id: 'qq_group', label: '官方QQ交流群', value: '362122904', icon: Hash },
    ];

    const handleCopy = (id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopyStatus(id);
      setTimeout(() => setCopyStatus(null), 2000);
    };

    return createPortal(
      <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in" onClick={() => setShowSupport(false)}>
        <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowSupport(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={24} /></button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_10px_20px_rgba(202,186,156,0.4),inset_0_0_10px_rgba(255,255,255,0.5)]">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">联系客服</h2>
            <p className="text-sm text-gray-400 mt-1">如果您在使用中遇到问题，欢迎联系我们</p>
          </div>

          <div className="space-y-3">
            {contactMethods.map((method) => (
              <div key={method.id} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
                    <method.icon size={20} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{method.label}</label>
                    <p className="text-sm font-bold text-gray-900 dark:text-white select-all">{method.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(method.id, method.value)}
                  className="p-3 hover:bg-white/10 rounded-xl text-gray-400 hover:text-amber-500 transition-all active:scale-90"
                >
                  {copyStatus === method.id ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400">我们将尽快回复您的咨询</p>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 删除确认弹窗
  const renderDeleteConfirmModal = () => {
    if (!deleteConfirmItem) return null;
    const nickname = deleteConfirmItem.name || '未命名';
    const genderText = deleteConfirmItem.gender === 'male' ? '男' : '女';
    const displayTitle = `${nickname} ${genderText} 基准测试报告`;

    return createPortal(
      <div className="fixed inset-0 z-[1002] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setDeleteConfirmItem(null)}>
        <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2 text-white">确定删除此报告？</h3>
          <p className="text-sm text-gray-400 mb-2">{displayTitle}</p>
          <p className="text-xs text-gray-500 mb-6">删除后无法恢复</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirmItem(null)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-gray-300 transition-colors">取消</button>
            <button onClick={handleDeleteHistory} disabled={isDeleting} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors disabled:opacity-50">
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };


  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCroppedImage = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    // Save reference
    const imageToProcess = selectedImage;
    // DO NOT CLOSE MODAL IMMEDIATELY - Wait for compression to start to avoid freeze feeling
    setIsProcessingImage(true);

    // We defer the heavy work to next tick to allow UI to update (show loader)
    setTimeout(async () => {
      try {
        // Close modal after finding resource, or keep it open with loader?
        // User said "click use photo, might freeze".
        // Closing immediately is better for UX, BUT if processing freezes main thread, the close animation catches.
        // Use animation close
        handleCloseCropModal();
        showToast("正在后台处理并上传头像...");

        const croppedBlob = await getCroppedImg(imageToProcess, croppedAreaPixels, rotation);
        if (!croppedBlob) throw new Error('Could not crop image');

        // Compress
        const compressedBlob = await compressImage(croppedBlob, 800, 0.7);

        // Convert to Base64 for preview
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;

          // Optimistic Update
          onUpdateProfile(user.username, base64data);

          try {
            // Local Backend Upload
            const file = new File([compressedBlob], "avatar.jpg", { type: "image/jpeg" });
            const response = await uploadAvatar(file);

            // Response contains full updated user object, including new avatar_url
            // We can use that or just use the optimistic one.
            // But we should refresh context.
            const publicUrl = response.avatar_url;

            showToast("头像更新成功");

            // Refresh User Context
            const updatedUser = await getUserDetails();
            onUpdateProfile(updatedUser.username, publicUrl || base64data); // Fallback to base64 if url is weird

          } catch (e: any) {
            console.error('Upload process failed', e);
            if (e.message?.includes('Bucket not found') || e.error?.includes?.('Bucket not found')) {
              showToast("系统配置错误: 存储桶不存在");
            } else {
              showToast("上传失败: " + (e.message || "未知错误"));
            }
            // Revert optimistic update if critical? 
            // Usually fine to keep until refresh.
          } finally {
            setIsProcessingImage(false);
          }
        };
        reader.readAsDataURL(compressedBlob);
      } catch (e) {
        console.error(e);
        showToast("图片处理失败");
        setIsProcessingImage(false);
        setSelectedImage(null); // Ensure closed on error
      }
    }, 100);
  };

  // Cleanup orphaned code block entirely.
  // The renderCropModal definition ended at 679.
  // We will call it in the main return.

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-[#050508] text-gray-900 dark:text-gray-100 relative overflow-hidden transition-colors duration-300">


      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isRechargeClosing ? 'bg-black/0 backdrop-blur-0' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div
            className={`bg-white dark:bg-[#1C1C1E] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 pb-24 sm:pb-6 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-[101] ${isRechargeClosing ? 'translate-y-full opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}
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
            <h2 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">
              {paymentOrder ? '支付确认' : '充值套餐'}
            </h2>

            {!paymentOrder ? (
              <div className="relative min-h-[280px] flex flex-col justify-center">
                <div className={`grid grid-cols-2 gap-3 mb-6 transition-all duration-700 ${isPaying ? 'filter blur-md opacity-20 scale-[0.98] pointer-events-none' : 'scale-100 opacity-100'}`}>
                  {RECHARGE_TIERS.map((tier, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCreateOrder(tier.price, tier.points)}
                      className={`relative rounded-xl p-4 border flex flex-col items-center cursor-pointer transition-all active:scale-95 ${tier.isVip ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300 dark:from-amber-900/20 dark:to-black dark:border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-amber-500'}`}
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
                <div className="text-xs text-gray-400 mb-4 tracking-widest">请按金额扫码支付</div>
                <div className="text-5xl font-black text-red-500 mb-2 flex items-baseline">
                  <span className="text-2xl mr-1">￥</span>
                  {paymentOrder.finalAmount.toFixed(2)}
                </div>

                <div className="flex items-center gap-1.5 mb-6 text-amber-500 font-mono text-sm bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  <span>剩余支付时间</span>
                  <span className="font-bold">
                    {Math.floor(paymentCountdown / 60)}:{(paymentCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-6 bg-red-50 dark:bg-red-900/20 px-6 py-1.5 rounded-full border border-red-200 dark:border-red-800/50">
                  请按此金额支付，切勿修改
                </div>
                <div className="w-48 h-48 bg-white dark:bg-white rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-white/20 relative overflow-hidden mb-4 shadow-inner">
                  <img src="/payment_qr.jpg" alt="收款二维码" className="w-full h-full object-contain" />
                </div>

                <div className="flex items-center justify-center gap-4 mb-8 w-full px-6">
                  <img src="/pay_channels.png" alt="支付渠道" className="h-8 w-full object-contain opacity-90" />
                </div>

                <div className="flex flex-col items-center gap-4 w-full px-4">
                  <div className="flex items-center space-x-3 text-gray-400 dark:text-gray-500 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-sm tracking-[0.2em] font-bold text-blue-500 opacity-90 animate-pulse">检测支付中... </span>
                  </div>

                  <button
                    onClick={handleCheckPaymentStatus}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all text-base mb-2"
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
            <p className="text-center text-[10px] text-gray-400 mt-6 leading-relaxed">支付成功后系统将自动识别并增加算力</p>
          </div>
        </div>
      )}

      {renderSettingsModal()}
      {renderLogoutConfirmModal()}
      {renderInviteModal()}
      {renderSupportModal()}
      {renderDeleteConfirmModal()}


      {/* Policy Fullscreen Page */}
      {showPolicy && (
        <div className="fixed inset-0 z-[80] bg-white dark:bg-[#050507] flex flex-col animate-in fade-in slide-in-from-bottom duration-300 overflow-hidden">
          <header className="h-14 bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-white/5 flex items-center px-4 justify-between shrink-0">
            <button onClick={() => setShowPolicy(false)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300"><X size={24} /></button>
            <span className="font-bold text-gray-900 dark:text-white">用户协议与隐私政策</span>
            <div className="w-8"></div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 dark:text-gray-400 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">FateDiffusion 用户协议</h2>
            <p>1. 本应用尊重并保护所有使用服务用户的个人隐私权。</p>
            <p>2. 为了给您提供更准确、更有个性化的服务，本应用会按照本隐私权政策的规定使用和披露您的个人信息。</p>
            <p>3. 除本隐私权政策另有规定外，在未征得您事先许可的情况下，本应用不会将这些信息对外披露或向第三方提供。</p>
            <p>4. 本应用会不时更新本隐私权政策。您在同意本应用服务使用协议之时，即视为您已经同意本隐私权政策全部内容。</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-4">数据安全</h2>
            <p>5. 我们采用行业标准的加密技术保护您的数据安全。</p>
            <p>6. 您的命理数据仅用于本应用内的分析服务，不会被泛化使用或出售。</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-4">免责声明</h2>
            <p>7. 本应用提供的所有命理分析结果仅供娱乐参考，不构成任何形式的专业建议。</p>
            <p>8. 用户应谨慎看待分析结果，并自行承担使用本应用的风险。</p>
          </div>
        </div>
      )}



      {/* Full History Modal */}
      {showAllHistory && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#050507] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="h-16 border-b border-gray-100 dark:border-white/5 flex items-center px-4 justify-between">
            <button onClick={() => setShowAllHistory(false)} className="p-2 -ml-2"><X /></button>
            <span className="font-bold">全部历史报告</span>
            <div className="w-8"></div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyItems.map((item) => {
              const nickname = item.name || '未命名';
              const genderText = item.gender === 'male' ? '男' : '女';
              const displayTitle = `${nickname} ${genderText} 基准测试报告`;
              return (
                <div key={item.id} className="bg-gray-50 dark:bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-4 border border-gray-100 dark:border-[#23232E]">
                  <div
                    onClick={() => onLoadHistory(item)}
                    className="flex-1 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm">
                      {item.tLevel || 'T1'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium mb-0.5">{displayTitle}</h3>
                      <p className="text-[10px] text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmItem(item);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            {historyItems.length === 0 && <div className="text-center text-gray-400 mt-10">暂无记录</div>}
          </div>
        </div>
      )}

      {/* Abstract Bg */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-gray-500/15 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="pt-12 pb-4 px-6 flex justify-between items-center z-10">
        <h1 className="text-lg font-bold tracking-wide">个人中心</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvite(true)} className="p-2 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset rounded-full text-white shadow-lg active:scale-95 transition-transform flex items-center gap-1 px-3">
            <Users size={16} />
            <span className="text-xs font-bold">邀请</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="text-gray-800 dark:text-gray-200 hover:text-amber-500 transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 relative z-10">
        {/* User Info & Balance */}
        <div className="flex flex-col items-center mb-6 pt-8">
          {/* Avatar Container: Fixed to ensure Crown is visible */}
          <div className="relative mb-3 group cursor-pointer">
            {/* 隐藏的文件输入 */}
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                console.log('File input changed', e.target.files);
                const file = e.target.files?.[0];
                if (file) {
                  console.log('File selected:', file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    console.log('File read complete');
                    const result = event.target?.result as string;
                    if (result) {
                      setSelectedImage(result);
                      console.log('selectedImage state set');
                      // 重置裁剪状态
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                      setRotation(0);
                    } else {
                      console.error('File read result is empty');
                    }
                  };
                  reader.onerror = (err) => console.error('File read error', err);
                  reader.readAsDataURL(file);
                }
                // 清空 input value 允许重复选择同一文件
                e.target.value = '';
              }}
            />
            <label htmlFor="avatar-upload" className="cursor-pointer block">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] p-1 relative">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#1C1C1E] flex items-center justify-center overflow-hidden border-2 border-white dark:border-[#1C1C1E] relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">U</span>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera size={20} className="text-white" />
              </div>
            </label>

            {/* Crown placed ABSOLUTELY - adjusted position to avoid being cut off */}
            {hasCrown && (
              <div className="absolute -top-2 -right-2 text-amber-400 drop-shadow-md animate-bounce">
                <Crown size={26} fill="currentColor" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                className="bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
              />
              <button onClick={handleSaveProfile} disabled={isSaving} className="text-amber-500 text-xs font-bold disabled:opacity-50">{isSaving ? '保存中...' : '保存'}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">{user.username}</h2>
              <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
            </div>
          )}

          <div className="flex justify-center items-center gap-2">
            <span className="text-amber-500"><Zap size={12} /></span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">UID: {user.uid || 'N/A'}</span>
          </div>
        </div>

        <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 mb-6 shadow-lg border border-gray-100 dark:border-[#23232E] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent dark:from-amber-500/10 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-2 opacity-80">
              <Zap size={14} className="text-amber-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">算力余额 (Points)</span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold tracking-tight">{user.balance}</span>
              <span className="text-lg font-medium text-gray-400">PTS</span>
            </div>

            <div className="flex gap-3 w-full">
              <button onClick={() => setShowRechargeModal(true)} className="flex-1 py-3 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset hover:from-[#F0E5D5] hover:to-[#D5C4A8] active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 shadow-[0_15px_30px_-5px_rgba(202,186,156,0.5),inset_0_0_12px_rgba(255,255,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] text-white font-medium text-sm backdrop-blur-sm">
                <PlusCircle size={18} />
                <span>立即充值</span>
              </button>
              <button
                onClick={() => setShowInvite(true)}
                className="flex-1 py-3 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 hover:bg-gray-50 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 text-gray-700 dark:text-white font-medium text-sm"
              >
                <Users size={18} />
                <span>邀请好友赚算力</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-sm font-bold">超值优惠</h2>
            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">限时</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { price: 12.8, points: 158, tag: '新人' },
              { price: 58.8, points: 748, tag: '推荐' },
              { price: 648, points: 13148, tag: '尊享', crown: true }
            ].map((sku, i) => (
              <div key={i}
                onClick={() => { handleCreateOrder(sku.price, sku.points); setShowRechargeModal(true); }}
                className={`relative rounded-xl p-3 border cursor-pointer flex flex-col items-center transition-all active:scale-95 ${sku.crown ? 'bg-gradient-to-br from-gray-900 to-black border-amber-500/50 shadow-md' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-[#23232E]'}`}
              >
                {sku.tag && (
                  <div className={`absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ${sku.crown ? 'bg-amber-500' : 'bg-orange-500'}`}>
                    {sku.tag}
                  </div>
                )}
                {sku.crown && <div className="absolute top-1 right-1 text-amber-400"><Crown size={12} fill="currentColor" /></div>}
                <div className={`text-lg font-bold ${sku.crown ? 'text-amber-400' : ''}`}>¥{sku.price}</div>
                <div className={`text-xs ${sku.crown ? 'text-amber-200/60' : 'text-gray-500'}`}>{sku.points}点</div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-sm font-bold">我的历史报告·打开报告继续对话</h2>
            <button onClick={() => setShowAllHistory(true)} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-gray-400 text-xs">加载中...</div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">暂无历史记录</div>
            ) : (
              historyItems.slice(0, 3).map((item, i) => {
                const nickname = item.name || '未命名';
                const genderText = item.gender === 'male' ? '男' : '女';
                const displayTitle = `${nickname} ${genderText} 基准测试报告`;
                return (
                  <div key={item.id} onClick={() => onLoadHistory(item)} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 flex items-center gap-4 border border-gray-100 dark:border-[#23232E] shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm">
                      {item.tLevel || 'T1'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium mb-0.5">{displayTitle}</h3>
                      <p className="text-[10px] text-gray-400">{item.date}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-600`}>
                      已完成
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none px-6 py-3 bg-black/80 backdrop-blur-md text-white text-sm font-medium rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {/* Render Modals */}
      {renderSettingsModal()}
      {renderLogoutConfirmModal()}
      {renderInviteModal()}
      {renderSupportModal()}
      {renderDeleteConfirmModal()}

      {/* Crop Modal Inlined */}
      <AnimatePresence>
        {selectedImage && (
          createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[2000] bg-black flex flex-col"
              onAnimationStart={() => console.log("Crop Modal Animation Started")}
            >
              <div className="flex-1 relative bg-black">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={handleCropComplete}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                />
              </div>

              <div className="bg-[#1C1C1E] safe-area-bottom pb-6 pt-4 px-6 space-y-6 rounded-t-2xl z-10 shadow-2xl border-t border-white/10">
                {/* Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-xs w-8">缩放</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium active:scale-95 transition-all text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveCroppedImage}
                    disabled={isProcessingImage}
                    className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold shadow-lg shadow-white/10 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {isProcessingImage ? <Loader2 className="animate-spin w-4 h-4" /> : '使用照片'}
                  </button>
                </div>
              </div>
            </motion.div>,
            document.body
          )
        )}
      </AnimatePresence>
      {/* Crop Modal Inlined - Animated & Visible */}
      {/* Crop Modal Inlined - CSS Animated & Visible */}
      {selectedImage && (
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black flex flex-col"
            style={{
              visibility: 'visible',
              animation: isClosing ? 'modalFadeOut 0.3s ease-in forwards' : 'modalFadeIn 0.3s ease-out forwards'
            }}
            onAnimationStart={() => console.log("Crop Modal CSS Animation Started")}
            onAnimationEnd={(e) => {
              if (isClosing && e.animationName === 'modalFadeOut') {
                setSelectedImage(null);
                setIsClosing(false);
              }
            }}
          >
            {/* Custom Styles for Animation */}
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes modalFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes modalSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes modalSlideDown {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(20px); opacity: 0; }
              }
            `}</style>

            <div className="flex-1 relative bg-black">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>

            <div
              className="bg-[#1C1C1E] safe-area-bottom pb-6 pt-4 px-6 space-y-6 rounded-t-2xl z-10 shadow-2xl border-t border-white/10"
              style={{
                animation: isClosing ? 'modalSlideDown 0.3s ease-in forwards' : 'modalSlideUp 0.4s ease-out forwards',
                animationDelay: isClosing ? '0s' : '0.1s',
                opacity: isClosing ? 1 : 0 // Start invisible only for enter
              }}
            >
              {/* Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-xs w-8">缩放</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleCloseCropModal();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium active:scale-95 transition-all text-sm"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    // Assume save also closes, so logic should be wrapped if success?
                    // But save usually shows loading spinner then closes.
                    // We will let handleSaveCroppedImage call close or just close animation.
                    // IMPORTANT: handleSaveCroppedImage needs to call close animation?
                    // For now, let's keep it simple: clicking button calls existing function.
                    // Existing function calls setSelectedImage(null) directly.
                    // I need to intercept that.
                    await handleSaveCroppedImage();
                  }}
                  disabled={isProcessingImage}
                  className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold shadow-lg shadow-white/10 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isProcessingImage ? <Loader2 className="animate-spin w-4 h-4" /> : '使用照片'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}); // End of React.memo
