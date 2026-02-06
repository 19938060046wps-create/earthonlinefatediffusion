
import React, { useState, useEffect } from 'react';
import { Settings, ChevronRight, X, Shield, MapPin, Sparkles } from 'lucide-react';

interface MatchScreenProps {
  hasAgreedPrivacy: boolean;
  setPrivacyAgreement: (agreed: boolean) => void;
  onConnect: (user: { id: string, name: string, avatar: string }) => void;
}

export const MatchScreen = React.memo<MatchScreenProps>(({ hasAgreedPrivacy, setPrivacyAgreement, onConnect }) => {
  const [showPrivacy, setShowPrivacy] = useState(!hasAgreedPrivacy);
  const [showSettings, setShowSettings] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('未知位置');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserCardClosing, setIsUserCardClosing] = useState(false);

  // Settings State
  const [enableResonance, setEnableResonance] = useState(hasAgreedPrivacy);
  const [showTLevel, setShowTLevel] = useState(true);
  const [showLocation, setShowLocation] = useState(false);

  // Particle Diffusion Effect
  const particles = Array.from({ length: 20 });

  useEffect(() => {
    // If not agreed, force disable
    if (!hasAgreedPrivacy) {
      setEnableResonance(false);
    }
  }, [hasAgreedPrivacy]);

  useEffect(() => {
    if (showLocation && enableResonance && hasAgreedPrivacy) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentLocation(`${pos.coords.latitude.toFixed(2)}N, ${pos.coords.longitude.toFixed(2)}E`);
          },
          () => {
            setCurrentLocation("定位失败");
          }
        );
      } else {
        setCurrentLocation("不支持定位");
      }
    } else {
      setCurrentLocation("未知位置");
    }
  }, [showLocation, enableResonance, hasAgreedPrivacy]);

  const toggleResonance = () => {
    if (!enableResonance) {
      if (!hasAgreedPrivacy) {
        setShowPrivacy(true);
        return;
      }
    }
    setEnableResonance(!enableResonance);
  };

  const handleAgree = () => {
    setPrivacyAgreement(true);
    setShowPrivacy(false);
    setEnableResonance(true);
  };

  const handleDisagree = () => {
    setShowPrivacy(false);
    setEnableResonance(false);
  };

  const handleCloseUserCard = () => {
    setIsUserCardClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsUserCardClosing(false);
    }, 300);
  };

  const handleConnect = () => {
    if (selectedUser) {
      onConnect({
        id: selectedUser.id,
        name: `用户 #${selectedUser.id}`,
        avatar: selectedUser.img
      });
      handleCloseUserCard();
      alert("已建立连接，请前往社区铃铛查看消息");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#020617] relative overflow-hidden text-slate-800 dark:text-slate-100 font-sans">

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowComingSoon(false)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 text-center shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset rounded-full flex items-center justify-center mx-auto mb-4 scale-110 shadow-[0_10px_25px_rgba(202,186,156,0.3),inset_0_0_10px_rgba(255,255,255,0.5)]">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">即将上线</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">共鸣功能正在开发中，敬请期待</p>
            <button onClick={() => setShowComingSoon(false)} className="px-8 py-3 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white rounded-xl font-bold shadow-xl shadow-[#CABA9C]/30 active:scale-95 transition-transform">
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-center mb-4 text-primary">
              <Shield size={48} />
            </div>
            <h2 className="text-xl font-bold text-center mb-4">隐私政策</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              在使用共鸣功能前，请您仔细阅读并同意我们的隐私政策。我们将使用您的部分命理数据进行匹配计算，但会严格保护您的个人身份信息不被泄露。
            </p>
            <div className="space-y-3">
              <button
                onClick={handleAgree}
                className="w-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white py-3 rounded-xl font-bold shadow-xl shadow-[#CABA9C]/30 active:scale-95 transition-transform"
              >
                同意并继续
              </button>
              <button
                onClick={handleDisagree}
                className="w-full bg-transparent text-gray-500 py-3 rounded-xl font-medium active:scale-95 transition-transform"
              >
                不同意
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal - Smooth Slide Up/Down */}
      {selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={handleCloseUserCard}>
          <div
            className={`bg-white dark:bg-[#1E293B] w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 pb-32 sm:pb-6 shadow-2xl relative transition-transform duration-300 ease-out ${isUserCardClosing ? 'translate-y-full' : 'translate-y-0 animate-in slide-in-from-bottom'}`}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleCloseUserCard} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

            <div className="flex flex-col items-center -mt-10 mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1E293B] overflow-hidden shadow-lg">
                <img src={selectedUser.img} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold mt-2">用户 #{selectedUser.id}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${selectedUser.color}-500/10 text-${selectedUser.color}-500`}>
                  {selectedUser.match} 匹配
                </span>
                <span className="text-xs text-gray-500">T-Level: {selectedUser.t}</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 mb-6">
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">命理概览</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400">年柱</div>
                  <div className="font-bold text-lg">戊寅</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">月柱</div>
                  <div className="font-bold text-lg">甲子</div>
                </div>
                <div className="opacity-30 blur-[2px]">
                  <div className="text-xs text-gray-400">日柱</div>
                  <div className="font-bold text-lg">??</div>
                </div>
                <div className="opacity-30 blur-[2px]">
                  <div className="text-xs text-gray-400">时柱</div>
                  <div className="font-bold text-lg">??</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span><MapPin size={12} className="inline mr-1" />{selectedUser.loc || "未知位置"}</span>
                <span>能量场: 强</span>
              </div>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-4 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white rounded-2xl font-bold shadow-[0_15px_30px_-5px_rgba(202,186,156,0.5),inset_0_0_12px_rgba(255,255,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Sparkles size={18} />
              建立连接
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-50 w-64 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 animate-in fade-in zoom-in-95 origin-top-right">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-sm">共鸣设置</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">共鸣</span>
              <button
                onClick={toggleResonance}
                className={`w-10 h-6 rounded-full transition-colors relative ${enableResonance ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${enableResonance ? 'translate-x-4' : ''}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">展示 T-Level</span>
              <button
                onClick={() => setShowTLevel(!showTLevel)}
                className={`w-10 h-6 rounded-full transition-colors relative ${showTLevel ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${showTLevel ? 'translate-x-4' : ''}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">展示当前地理位置</span>
              <button
                onClick={() => setShowLocation(!showLocation)}
                className={`w-10 h-6 rounded-full transition-colors relative ${showLocation ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${showLocation ? 'translate-x-4' : ''}`}></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - No Back Button */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4 z-20">
        <h1 className="text-lg font-bold tracking-wide">共鸣</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 -mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition"
        >
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-24 relative z-10 touch-pan-y">
        <div className="relative h-80 w-full flex flex-col items-center justify-center overflow-visible mb-6">
          <div className={`relative w-64 h-64 flex items-center justify-center transition-all duration-1000 ease-in-out ${enableResonance ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20 animate-pulse"></div>
            {particles.map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-amber-500 rounded-full opacity-60"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `orbit ${3 + Math.random() * 5}s linear infinite`,
                  transformOrigin: `${Math.random() * 100 - 50}px ${Math.random() * 100 - 50}px`
                }}
              ></div>
            ))}
            <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-4 border border-gray-500/30 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          </div>

          {!enableResonance && (
            <div className="absolute flex flex-col items-center animate-in fade-in duration-1000">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              <p className="mt-4 text-xs font-mono tracking-widest text-slate-500 uppercase">已停止观察量子纠缠</p>
            </div>
          )}
        </div>

        <div className="px-5 space-y-6 relative z-20">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-sm font-light leading-tight opacity-60 tracking-[0.1em]">
              在命运的宏大叙事中，捕获与您同频的量子震荡
            </h2>
          </div>

          {enableResonance ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">相似度流</span>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <span>实时</span>
                </div>
              </div>

              <div className="space-y-3 touch-pan-y">
                {[
                  { id: '8842', match: '98.4%', t: 'T4', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', color: 'cyan', loc: '上海市' },
                  { id: '219X', match: '92.1%', t: 'T3', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', color: 'indigo', loc: '北京市' },
                  { id: '990A', match: '90.5%', t: 'T5', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop', color: 'slate', loc: '深圳市' },
                ].map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="group relative flex items-center p-4 rounded-2xl bg-white dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    <div className="relative h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <img src={user.img} alt={`User ${user.id}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold truncate">用户 #{user.id}</h3>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold bg-${user.color}-500/10 text-${user.color}-600 border border-${user.color}-500/20`}>
                          {user.match} 匹配
                        </span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 space-x-3">
                        {showTLevel && (
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`}></span>
                            <span className="font-medium tracking-wide">T-Level: <span className="text-slate-700 dark:text-slate-200">{user.t}</span></span>
                          </div>
                        )}
                        <span className="text-slate-300">|</span>
                        {showLocation && (
                          <div className="flex items-center space-x-1">
                            <MapPin size={10} />
                            <span className="font-mono opacity-60 truncate">{currentLocation}</span>
                          </div>
                        )}
                        {!showLocation && <span className="font-mono opacity-60 truncate">位置隐藏</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 ml-3" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}); // End of React.memo
