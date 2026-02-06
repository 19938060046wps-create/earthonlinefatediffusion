
import React, { useState } from 'react';
import { Search, Bell, ThumbsUp, MessageCircle, Share2, MoreHorizontal, Edit3, X, ArrowLeft } from 'lucide-react';
import { ChatSession } from '../types';

interface CommunityScreenProps {
  chats: ChatSession[];
  onOpenChat?: (chatId: string) => void;
}

export const CommunityScreen = React.memo<CommunityScreenProps>(({ chats, onOpenChat }) => {
  const [showFriends, setShowFriends] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);
  const unreadCount = chats.reduce((acc, c) => acc + (c.unread || 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-[#050507] relative overflow-hidden text-gray-900 dark:text-gray-100">

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowComingSoon(false)}>
          <div className="bg-white dark:bg-[#161822] rounded-2xl p-8 text-center shadow-2xl border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_10px_25px_rgba(202,186,156,0.3),inset_0_0_10px_rgba(255,255,255,0.5)]">
              <Edit3 size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">即将上线</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">社区功能正在开发中，敬请期待</p>
            <button onClick={() => setShowComingSoon(false)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Friend List Modal (Replacing Chat List Modal logic) */}
      {showFriends && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={() => setShowFriends(false)}>
          <div className="w-[80%] max-w-sm h-full bg-white dark:bg-[#161822] shadow-2xl p-4 animate-in slide-in-from-right duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">好友列表</h2>
              <button onClick={() => setShowFriends(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {chats.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">暂无好友</div>
              ) : (
                chats.map(chat => (
                  <div key={chat.userId} onClick={() => { setShowFriends(false); onOpenChat?.(chat.userId); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                      <img src={chat.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-sm truncate">{chat.username}</h3>
                        <span className="text-[10px] text-gray-400">{chat.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Search Area */}
      <div className="pt-14 px-5 pb-4 flex items-center justify-between gap-4 z-40 sticky top-0 bg-[#F3F4F6]/95 dark:bg-[#050507]/95 backdrop-blur-sm">
        <div className="flex-1 h-10 bg-white dark:bg-[#161822] rounded-full flex items-center px-4 shadow-sm border border-gray-100 dark:border-white/5">
          <Search size={18} className="text-gray-400" />
          <input className="bg-transparent border-none focus:ring-0 text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 ml-2" placeholder="搜索命理、运势..." type="text" />
        </div>
        <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => setShowFriends(true)}>
          <Bell size={24} className="text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white border border-[#F3F4F6] dark:border-[#050507]">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">能量场 <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wider">Community</span></h1>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {['推荐', '技术探讨', '运势补丁', '案例库', '闲聊'].map((tag, i) => (
            <button key={tag} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium ${i === 0 ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-[#161822] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-24 space-y-4">
        {/* Pinned Post */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-[#1E2030] dark:to-[#161822] rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group cursor-pointer">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center">
              官方置顶
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">v4.2 更新日志</span>
          </div>
          <h2 className="text-lg font-bold mb-2 leading-snug dark:text-white">
            FateDiffusion 引擎 v4.2: 量子纠缠优化已上线
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">
            扩散模型关于因果计算速度的重大更新。引入了针对极端边缘情况的新“虚空”参数，大幅提升推演准确率...
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                <ThumbsUp size={14} /> <span>4.2k</span>
              </div>
              <div className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                <MessageCircle size={14} /> <span>342</span>
              </div>
            </div>
            <span>10分钟前</span>
          </div>
        </div>

        {/* User Post */}
        <div className="bg-white dark:bg-[#161822] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset flex items-center justify-center text-white font-bold text-sm shadow-[0_8px_20px_rgba(202,186,156,0.2),inset_0_0_8px_rgba(255,255,255,0.5)]">
                玄
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm dark:text-gray-200">玄学极客_882</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 text-[10px] font-bold rounded border border-amber-200 dark:border-amber-800">T1级</span>
                </div>
                <div className="text-[10px] text-gray-400">ID: 8829402</div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-200"><MoreHorizontal size={18} /></button>
          </div>
          <h3 className="font-bold text-sm mb-2 dark:text-gray-200">关于 2026 年丙午流年 T1 级专旺格的运势补丁讨论</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            最近在测试服发现，火炎土燥格局在进入丙午年后，算法判定的“燥气”指数有过拟合现象。建议官方引入五行流通的动态权重修正...
          </p>
          <div className="flex gap-2 mb-4">
            <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] rounded-md">#技术探讨</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] rounded-md">#运势补丁</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-white/5 pt-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-pointer"><ThumbsUp size={14} /> <span>128</span></div>
              <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-pointer"><MessageCircle size={14} /> <span>45</span></div>
              <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-pointer"><Share2 size={14} /></div>
            </div>
            <span>2小时前</span>
          </div>
        </div>
      </main>

      <div className="absolute bottom-24 right-5 z-40">
        <button className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white transition-transform active:scale-95">
          <Edit3 size={20} />
        </button>
      </div>
    </div>
  );
}); // End of React.memo
