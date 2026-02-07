import React, { useState, useRef } from 'react';
import { ArrowRight, Check, X, Loader2 } from 'lucide-react';

interface SliderCaptchaProps {
    onSuccess: () => void;
    onClose: () => void;
    isLoading?: boolean;
}

/**
 * 滑块验证组件
 * 用户需要将滑块拖动到右边以完成验证
 */
export const SliderCaptcha: React.FC<SliderCaptchaProps> = ({ onSuccess, onClose, isLoading = false }) => {
    const [sliderPosition, setSliderPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const THRESHOLD = 90; // 需要拖动到 90% 才算成功
    const SLIDER_WIDTH = 48; // 滑块宽度 px

    const handleStart = (clientX: number) => {
        if (isSuccess) return;
        setIsDragging(true);
        setIsFailed(false);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging || isSuccess || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const maxPosition = rect.width - SLIDER_WIDTH;
        const newPosition = Math.max(0, Math.min(clientX - rect.left - SLIDER_WIDTH / 2, maxPosition));
        const percentage = (newPosition / maxPosition) * 100;

        setSliderPosition(percentage);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (sliderPosition >= THRESHOLD) {
            // 验证成功
            setIsSuccess(true);
            setSliderPosition(100);
            setTimeout(() => {
                onSuccess();
            }, 0);
        } else {
            // 验证失败，回弹
            setIsFailed(true);
            setSliderPosition(0);
            setTimeout(() => setIsFailed(false), 300);
        }
    };

    // 鼠标事件
    const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    // 触摸事件
    const handleTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleEnd();

    React.useEffect(() => {
        const preventScroll = (e: TouchEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleMove(e.touches[0].clientX);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Use { passive: false } to allow preventing default
            window.addEventListener('touchmove', preventScroll, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, sliderPosition]);

    const getTrackColor = () => {
        if (isSuccess) return 'bg-white/50';
        if (isFailed) return 'bg-red-500/50';
        return 'bg-white/20';
    };

    const getSliderColor = () => {
        if (isSuccess) return 'bg-white';
        if (isFailed) return 'bg-red-500';
        return 'bg-white';
    };

    return (
        <div className="space-y-4">
            {/* 滑动轨道 */}
            <div
                ref={containerRef}
                className={`relative h-12 bg-black/40 border border-white/10 rounded-full select-none ${isFailed ? 'animate-shake' : ''}`}
                style={{
                    '--slider-p': sliderPosition / 100,
                    touchAction: 'none' // Prevent browser handling of gestures
                } as React.CSSProperties}
            >
                {/* 已滑动区域 (Track) */}
                {/* 
                   Logic:
                   Track starts at left: 4px (padding).
                   Track end follows the handle center or right edge?
                   Usually the colored area should fill up to the handle.
                   - Handle is 40px (w-10).
                   - Handle starts at `4px + (100% - 48px) * P`.
                   - Handle Visual Right Edge = Handle Left + 40px.
                   - Track starts at 4px.
                   - Track Width should be `Handle Right - 4px`.
                   - `(4px + (100% - 48px) * P + 40px) - 4px` = `40px + (100% - 48px) * P`.
                   - Matches exactly.
                 */}
                <div
                    className={`absolute top-1 bottom-1 left-1 ${getTrackColor()} rounded-full transition-colors duration-200 opacity-80`}
                    style={{
                        // Using CSS calc with variable for strict sync
                        width: `calc(40px + (100% - 48px) * var(--slider-p))`
                    }}
                />

                {/* 提示文字 */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium pointer-events-none transition-opacity duration-300" style={{ opacity: isDragging || isSuccess ? 0 : 1 }}>
                    {isSuccess ? '验证成功' : '向右滑动完成验证'}
                </div>

                {/* 滑块 (Handle) */}
                <div
                    // Removed 'transition-all' to ensure the handle moves instantly with the track/variable
                    className={`absolute top-1 bottom-1 w-12 ${getSliderColor()} rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-grab active:cursor-grabbing flex items-center justify-center border border-white/20 ${isSuccess ? 'text-white' : 'text-black'} z-10`}
                    style={{
                        // Exactly same movement logic as Track's extra width
                        left: `calc(4px + (100% - 56px) * var(--slider-p))`,
                        transform: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    {isSuccess ? (
                        isLoading ? <Loader2 size={20} className="animate-spin text-gray-500" /> : <Check size={20} className="text-gray-500" />
                    ) : (
                        <ArrowRight size={20} />
                    )}
                </div>
            </div>

            {/* 取消按钮 */}
            <button
                onClick={onClose}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
                取消
            </button>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default SliderCaptcha;
