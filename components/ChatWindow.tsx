
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Pin, Trash2, UserX, ShieldBan, Flag } from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';

interface ChatWindowProps {
  chat: ChatSession;
  onClose: () => void;
  onSendMessage: (userId: string, text: string) => void;
  onClearHistory: () => void;
  onDeleteChat: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onClose, onSendMessage, onClearHistory, onDeleteChat }) => {
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(chat.userId, inputValue);
    setInputValue('');
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);

    if (action === '置顶') {
      alert('置顶成功');
    } else if (action === '清除') {
      if (window.confirm("确定要清除聊天记录吗？")) {
        onClearHistory();
      }
    } else if (action === '删除好友') {
      if (window.confirm("确定要删除好友并关闭对话吗？")) {
        // Trigger closing animation then delete
        setIsClosing(true);
        setTimeout(() => {
          onDeleteChat();
        }, 300);
      }
    } else if (action === '拉黑') {
      if (window.confirm("确定要拉黑该用户吗？将不再接收对方消息。")) {
        // Same behavior as delete for this demo
        setIsClosing(true);
        setTimeout(() => {
          onDeleteChat();
        }, 300);
      }
    } else if (action === '举报') {
      alert("已举报该用户，感谢您的反馈。");
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] bg-[#F3F4F6] dark:bg-[#050507] flex flex-col transition-transform duration-300 ease-in-out ${isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right'}`}>
      {/* Header */}
      <header className="h-16 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 shadow-sm z-20 relative">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-700 dark:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/10">
              <img src={chat.avatar} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1C1C1E]"></div>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white leading-none">{chat.username}</h2>
            <span className="text-[10px] text-green-500 font-medium">在线</span>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)}></div>
            <div className="absolute top-14 right-4 w-48 bg-white dark:bg-[#252529] rounded-xl shadow-2xl border border-gray-100 dark:border-white/5 py-2 z-40 animate-in fade-in zoom-in-95 origin-top-right">
              {[
                { icon: Pin, label: '消息置顶', action: '置顶' },
                { icon: Trash2, label: '清除聊天记录', action: '清除', color: 'text-red-500' },
                { icon: UserX, label: '删除好友', action: '删除好友', color: 'text-red-500' },
                { icon: ShieldBan, label: '拉黑屏蔽', action: '拉黑', color: 'text-red-500' },
                { icon: Flag, label: '举报用户', action: '举报', color: 'text-red-500' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleMenuAction(item.action)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-colors ${item.color || 'text-gray-700 dark:text-gray-200'}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F3F4F6] dark:bg-[#050507]">
        <div className="text-center text-xs text-gray-400 my-4">
          {chat.timestamp} 建立了连接
        </div>
        {chat.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {!msg.isUser && (
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 self-end mb-1">
                <img src={chat.avatar} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-[0_5px_15px_rgba(202,186,156,0.2),inset_0_0_10px_rgba(255,255,255,0.4)] ${msg.isUser
              ? 'bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white rounded-br-none'
              : 'bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-white/5'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-white/5 pb-8 sm:pb-3 z-20">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 rounded-full px-2 py-1 transition-colors">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="发送消息..."
          />
          <button
            onClick={handleSend}
            className={`p-2 rounded-full transition-all duration-200 ${inputValue.trim() ? 'bg-gradient-to-b from-[#E8D9C5] to-[#CABA9C] ring-2 ring-white/90 ring-inset text-white scale-100 shadow-[0_5px_15px_rgba(202,186,156,0.4),inset_0_0_8px_rgba(255,255,255,0.5)]' : 'bg-gray-300 dark:bg-white/10 text-gray-500 scale-95'}`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
