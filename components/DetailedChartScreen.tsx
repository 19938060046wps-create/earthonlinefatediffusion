
import React, { useState } from 'react';
import { ArrowLeft, Share2, Compass, Zap, QrCode, Gem, Trees, Waves, Flame, Mountain, Download } from 'lucide-react';
import { BaZiChart, getDaYun, analyzeRelationships, HEAVENLY_STEMS, EARTHLY_BRANCHES, getElement } from '../utils/bazi';
import html2canvas from 'html2canvas';

interface DetailedChartScreenProps {
    chart: BaZiChart;
    birthYear: number;
    gender: 'male' | 'female';
    onClose: () => void;
    username?: string;
    avatar?: string;
}

const ElementIcon = ({ char }: { char: string }) => {
    if (char === '?' || !char) return null;
    const el = getElement(char);
    const style = "w-3 h-3 inline-block ml-0.5 mb-0.5";
    switch (el) {
        case 'metal': return <Gem className={`${style} text-[#D4AF37]`} />; // Vibrant Gold
        case 'wood': return <Trees className={`${style} text-green-500`} />;
        case 'water': return <Waves className={`${style} text-blue-500`} />;
        case 'fire': return <Flame className={`${style} text-red-500`} />;
        case 'earth': return <Mountain className={`${style} text-[#8B4513]`} />; // Deep Earth Brown
        default: return null;
    }
}

const ElementText = ({ char, className = "" }: { char: string, className?: string }) => {
    if (char === '?' || !char) return <span className={`text-gray-400 ${className}`}>?</span>;
    const el = getElement(char);
    let colorClass = "";
    switch (el) {
        case 'metal': colorClass = "text-[#D4AF37]"; break; // Vibrant Gold
        case 'wood': colorClass = "text-green-600 dark:text-green-500"; break;
        case 'water': colorClass = "text-blue-600 dark:text-blue-400"; break;
        case 'fire': colorClass = "text-red-600 dark:text-red-500"; break;
        case 'earth': colorClass = "text-[#8B4513] dark:text-[#A0522D]"; break; // Deep Earth Brown
        default: colorClass = "text-gray-700 dark:text-gray-300";
    }
    return <span className={`${colorClass} ${className}`}>{char}</span>;
}

// Helper to get border/bg color based on stem/branch
const getElementColorStyle = (stem: string, branch: string, isSelected: boolean) => {
    const el = getElement(stem);
    if (!isSelected) return 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-600 dark:text-gray-300';

    switch (el) {
        case 'metal': return 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-200';
        case 'wood': return 'bg-green-50 dark:bg-green-500/20 border-green-500 text-green-700 dark:text-green-200';
        case 'water': return 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-200';
        case 'fire': return 'bg-red-50 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-200';
        case 'earth': return 'bg-yellow-50 dark:bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-200';
        default: return 'bg-gray-200 dark:bg-gray-700 border-gray-400 text-gray-800';
    }
};

export const DetailedChartScreen: React.FC<DetailedChartScreenProps> = ({ chart, birthYear, gender, onClose, username, avatar }) => {
    const [selectedDaYunIndex, setSelectedDaYunIndex] = useState<number | null>(null);
    const [selectedLiuNianIndex, setSelectedLiuNianIndex] = useState<number | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleSaveImage = async () => {
        if (!cardRef.current) return;
        try {
            // Give it a tiny moment to ensure everything is rendered
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                backgroundColor: '#ffffff',
                scale: 3,
                logging: false,
                allowTaint: true
            });
            const url = canvas.toDataURL("image/jpeg", 0.95);
            const link = document.createElement('a');
            link.download = `fate_diffusion_${Date.now()}.jpg`;
            link.href = url;
            link.click();
        } catch (err) {
            console.error("Save failed", err);
            alert("保存图片失败，请重试");
        }
    };

    const daYun = getDaYun(chart.year.gan, chart.month.gan, chart.month.zhi, gender, birthYear);
    const currentDaYun = selectedDaYunIndex !== null ? daYun[selectedDaYunIndex] : null;
    const liuNianList = currentDaYun ? Array.from({ length: 10 }, (_, i) => {
        const year = currentDaYun.year + i;
        const offset = year - 1984;
        const gan = HEAVENLY_STEMS[((offset % 10) + 10) % 10];
        const zhi = EARTHLY_BRANCHES[((offset % 12) + 12) % 12];
        return { year, gan, zhi };
    }) : [];

    const currentLiuNian = (selectedLiuNianIndex !== null && liuNianList.length > 0)
        ? liuNianList[selectedLiuNianIndex]
        : null;

    const relationships = analyzeRelationships(
        chart,
        currentDaYun?.gan, currentDaYun?.zhi,
        currentLiuNian?.gan, currentLiuNian?.zhi
    );

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#121212] text-gray-900 dark:text-white flex flex-col font-sans overflow-hidden transition-colors duration-300">
            <header className="px-4 py-4 flex items-center justify-between bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"><ArrowLeft /></button>
                <div className="text-center">
                    <h1 className="text-base font-bold">排盘详情</h1>
                    <p className="text-[10px] text-gray-500">
                        {gender === 'male' ? '乾造' : '坤造'} · {birthYear}年
                    </p>
                </div>
                <button onClick={() => setShowShareModal(true)} className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"><Share2 size={20} /></button>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar">
                {/* Main Chart Table - Using Grid with fixed heights for alignment */}
                <div className="bg-white dark:bg-[#1E1E1E] m-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm dark:shadow-2xl">
                    <div className="grid grid-cols-5 text-center divide-x divide-gray-200 dark:divide-gray-800 text-sm">
                        {/* Left Header Col */}
                        <div className="bg-gray-50 dark:bg-[#252525] flex flex-col items-center py-4 text-gray-500 dark:text-gray-400 text-[10px] font-medium">
                            <div className="h-4 flex items-center">日期</div>
                            <div className="h-4 mt-2 flex items-center">主星</div>
                            <div className="h-8 mt-2 flex items-center">天干</div>
                            <div className="h-8 mt-1 flex items-center">地支</div>
                            <div className="w-4/5 h-px bg-gray-300 dark:bg-gray-700 my-2"></div>
                            <div className="h-[60px] flex items-center">藏干</div>
                            <div className="h-4 mt-2 flex items-center">星运</div>
                            <div className="h-4 mt-1 flex items-center">纳音</div>
                            <div className="h-4 mt-1 flex items-center">神煞</div>
                        </div>

                        {/* Pillars */}
                        {['年柱', '月柱', '日柱', '时柱'].map((title, i) => {
                            const pillar = [chart.year, chart.month, chart.day, chart.hour][i];
                            return (
                                <div key={i} className="flex flex-col items-center py-4 relative">
                                    <div className="h-4 text-gray-500 dark:text-gray-400 text-[10px] flex items-center">{title}</div>

                                    {/* Main Star */}
                                    <div className="h-4 mt-2 text-[10px] text-blue-500 dark:text-blue-400 font-bold flex items-center">{pillar.ganShen}</div>

                                    {/* Gan */}
                                    <div className="h-8 mt-2 flex items-center justify-center">
                                        <span className="text-2xl font-serif font-bold relative">
                                            <ElementText char={pillar.gan} />
                                            <span className="absolute -top-1 -right-3"><ElementIcon char={pillar.gan} /></span>
                                        </span>
                                    </div>
                                    {/* Zhi */}
                                    <div className="h-8 mt-1 flex items-center justify-center">
                                        <span className="text-2xl font-serif font-bold relative">
                                            <ElementText char={pillar.zhi} />
                                            <span className="absolute -top-1 -right-3"><ElementIcon char={pillar.zhi} /></span>
                                        </span>
                                    </div>

                                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                                    {/* Hidden Stems */}
                                    <div className="h-[60px] flex flex-col justify-center gap-0.5">
                                        {pillar.hidden.map((h, idx) => (
                                            <div key={idx} className="flex gap-1 items-center justify-center">
                                                <ElementText char={h} className="text-[10px] font-bold" />
                                                <span className="text-[9px] text-gray-400 scale-90">{pillar.hiddenShen[idx]}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="h-4 mt-2 text-[10px] text-gray-600 dark:text-gray-300 flex items-center">{pillar.xingYun}</div>
                                    <div className="h-4 mt-1 text-[9px] text-gray-500 flex items-center scale-90 whitespace-nowrap">{pillar.naYin}</div>
                                    <div className="h-4 mt-1 text-[9px] text-amber-600 dark:text-amber-500/80 flex items-center scale-90 whitespace-nowrap">
                                        {i === 0 ? '太极' : i === 1 ? '文昌' : i === 2 ? '天乙' : '华盖'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dynamic Section: DaYun & LiuNian - Fix Scroll */}
                <div className="px-4 mb-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        大运流年交互
                    </h3>
                    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                        {/* Da Yun List - Added overflow-x-auto and min-width constraints */}
                        <div className="flex overflow-x-auto pb-4 border-b border-gray-100 dark:border-gray-800 gap-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                            {daYun.map((dy, idx) => {
                                const styleClass = getElementColorStyle(dy.gan, dy.zhi, selectedDaYunIndex === idx);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => { setSelectedDaYunIndex(idx); setSelectedLiuNianIndex(null); }}
                                        className={`flex-shrink-0 flex flex-col items-center min-w-[56px] p-2 rounded-lg transition-all cursor-pointer border ${styleClass}`}
                                    >
                                        <span className="text-sm font-bold">
                                            {selectedDaYunIndex === idx ? <><ElementText char={dy.gan} /><ElementText char={dy.zhi} /></> : `${dy.gan}${dy.zhi}`}
                                        </span>
                                        <span className="text-[10px] opacity-70">{dy.age}岁</span>
                                        {dy.isXiaoYun && <span className="text-[9px] bg-gray-200 dark:bg-gray-700 px-1 rounded mt-1 text-gray-500">小运</span>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Liu Nian List */}
                        {currentDaYun && !currentDaYun.isXiaoYun && (
                            <div className="flex overflow-x-auto gap-2 mt-4 pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                                {liuNianList.map((ln, idx) => {
                                    const styleClass = getElementColorStyle(ln.gan, ln.zhi, selectedLiuNianIndex === idx);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedLiuNianIndex(idx)}
                                            className={`flex-shrink-0 flex flex-col items-center min-w-[48px] p-1.5 rounded-lg transition-all cursor-pointer border ${styleClass}`}
                                        >
                                            <span className="text-xs font-bold">
                                                {selectedLiuNianIndex === idx ? <><ElementText char={ln.gan} /><ElementText char={ln.zhi} /></> : `${ln.gan}${ln.zhi}`}
                                            </span>
                                            <span className="text-[9px] opacity-70">{ln.year}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Smart Analysis Output */}
                <div className="px-4 pb-24">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-[#121212] rounded-xl border border-amber-500/30 p-5 relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 right-0 p-2 opacity-10"><Compass size={64} /></div>
                        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-2">智能干支图示</h3>

                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            {currentDaYun ? `当前大运: ${currentDaYun.gan}${currentDaYun.zhi}` : '原局分析'}
                            {currentLiuNian ? ` · 流年: ${currentLiuNian.year} ${currentLiuNian.gan}${currentLiuNian.zhi}` : ''}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">天干作用 (Heavenly Stems)</span>
                                <div className="flex flex-wrap gap-2">
                                    {relationships.stems.length > 0 ? relationships.stems.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs rounded-md shadow-sm">{s}</span>
                                    )) : <span className="text-xs text-gray-500">无明显作用</span>}
                                </div>
                            </div>
                            <div className="h-px bg-gray-300 dark:bg-white/5 w-full"></div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">地支作用 (Earthly Branches)</span>
                                <div className="flex flex-wrap gap-2">
                                    {relationships.branches.length > 0 ? relationships.branches.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs rounded-md shadow-sm">{s}</span>
                                    )) : <span className="text-xs text-gray-500">无明显作用</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white text-black w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div ref={cardRef}>
                            <div className="bg-[#1E1E1E] text-white p-6 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20"></div>
                                <div className="relative z-10">
                                    <h2 className="font-serif text-2xl font-bold mb-1">微量玄妙</h2>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">FateDiffusion AI</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-md">
                                            {avatar ? <img src={avatar} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">头像</div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{username || 'User_89757'}</div>
                                        </div>
                                    </div>
                                    <div className="text-gray-400 font-bold text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        {gender === 'male' ? '乾造' : '坤造'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] text-gray-400 mb-1">年</div>
                                        <div className="font-bold text-xl flex flex-col leading-tight">
                                            <ElementText char={chart.year.gan} />
                                            <ElementText char={chart.year.zhi} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] text-gray-400 mb-1">月</div>
                                        <div className="font-bold text-xl flex flex-col leading-tight">
                                            <ElementText char={chart.month.gan} />
                                            <ElementText char={chart.month.zhi} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] text-gray-400 mb-1">日</div>
                                        <div className="font-bold text-xl flex flex-col leading-tight">
                                            <ElementText char={chart.day.gan} />
                                            <ElementText char={chart.day.zhi} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] text-gray-400 mb-1">时</div>
                                        <div className="font-bold text-xl flex flex-col leading-tight">
                                            <ElementText char={chart.hour.gan} />
                                            <ElementText char={chart.hour.zhi} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div className="text-[10px] text-gray-400 w-2/3">
                                        长按保存图片分享<br />扫描右侧二维码下载 App
                                    </div>
                                    <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1 shadow-sm">
                                        <QrCode size={48} className="text-black" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSaveImage} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                            <Download size={16} /> 保存图片
                        </button>
                        <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-gray-100 font-bold text-sm text-gray-600">关闭</button>
                    </div>
                </div>
            )}
        </div>
    );
};
