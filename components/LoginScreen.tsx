import React, { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, Lock, Ticket, X, Check, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { sendEmailCode, combinedLogin, UserResponse, sendCode } from '../utils/api';
import SliderCaptcha from './SliderCaptcha';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSplash } from './ui/LoadingSplash';

interface LoginScreenProps {
  onLogin: (user: UserResponse) => void;
  mode?: 'splash' | 'input'; // 新增 mode 属性控制状态
}

export const LoginScreen = React.memo<LoginScreenProps>(({ onLogin, mode = 'input' }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isExploding, setIsExploding] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [shake, setShake] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCaptchaSending, setIsCaptchaSending] = useState(false);
  const [isCaptchaClosing, setIsCaptchaClosing] = useState(false);
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);

  // Loading Splash State
  const [showLoadingSplash, setShowLoadingSplash] = useState(false);

  // Custom Error Modal State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Particles with animation config
  // Particles with animation config & depth
  const [particles] = useState(Array.from({ length: 120 }).map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 4 + 2, // Slightly smaller for better depth perception
    delay: Math.random() * 5,
    duration: Math.random() * 20 + 10,
    opacity: Math.random() * 0.4 + 0.1, // Lower opacity for depth
    color: Math.random() > 0.7 ? 'bg-indigo-300' : 'bg-white', // Some color variation
    blur: Math.random() > 0.5 ? 'blur-[1px]' : 'blur-none' // Depth of field effect
  })));

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const isValidPhone = (p: string) => /^1[3-9]\d{9}$/.test(p);
  const isValidEmail = (e: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e);

  const showError = (msg: string) => {
    setErrorMsg(msg);
  };

  const handleGetCode = () => {
    if (!phone) {
      showError("请输入手机号码");
      return;
    }
    if (phone.length !== 11 || !isValidPhone(phone)) {
      showError("手机号码格式错误！\n请检查是否输入了11位正确的数字。");
      return;
    }
    if (!email) {
      showError("请输入邮箱地址");
      return;
    }
    if (!isValidEmail(email)) {
      showError("邮箱格式错误！\n请输入正确的邮箱地址。");
      return;
    }
    setShowCaptcha(true);
  };

  const handleCaptchaSuccess = async () => {
    setIsCaptchaSending(true);

    try {
      await sendEmailCode(email);
      setCountdown(60);

      setTimeout(() => {
        setIsCaptchaClosing(true);
        setTimeout(() => {
          setShowCaptcha(false);
          setIsCaptchaSending(false);
          setIsCaptchaClosing(false);
        }, 500);
      }, 500);

    } catch (error: any) {
      setIsCaptchaSending(false);
      showError(error.message || "发送验证码失败");
    }
  };

  const handleLoginClick = async () => {
    if (!agreed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showError("请先阅读并同意用户协议和隐私政策");
      return;
    }

    if (!phone) {
      showError("请输入手机号码");
      return;
    }
    if (phone.length !== 11 || !isValidPhone(phone)) {
      showError("手机号码输入错误！\n请输入11位手机号并重试。");
      return;
    }

    if (!email) {
      showError("请输入邮箱地址");
      return;
    }
    if (!isValidEmail(email)) {
      showError("邮箱格式错误！\n请输入正确的邮箱地址。");
      return;
    }

    if (!code) {
      showError("请输入验证码");
      return;
    }

    // Show Loading Splash immediately
    setShowLoadingSplash(true);

    try {
      const response = await combinedLogin(phone, email, code, inviteCode || undefined);

      // Keep showing loading splash for a moment to ensure smoothness/readability
      // (User requested "wait page loaded completely", essentially simulating a stable transition)
      setTimeout(() => {
        onLogin(response.user);
      }, 1500); // 1.5s delay to show the beautiful loading splash

    } catch (error: any) {
      setShowLoadingSplash(false); // Hide splash on error
      showError(error.message || "登录失败，请重试");
    }
  };

  // 动画参数
  const logoTransition = {
    type: "tween" as const,
    ease: [0.2, 0, 0, 1] as const, // Emphasized deceleration
    duration: 0.8
  };

  const formTransition = {
    type: "tween" as const,
    ease: [0.32, 0.72, 0, 1] as const, // iOS sliding damping
    duration: 0.8,
    delay: 0.1
  };

  const isSplash = mode === 'splash';

  return (
    <div className="relative h-full w-full bg-[#050507] text-white overflow-hidden flex flex-col font-sans">
      <style>{`
        @keyframes float-particle {
            0% { transform: translate(0, 0); }
            50% { transform: translate(-10px, 15px); }
            100% { transform: translate(0, 0); }
        }
        /* WeChat Compatibility */
        body.is-wechat .login-logo {
          padding-top: 64px; /* Extra offset for WeChat specific header */
          padding-top: calc(64px + env(safe-area-inset-top)); 
        }
      `}</style>

      {/* Background Particles - Persistent across states */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isExploding ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#0B0B15] to-[#1a1a2e] z-0 pointer-events-none"></div>



        {/* Particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${p.color} ${p.blur}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animation: `float-particle ${p.duration}s infinite ease-in-out`,
              animationDelay: `-${p.delay}s`
            }}
          ></div>
        ))}

        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-50">
          <div className="w-[15vw] h-[15vw] rounded-full border-2 border-amber-500/40 animate-[ping_4s_linear_infinite] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-[35vw] h-[35vw] rounded-full border-2 border-gray-500/30 animate-[ping_6s_linear_infinite_1s] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <div className={`relative z-20 flex flex-col h-full w-full ${isExploding ? 'scale-150 opacity-0 blur-2xl transition-all duration-700' : ''}`}>

        {/* Logo Container - Handles position transition */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center justify-center z-30 login-logo"
          initial={false}
          animate={{
            top: isSplash ? "40%" : "15%", // Adjust top position
            y: isSplash ? "-50%" : "0%"
          }}
          transition={logoTransition}
        >
          <motion.div layoutId="logo-text" className="flex flex-col items-center space-y-4">
            <h1 className="text-[42px] font-bold tracking-tight text-center drop-shadow-2xl bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
              微量玄妙
            </h1>
            <div className="flex flex-col items-center space-y-2">
              <p className="text-[#9da1b9] text-[11px] font-mono tracking-widest uppercase text-center opacity-90">
                Powered by FateDiffusion™ Model
              </p>
              <div className="h-px w-12 bg-white/40 my-2"></div>
              <p className="text-gray-300 text-xs font-normal tracking-wide text-center">
                基于扩散算法的生成式命理计算引擎
              </p>
            </div>
          </motion.div>

          {/* Loader - Only visible in Splash state */}
          <AnimatePresence>
            {isSplash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 border-2 border-white/20 rounded-full"></div>
                  <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
                  <div className="absolute w-12 h-12 bg-white/5 rounded-full animate-pulse"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input Form Container - Slides up from bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 w-full z-40"
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: isSplash ? "100%" : "0%",
            opacity: isSplash ? 0 : 1
          }}
          transition={formTransition}
        >
          <div className={`w-full bg-black/10 backdrop-blur-[3px] rounded-t-[2.5rem] border-t border-white/10 p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${shake ? 'animate-shake' : ''}`}>
            <div className="flex flex-col gap-5 max-w-md mx-auto">
              {/* Phone Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-300">
                  <Smartphone size={20} />
                </div>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black/40 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 h-14 pl-12 pr-4 text-base transition-all"
                  placeholder="请输入手机号码"
                />
              </div>

              {/* Email Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-300">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 h-14 pl-12 pr-4 text-base transition-all"
                  placeholder="请输入邮箱地址（用于接收验证码）"
                />
              </div>

              {/* Code */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-300">
                  <Lock size={20} />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 h-14 pl-12 pr-24 text-base transition-all"
                  placeholder="请输入验证码"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05, color: "#fff" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetCode}
                  disabled={countdown > 0}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/90 text-xs font-medium hover:text-white disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                </motion.button>
              </div>

              {/* Invite */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-300">
                  <Ticket size={20} />
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 h-14 pl-12 pr-4 text-base transition-all"
                  placeholder="邀请码 (可选)"
                />
              </div>

              <button
                onClick={handleLoginClick}
                className="mt-4 w-full bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 rounded-2xl h-14 font-bold text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <span>登录 / 注册</span>
                <ArrowRight size={20} />
              </button>

              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={() => setAgreed(!agreed)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${agreed ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-500 text-transparent'}`}
                >
                  <Check size={12} strokeWidth={4} />
                </button>
                <p className="text-gray-400 text-[10px]">
                  登录即同意
                  <span onClick={() => setModalContent('terms')} className="text-blue-300 underline cursor-pointer mx-1">用户协议</span>
                  和
                  <span onClick={() => setModalContent('privacy')} className="text-blue-300 underline cursor-pointer mx-1">隐私政策</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Error Modal for Validation */}
      {/* Custom Error Modal for Validation - Re-implemented with AnimatePresence */}
      <AnimatePresence>
        {
          showCaptcha && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 w-full max-w-xs text-white shadow-2xl"
              >
                <h3 className="font-bold text-lg mb-4 text-center tracking-wide">安全验证</h3>
                <p className="text-gray-400 text-sm mb-6 text-center">请按住滑块，拖动到最右边</p>
                <SliderCaptcha
                  onSuccess={handleCaptchaSuccess}
                  onClose={() => {
                    if (!isCaptchaSending) {
                      setShowCaptcha(false);
                    }
                  }}
                  isLoading={isCaptchaSending}
                />
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence>

      {
        modalContent && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm text-white relative h-[60vh] flex flex-col">
              <button onClick={() => setModalContent(null)} className="absolute top-4 right-4 text-gray-400"><X /></button>
              <h3 className="font-bold text-lg mb-4">{modalContent === 'terms' ? '用户协议' : '隐私政策'}</h3>
              <div className="flex-1 overflow-y-auto text-sm text-gray-400 space-y-4">
                <p>此处为{modalContent === 'terms' ? '用户协议' : '隐私政策'}的详细文本内容...</p>
                <p>1. 本应用尊重并保护所有使用服务用户的个人隐私权。</p>
                <p>2. 为了给您提供更准确、更有个性化的服务，本应用会按照本隐私权政策的规定使用和披露您的个人信息。</p>
              </div>
            </div>
          </div>
        )
      }

      {/* Error Modal - Refined to match Login Box Style & Auto-Close */}
      <AnimatePresence>
        {errorMsg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => setErrorMsg('')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex items-center gap-3 max-w-[260px] w-full cursor-pointer select-none"
              onClick={(e) => {
                setErrorMsg('');
                e.stopPropagation();
              }}
            >
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <X className="w-3 h-3 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-xs mb-0.5">操作失败</h3>
                <p className="text-gray-400 text-sm leading-tight break-words">{errorMsg}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auto-Close Effect (1s) */}
      {errorMsg && <AutoCloseError duration={1000} onClose={() => setErrorMsg('')} />}

      {/* Loading Splash Overlay */}
      <AnimatePresence>
        {showLoadingSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <LoadingSplash />
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}); // End of React.memo

// Helper component for auto-closing
const AutoCloseError = ({ duration, onClose }: { duration: number, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  return null;
};
