
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, UserState, HistoryItem, ChatSession, ChatMessage } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ConsoleScreen } from './components/ConsoleScreen';
import { MatchScreen } from './components/MatchScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { Navigation } from './components/Navigation';
import { ChatWindow } from './components/ChatWindow';
import { UserResponse, getAccessToken, logout as apiLogout, getCurrentUser, recharge as apiRecharge, getUserDetails } from './utils/api';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // App Loading State - Default true to show Splash
  const [isLoading, setIsLoading] = useState(true);

  // State to hold history data when navigating from Profile -> Console
  const [consoleHistoryContext, setConsoleHistoryContext] = useState<HistoryItem | null>(null);

  // Global User State
  const [user, setUser] = useState<UserState>({
    isLoggedIn: false,
    phone: '',
    uid: '',
    username: 'User_89757',
    avatar: null,
    balance: 88,
    history: [],
    hasAgreedPrivacy: false,
    chats: [],
    theme: 'light' // Default light
  });

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (user.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // WeChat / H5 Compat
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('micromessenger')) {
      document.body.classList.add('is-wechat');
    }
  }, [user.theme]);

  // 尝试恢复登录状态 (Auth Check)
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(prev => ({
            ...prev,
            isLoggedIn: true,
            id: userData.id, // Ensure raw ID is stored
            phone: userData.phone,
            uid: userData.uid ? String(userData.uid).padStart(3, '0') : userData.id.slice(0, 8),
            username: userData.username,
            avatar: userData.avatar_url,
            balance: userData.balance,
            hasAgreedPrivacy: userData.has_agreed_privacy,
            theme: userData.theme as 'dark' | 'light'
          }));
          setCurrentScreen(Screen.CONSOLE);
        } catch (error) {
          apiLogout();
        }
      }

      // Delay slightly to let the splash animation play out comfortably or ensuring smoothness
      setTimeout(() => {
        setIsLoading(false);
      }, 1500); // 1.5s total splash time for premium feel
    };

    initAuth();
  }, []);

  // 余额实时同步机制：当用户登录后，每 15 秒自动刷新一次余额，以同步后台的手动修改或支付结果
  useEffect(() => {
    let intervalId: any;

    if (user.isLoggedIn) {
      intervalId = setInterval(() => {
        getCurrentUser()
          .then((userData) => {
            setUser(prev => {
              // 只有当余额确实发生变化时才更新状态，避免不必要的重渲染
              if (prev.balance !== userData.balance) {
                return { ...prev, balance: userData.balance };
              }
              return prev;
            });
          })
          .catch((err) => {
            console.warn('自动同步余额失败:', err);
          });
      }, 15000); // 15秒刷新一次
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user.isLoggedIn]);

  // Background Data Fetching (Avatar, History, etc.)
  // This runs AFTER login/initial load to avoid blocking UI
  useEffect(() => {
    if (user.isLoggedIn) {
      // 1. Fetch full user details (Avatar)
      getUserDetails()
        .then(details => {
          setUser(prev => ({
            ...prev,
            avatar: details.avatar_url, // Update with real avatar
            // Update other fields if necessary
          }));
        })
        .catch(err => console.warn('后台加载用户详情失败:', err));

      // 2. Fetch History (if needed later)
      // fetchHistory()...
    }
  }, [user.isLoggedIn]);

  const handleLogin = (userData: UserResponse) => {
    setUser(prev => ({
      ...prev,
      isLoggedIn: true,
      id: userData.id, // Ensure raw ID is stored
      phone: userData.phone,
      uid: userData.uid ? String(userData.uid).padStart(3, '0') : userData.id.slice(0, 8),
      username: userData.username,
      avatar: userData.avatar_url,
      balance: userData.balance,
      hasAgreedPrivacy: userData.has_agreed_privacy,
      theme: userData.theme as 'dark' | 'light'
    }));
    setCurrentScreen(Screen.CONSOLE);
  };

  const handleLogout = () => {
    apiLogout(); // 清除本地令牌
    setUser(prev => ({ ...prev, isLoggedIn: false }));
    setCurrentScreen(Screen.LOGIN);
  };

  const handleNavigate = (screen: Screen) => {
    if (screen === currentScreen) return;
    // Clear history context when manually navigating to Console via tab (reset to blank)
    if (screen === Screen.CONSOLE) {
      setConsoleHistoryContext(null);
    }
    setCurrentScreen(screen);
  };

  const handleLoadHistoryToConsole = (item: HistoryItem) => {
    setConsoleHistoryContext(item);
    setCurrentScreen(Screen.CONSOLE);
  };

  // State Updaters
  const updateBalance = async (amount: number) => {
    // 先更新本地状态（乐观更新）
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));

    // 同步到后端数据库
    try {
      const updatedUser = await apiRecharge(amount);
      // 用后端返回的实际余额更新
      setUser(prev => ({ ...prev, balance: updatedUser.balance }));
    } catch (error) {
      console.error('充值同步失败:', error);
      // 回滚本地状态
      setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    }
  };

  const updateUserProfile = (name: string, avatar: string | null) => {
    setUser(prev => ({ ...prev, username: name, avatar: avatar }));
  };

  // 直接设置余额（不调用后端 API，用于后端已经扣款的情况）
  const setBalanceDirectly = (newBalance: number) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const setPrivacyAgreement = (agreed: boolean) => {
    setUser(prev => ({ ...prev, hasAgreedPrivacy: agreed }));
  };

  const addHistory = (item: HistoryItem) => {
    setUser(prev => ({ ...prev, history: [item, ...prev.history] }));
  };

  // Used by ConsoleScreen to save chat logs back to the history item in real-time
  const updateHistoryChat = (historyId: string, newMessages: ChatMessage[]) => {
    setUser(prev => ({
      ...prev,
      history: prev.history.map(item =>
        item.id === historyId
          ? { ...item, chatLog: newMessages }
          : item
      )
    }));
  };

  const toggleTheme = () => {
    setUser(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const connectUser = (targetUser: { id: string, name: string, avatar: string }) => {
    let existingChat = user.chats.find(c => c.userId === targetUser.id);
    if (!existingChat) {
      existingChat = {
        userId: targetUser.id,
        username: targetUser.name,
        avatar: targetUser.avatar,
        lastMessage: '👋 我们好像很有缘，交个朋友吧！',
        timestamp: '刚刚',
        unread: 0,
        messages: [{ id: Date.now(), text: '👋 我们好像很有缘，交个朋友吧！', isUser: true, timestamp: Date.now() }]
      };
      setUser(prev => ({ ...prev, chats: [existingChat!, ...prev.chats] }));
    }
    setActiveChatId(targetUser.id);
  };

  const openChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleSendMessage = (userId: string, text: string) => {
    setUser(prev => ({
      ...prev,
      chats: prev.chats.map(c => {
        if (c.userId === userId) {
          return {
            ...c,
            lastMessage: text,
            timestamp: '刚刚',
            messages: [...c.messages, { id: Date.now(), text, isUser: true, timestamp: Date.now() }]
          };
        }
        return c;
      })
    }));
  };

  const handleClearHistory = (userId: string) => {
    setUser(prev => ({
      ...prev,
      chats: prev.chats.map(c => c.userId === userId ? { ...c, messages: [] } : c)
    }));
  };

  const handleDeleteChat = (userId: string) => {
    setUser(prev => ({
      ...prev,
      chats: prev.chats.filter(c => c.userId !== userId)
    }));
    setActiveChatId(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.LOGIN:
        // Use isLoading to determine mode: 'splash' or 'input'
        // This allows the same component to transition smoothly from splash to input
        return <LoginScreen onLogin={handleLogin} mode={isLoading ? 'splash' : 'input'} />;
      case Screen.CONSOLE:
        return (
          <ConsoleScreen
            setFullScreen={setIsFullScreen}
            balance={user.balance}
            deductBalance={(amount) => updateBalance(-amount)}
            setBalanceDirectly={setBalanceDirectly}
            onRecharge={updateBalance}
            // Add extra fields to history item so we can restore it later
            onAnalysisComplete={(title, chartData, msgs, birthDetails) => addHistory({
              id: Date.now().toString(),
              title,
              date: new Date().toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
              tLevel: 'T' + Math.floor(Math.random() * 5 + 1),
              chartData,
              chatLog: msgs,
              ...birthDetails // Store birth info
            })}
            userGender={user.username.includes('女') ? 'female' : 'male'}
            initialHistoryContext={consoleHistoryContext} // Pass history context
            onUpdateHistoryChat={updateHistoryChat} // Allow console to update history
            onBackToProfile={() => {
              setConsoleHistoryContext(null);
              setCurrentScreen(Screen.PROFILE);
            }}
            username={user.username}
            avatar={user.avatar}
            onLogout={handleLogout}
          />
        );
      case Screen.MATCH:
        return (
          <MatchScreen
            hasAgreedPrivacy={user.hasAgreedPrivacy}
            setPrivacyAgreement={setPrivacyAgreement}
            onConnect={connectUser}
          />
        );
      case Screen.COMMUNITY:
        return <CommunityScreen chats={user.chats} onOpenChat={openChat} />;
      case Screen.PROFILE:
        return (
          <ProfileScreen
            user={user}
            onRecharge={updateBalance}
            onUpdateProfile={updateUserProfile}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onLoadHistory={handleLoadHistoryToConsole}
          />
        );
      default:
        return <ConsoleScreen setFullScreen={setIsFullScreen} balance={user.balance} deductBalance={() => { }} onRecharge={() => { }} onAnalysisComplete={() => { }} />;
    }
  };

  const activeChatSession = user.chats.find(c => c.userId === activeChatId);
  const themeClass = currentScreen === Screen.LOGIN ? user.theme : '';

  // Page Transition Variants
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    enter: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }, // iOS-like springy ease
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3, ease: [0.42, 0, 1, 1] as const } }
  };

  return (
    <div className={`${themeClass} w-full h-full`}>
      <div className="w-full h-screen bg-white dark:bg-[#050507] text-gray-900 dark:text-white overflow-hidden relative font-sans">

        {/* Main Content Area with Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="w-full h-full absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        {/* Full Screen Chat Overlay */}
        {activeChatSession && (
          <ChatWindow
            chat={activeChatSession}
            onClose={() => setActiveChatId(null)}
            onSendMessage={handleSendMessage}
            onClearHistory={() => handleClearHistory(activeChatSession.userId)}
            onDeleteChat={() => handleDeleteChat(activeChatSession.userId)}
          />
        )}

        {!isFullScreen && !activeChatSession && (
          <Navigation currentScreen={currentScreen} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
};

export default App;
