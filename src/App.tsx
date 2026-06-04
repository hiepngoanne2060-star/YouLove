import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Calendar, 
  Edit3, 
  Camera, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Trash2, 
  Plus, 
  X, 
  Info, 
  RotateCw, 
  Sliders, 
  Smile, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Shield,
  Loader2
} from 'lucide-react';
import { CoupleUtils } from './utils/CoupleUtils';
import { MenstrualUtils, MenstrualCycle, DayStatus, DayStatusTranslation } from './utils/MenstrualUtils';
import { GeminiService, GeminiAnalysisResult } from './utils/GeminiService';

// Interfaces for local React profiles matching Kotlin entity structures
interface CoupleProfile {
  id: number;
  maleName: string;
  femaleName: string;
  maleBirthday: string;
  femaleBirthday: string;
  maleAvatar: string | null; // base64 representation
  femaleAvatar: string | null; // base64 representation
  maleZodiac: string;
  femaleZodiac: string;
  loveDate: string;
  backgroundImage: string | null; // preset or base64 representation
  maleScale: number;
  maleOffsetX: number;
  maleOffsetY: number;
  femaleScale: number;
  femaleOffsetX: number;
  femaleOffsetY: number;
  bgScale: number;
  bgOffsetX: number;
  bgOffsetY: number;
  bgRotation: number;
}

// Default states mirroring Kotlin seeds
const INITIAL_PROFILE: CoupleProfile = {
  id: 1,
  maleName: "Bạn Nam",
  femaleName: "Bạn Nữ",
  maleBirthday: "2000-01-01",
  femaleBirthday: "2000-01-01",
  maleAvatar: null,
  femaleAvatar: null,
  maleZodiac: "Ma Kết",
  femaleZodiac: "Ma Kết",
  loveDate: "2026-01-01",
  backgroundImage: "preset_3",
  maleScale: 1.0,
  maleOffsetX: 0,
  maleOffsetY: 0,
  femaleScale: 1.0,
  femaleOffsetX: 0,
  femaleOffsetY: 0,
  bgScale: 1.0,
  bgOffsetX: 0,
  bgOffsetY: 0,
  bgRotation: 0
};

const INITIAL_CYCLES: MenstrualCycle[] = [
  {
    id: 1,
    startDate: "2026-06-01",
    cycleLength: 28,
    periodLength: 5,
    lhTestResult: "Không có",
    bbt: 36.6,
    cervicalMucus: "Bình thường"
  }
];

export default function App() {
  // -------------------------------------------------------------
  // STATES
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'love' | 'menstrual'>('love');
  const [profile, setProfile] = useState<CoupleProfile>(() => {
    const saved = localStorage.getItem('youlove_couple_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });
  const [cycles, setCycles] = useState<MenstrualCycle[]>(() => {
    const saved = localStorage.getItem('youlove_menstrual_cycles');
    return saved ? JSON.parse(saved) : INITIAL_CYCLES;
  });

  // Current system clock updating
  const [currentTime, setCurrentTime] = useState<string>('');

  // Dialog / Popup visibility
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false); // edit scale/offsets
  const [showMilestonesDialog, setShowMilestonesDialog] = useState(false);
  const [showLogCycleDialog, setShowLogCycleDialog] = useState(false);
  
  // States inside Edit Profile Dialog
  const [editMaleName, setEditMaleName] = useState('');
  const [editFemaleName, setEditFemaleName] = useState('');
  const [editMaleBirth, setEditMaleBirth] = useState('');
  const [editFemaleBirth, setEditFemaleBirth] = useState('');
  const [editLoveDate, setEditLoveDate] = useState('');
  
  // Calendar variables
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [calendarMode, setCalendarMode] = useState<'month' | 'year'>('month');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Cycle Logging fields
  const [logId, setLogId] = useState<number | null>(null);
  const [logStartDate, setLogStartDate] = useState('');
  const [logCycleLength, setLogCycleLength] = useState(28);
  const [logPeriodLength, setLogPeriodLength] = useState(5);
  const [logLhTest, setLogLhTest] = useState('Không có');
  const [logBbt, setLogBbt] = useState<number | string>('36.6');
  const [logMucus, setLogMucus] = useState('Bình thường');
  const [logError, setLogError] = useState<string | null>(null);

  // Gemini AI prediction integration state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgressText, setAiProgressText] = useState('');
  const [aiResult, setAiResult] = useState<GeminiAnalysisResult | null>(() => {
    const saved = localStorage.getItem('youlove_ai_result');
    return saved ? JSON.parse(saved) : null;
  });

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem('youlove_couple_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('youlove_menstrual_cycles', JSON.stringify(cycles));
    // Clear outdated selected date to refresh details
    setSelectedCalendarDate(null);
  }, [cycles]);

  useEffect(() => {
    if (aiResult) {
      localStorage.setItem('youlove_ai_result', JSON.stringify(aiResult));
    } else {
      localStorage.removeItem('youlove_ai_result');
    }
  }, [aiResult]);

  // Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync edit states on edit triggers
  const openEditProfile = () => {
    setEditMaleName(profile.maleName);
    setEditFemaleName(profile.femaleName);
    setEditMaleBirth(profile.maleBirthday);
    setEditFemaleBirth(profile.femaleBirthday);
    setEditLoveDate(profile.loveDate);
    setShowEditProfileDialog(true);
  };

  const handleSaveProfile = () => {
    const mZ = CoupleUtils.getZodiacSign(editMaleBirth);
    const fZ = CoupleUtils.getZodiacSign(editFemaleBirth);
    setProfile(prev => ({
      ...prev,
      maleName: editMaleName || "Bạn Nam",
      femaleName: editFemaleName || "Bạn Nữ",
      maleBirthday: editMaleBirth || "2000-01-01",
      femaleBirthday: editFemaleBirth || "2000-01-01",
      loveDate: editLoveDate || "2026-01-01",
      maleZodiac: mZ,
      femaleZodiac: fZ
    }));
    setShowEditProfileDialog(false);
  };

  // -------------------------------------------------------------
  // CALCULATIONS / DERIVED VALUES
  // -------------------------------------------------------------
  const loveDays = useMemo(() => {
    return CoupleUtils.countLoveDays(profile.loveDate);
  }, [profile.loveDate]);

  const loveBreakdown = useMemo(() => {
    return CoupleUtils.getLoveBreakdown(profile.loveDate);
  }, [profile.loveDate]);

  const maleAge = useMemo(() => CoupleUtils.calculateAge(profile.maleBirthday), [profile.maleBirthday]);
  const femaleAge = useMemo(() => CoupleUtils.calculateAge(profile.femaleBirthday), [profile.femaleBirthday]);

  const maleNextBirthdayCountdown = useMemo(() => {
    return CoupleUtils.daysToNextBirthday(profile.maleBirthday);
  }, [profile.maleBirthday]);

  const femaleNextBirthdayCountdown = useMemo(() => {
    return CoupleUtils.daysToNextBirthday(profile.femaleBirthday);
  }, [profile.femaleBirthday]);

  // Generate background style gradient / file
  const backgroundStyle = useMemo(() => {
    const bg = profile.backgroundImage;
    if (!bg) {
      // default peach pastel
      return { background: 'linear-gradient(135deg, #FF8DA1, #FFB5C5, #FFE5EC)' };
    }
    if (bg === 'preset_1') {
      return { background: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' };
    }
    if (bg === 'preset_2') {
      return { background: 'linear-gradient(135deg, #FF9966, #FF5E62)' };
    }
    if (bg === 'preset_3') {
      return { background: 'linear-gradient(135deg, #CDB4DB, #FFC8DD, #FFA2B6)' };
    }
    // Base64 configuration with custom cropping offsets
    return {
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transform: `scale(${profile.bgScale}) translate(${profile.bgOffsetX}px, ${profile.bgOffsetY}px) rotate(${profile.bgRotation}deg)`,
      transformOrigin: 'center center'
    };
  }, [profile.backgroundImage, profile.bgScale, profile.bgOffsetX, profile.bgOffsetY, profile.bgRotation]);

  // Menstrual cycle calendars and analytics
  const menstrualStats = useMemo(() => {
    return MenstrualUtils.calculateMenstrualFormula(cycles);
  }, [cycles]);

  const cycleMap = useMemo(() => {
    return MenstrualUtils.getCombinedCycleEvents(cycles, 24);
  }, [cycles]);

  // Dynamic status of today's menstrual cycle
  const currentCycleStatus = useMemo(() => {
    if (cycles.length === 0) return { title: 'Bình thường', description: 'Chưa có dữ liệu chu kỳ' };
    const todayStr = CoupleUtils.formatDate(new Date());
    const status = cycleMap[todayStr] || 'NONE';

    if (status === 'PERIOD') {
      return {
        title: 'Đang trong kỳ kinh',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        description: 'Uống nhiều nước ấm, chườm ấm và nghỉ ngơi nhé ❤️'
      };
    }
    if (status === 'UPCOMING') {
      return {
        title: 'Kỳ kinh dự kiến cận kề',
        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        description: 'Hãy chuẩn bị sẵn đồ dùng cá nhân cần thiết nhé'
      };
    }
    if (status === 'FERTILE') {
      return {
        title: 'Cửa sổ thụ thai (Màu mỡ)',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        description: 'Thời điểm khả năng thụ thai tự nhiên cao'
      };
    }
    if (status === 'OVULATION') {
      return {
        title: 'Ngày rụng trứng rực rỡ',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        description: 'Khả năng thụ thai đạt đỉnh điểm hôm nay ✨'
      };
    }
    if (status === 'SAFE') {
      return {
        title: 'Ngày an toàn tự nhiên',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        description: 'Thời điểm tránh thai tự nhiên tương đối tốt'
      };
    }
    return {
      title: 'Trạng thái bình ổn',
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      description: 'Chỉ số sức khỏe đang ở mức bình thường'
    };
  }, [cycles, cycleMap]);

  // Computes the timeline milestones chronologically
  const calculatedMilestones = useMemo(() => {
    const list: Array<{ title: string; date: Date; daysRemaining: number; dateStr: string }> = [];
    const love = CoupleUtils.parseDate(profile.loveDate) || new Date();
    const maleBirth = CoupleUtils.parseDate(profile.maleBirthday) || new Date(2000, 0, 1);
    const femaleBirth = CoupleUtils.parseDate(profile.femaleBirthday) || new Date(2000, 0, 1);
    const today = new Date();
    today.setHours(0,0,0,0);

    // Standard days milestone
    const milestonesDays = [100, 200, 300, 500, 1000, 1500, 2000, 3000];
    milestonesDays.forEach(days => {
      const target = new Date(love);
      target.setDate(target.getDate() + days);
      const diffTime = target.getTime() - today.getTime();
      const diff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      list.push({
        title: `${days} Ngày Bên Nhau ❤️`,
        date: target,
        daysRemaining: diff,
        dateStr: CoupleUtils.formatDate(target)
      });
    });

    // Standard years milestones
    const milestoneYears = [1, 2, 3, 5, 7, 10, 15];
    milestoneYears.forEach(yr => {
      const target = new Date(love);
      target.setFullYear(target.getFullYear() + yr);
      const diffTime = target.getTime() - today.getTime();
      const diff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      list.push({
        title: `${yr} Năm Kỷ Niệm Ngày Yêu 💍`,
        date: target,
        daysRemaining: diff,
        dateStr: CoupleUtils.formatDate(target)
      });
    });

    // Birthday count
    let nextMale = new Date(today.getFullYear(), maleBirth.getMonth(), maleBirth.getDate());
    if (nextMale < today) nextMale.setFullYear(today.getFullYear() + 1);
    const maleDiff = Math.ceil((nextMale.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    list.push({
      title: `Sinh nhật ${profile.maleName} 🎉`,
      date: nextMale,
      daysRemaining: maleDiff,
      dateStr: CoupleUtils.formatDate(nextMale)
    });

    let nextFemale = new Date(today.getFullYear(), femaleBirth.getMonth(), femaleBirth.getDate());
    if (nextFemale < today) nextFemale.setFullYear(today.getFullYear() + 1);
    const femaleDiff = Math.ceil((nextFemale.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    list.push({
      title: `Sinh nhật ${profile.femaleName} 🎂`,
      date: nextFemale,
      daysRemaining: femaleDiff,
      dateStr: CoupleUtils.formatDate(nextFemale)
    });

    // Sort chronologically
    return list.sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [profile]);

  // Find nearest upcoming milestone
  const nearestMilestoneIndex = useMemo(() => {
    return calculatedMilestones.findIndex(m => m.daysRemaining >= 0);
  }, [calculatedMilestones]);

  // Handle avatar & background image uploads
  const handleUploadFile = (field: 'maleAvatar' | 'femaleAvatar' | 'backgroundImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Hình ảnh quá dung lượng lớn hơn 2MB. Vui lòng chọn ảnh nhẹ hơn để lưu giữ được tốt.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // MENSTRUAL ACTIONS
  // -------------------------------------------------------------
  const openLogCycle = (existing?: MenstrualCycle) => {
    if (existing) {
      setLogId(existing.id || null);
      setLogStartDate(existing.startDate);
      setLogCycleLength(existing.cycleLength);
      setLogPeriodLength(existing.periodLength);
      setLogLhTest(existing.lhTestResult || 'Không có');
      setLogBbt(existing.bbt || '36.6');
      setLogMucus(existing.cervicalMucus || 'Bình thường');
    } else {
      setLogId(null);
      // Auto prefill today
      setLogStartDate(CoupleUtils.formatDate(new Date()));
      setLogCycleLength(28);
      setLogPeriodLength(5);
      setLogLhTest('Không có');
      setLogBbt('36.6');
      setLogMucus('Bình thường');
    }
    setLogError(null);
    setShowLogCycleDialog(true);
  };

  const handleSaveCycle = () => {
    if (!logStartDate) {
      setLogError("Ngày bắt đầu không được bỏ trống.");
      return;
    }
    const parsed = CoupleUtils.parseDate(logStartDate);
    if (!parsed) {
      setLogError("Phần định dạng ngày không phù hợp.");
      return;
    }
    if (parsed > new Date()) {
      setLogError("Không cho phép ghi nhận ngày tương lai.");
      return;
    }
    if (logCycleLength < 21 || logCycleLength > 40) {
      setLogError("Độ chu kỳ bình thường phải dao động từ 21 tới 40 ngày.");
      return;
    }
    if (logPeriodLength < 2 || logPeriodLength > 10) {
      setLogError("Kỳ hành kinh lý tưởng nên nằm trong tầm 2 đến 10 ngày.");
      return;
    }

    const item: MenstrualCycle = {
      id: logId || Date.now(),
      startDate: logStartDate,
      cycleLength: logCycleLength,
      periodLength: logPeriodLength,
      lhTestResult: logLhTest,
      bbt: isNaN(Number(logBbt)) ? null : Number(logBbt),
      cervicalMucus: logMucus
    };

    setCycles(prev => {
      if (logId) {
        // Edit mode
        return prev.map(c => c.id === logId ? item : c);
      } else {
        // Add mode
        // Remove default seed if user logs custom list
        let list = [...prev];
        if (list.length === 1 && list[0].startDate === "2026-06-01" && list[0].cycleLength === 28) {
          list = [];
        }
        return [...list, item];
      }
    });

    setShowLogCycleDialog(false);
  };

  const handleDeleteCycle = (id: number) => {
    if (confirm("Chắc chắn muốn xóa ghi nhận ngày chu kỳ này?")) {
      setCycles(prev => prev.filter(c => c.id !== id));
    }
  };

  // -------------------------------------------------------------
  // GEMINI SECURE METHOD
  // -------------------------------------------------------------
  const handleTriggerAiAnalysis = async () => {
    if (cycles.length === 0) {
      alert("Cần có ít nhất 1 chu kỳ thực tế trong cơ sở dữ liệu để AI phân tích.");
      return;
    }
    setIsAiLoading(true);
    setAiError(null);
    setAiProgressText("Đang tổng hợp các chu kỳ...");

    try {
      const activeStartDates = cycles.map(c => c.startDate);
      const activeLengths = cycles.map(c => c.cycleLength);

      setTimeout(() => setAiProgressText("Đang kết nối cổng dự đoán y tế bảo mật..."), 1000);
      setTimeout(() => setAiProgressText("Gemini đang phân tích tần số dao động..."), 2200);

      const result = await GeminiService.analyzeMenstrualCycle(
        femaleAge,
        activeStartDates,
        activeLengths
      );

      setAiResult(result);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Lỗi gọi AI phân tích chu kỳ.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Calendar Day generator based on monthly view
  const monthDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 is Sun, 1 is Mon...
    
    // Total days in active month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Total days in previous month for offset padding
    const prevTotalDays = new Date(year, month, 0).getDate();

    const grid: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Pre-pad with previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = prevTotalDays - i;
      const d = new Date(year, month - 1, dNum);
      grid.push({
        dateStr: CoupleUtils.formatDate(d),
        dayNum: dNum,
        isCurrentMonth: false
      });
    }

    // Fill current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      grid.push({
        dateStr: CoupleUtils.formatDate(d),
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Post-pad to make multiples of 7 grids
    const totalFilled = grid.length;
    const remaining = 42 - totalFilled; // standard 6-row layout
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      grid.push({
        dateStr: CoupleUtils.formatDate(d),
        dayNum: i,
        isCurrentMonth: false
      });
    }

    return grid;
  }, [calendarDate]);

  // Color mapper helper based on status codes
  const getDayStatusClass = (status: DayStatus, isToday: boolean, isSelected: boolean) => {
    let classes = 'transition-transform duration-200 cursor-pointer hover:scale-105 select-none ';
    
    if (isSelected) {
      classes += 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-110 ';
    }

    if (status === 'PERIOD') {
      classes += 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] font-bold';
    } else if (status === 'UPCOMING') {
      classes += 'bg-rose-500/30 text-rose-200 border border-dashed border-rose-400/50';
    } else if (status === 'FERTILE') {
      classes += 'bg-indigo-500/80 text-white font-medium pulse-fertile shadow-[0_0_10px_rgba(99,102,241,0.5)]';
    } else if (status === 'OVULATION') {
      classes += 'bg-purple-600 text-white font-bold ring-2 ring-purple-300';
    } else if (status === 'SAFE') {
      classes += 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    } else {
      classes += 'bg-slate-800 text-slate-300 hover:bg-slate-700';
    }

    if (isToday && status !== 'PERIOD') {
      classes += ' ring-2 ring-slate-100 ring-offset-1 ring-offset-slate-900';
    }

    return classes;
  };

  // Calendar Day Click Detail lookup
  const activeSelectedDayDetail = useMemo(() => {
    if (!selectedCalendarDate) return null;
    const status = cycleMap[selectedCalendarDate] || 'NONE';
    const log = cycles.find(c => c.startDate === selectedCalendarDate);
    return {
      date: selectedCalendarDate,
      status,
      log
    };
  }, [selectedCalendarDate, cycleMap, cycles]);

  return (
    <div id="app-container" className="flex-1 flex flex-col bg-slate-900 overflow-x-hidden min-h-screen text-slate-100">
      
      {/* BACKGROUND DECORATOR WRAPPER FOR IMMERSIVE APPS */}
      {activeTab === 'love' && (
        <div 
          id="immersive-app-background" 
          className="fixed inset-0 pointer-events-none transition-all duration-700 select-none z-0 overflow-hidden"
          style={backgroundStyle}
        />
      )}

      {/* HEADER SECTION */}
      <header id="app-header" className="relative z-10 w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800 p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">YOU LOVE</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                <span>Trực Tuyến</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </p>
            </div>
          </div>

          {/* Time updates on web browser */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-full py-1.5 px-3 flex items-center gap-2 text-xs font-mono text-slate-300 shadow-md">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>{currentTime || 'Loading...'}</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT SCROLL CONTAINER */}
      <main id="app-main" className="flex-1 overflow-y-auto relative z-10 w-full max-w-4xl mx-auto px-4 py-6 pb-28">
        
        {/* TAB 1: LOVE DAYS INDEX SCREEN */}
        {activeTab === 'love' && (
          <div id="love-tab-content" className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            
            {/* CENTRAL CIRCLE DAY COUNT COMPONENT */}
            <div className="bg-slate-950/40 backdrop-blur-md rounded-3xl border border-slate-100/10 p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-2 right-2 flex gap-1">
                <button 
                  onClick={() => setShowAdjustDialog(true)}
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-300 transition-colors"
                  title="Chỉnh căn chỉnh góc hình nền"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mb-2">
                <span className="text-xs uppercase tracking-widest text-slate-300 font-bold bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full border border-rose-500/30">
                  NHẬT KÝ TÌNH YÊU 📖
                </span>
              </div>

              {/* Big numeric circle */}
              <div className="relative w-56 h-56 mx-auto my-6 flex flex-col items-center justify-center rounded-full bg-gradient-to-tr from-rose-500/20 via-pink-400/10 to-violet-500/25 border-4 border-slate-100/20 shadow-[inset_0_0_24px_rgba(244,63,94,0.3)] select-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-dashed border-slate-100/20 animate-spin-slow"></div>
                <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-bounce mb-1" />
                <span className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {loveDays}
                </span>
                <span className="text-xs text-slate-200 mt-1 uppercase font-semibold tracking-wider">Ngày Bên Nhau</span>
              </div>

              {/* Breakdown detail */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 max-w-md mx-auto">
                <div className="text-center">
                  <span className="block text-lg font-extrabold text-rose-400">{loveBreakdown.years}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">Năm</span>
                </div>
                <div className="text-center border-l border-slate-800">
                  <span className="block text-lg font-extrabold text-rose-400">{loveBreakdown.months}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">Tháng</span>
                </div>
                <div className="text-center border-l border-slate-800">
                  <span className="block text-lg font-extrabold text-rose-400">{loveBreakdown.weeks}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">Tuần</span>
                </div>
                <div className="text-center border-l border-slate-800">
                  <span className="block text-lg font-extrabold text-rose-400">{loveBreakdown.days}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">Ngày lẻ</span>
                </div>
              </div>

              <p className="text-sm italic text-slate-300 mt-4 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                Bắt đầu hành trình đẹp đẽ từ ngày {CoupleUtils.formatDisplayDate(profile.loveDate)}
              </p>
            </div>

            {/* DUAL PROFILES SECTION */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* MALE CARD */}
              <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 flex flex-col items-center text-center shadow-lg hover:border-slate-700 transition-all">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-indigo-400/60 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {profile.maleAvatar ? (
                      <img 
                        src={profile.maleAvatar} 
                        alt="Avatar Male" 
                        style={{ transform: `scale(${profile.maleScale}) translate(${profile.maleOffsetX}px, ${profile.maleOffsetY}px)` }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="text-3xl">👦</div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-full cursor-pointer text-white shadow-md transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleUploadFile('maleAvatar', e)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-1 justify-center">
                    {profile.maleName}
                    <span className="text-xs text-indigo-400">♂️</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sinh nhật: {CoupleUtils.formatDisplayDate(profile.maleBirthday)}</p>
                  
                  {/* Age & Zodiac badging */}
                  <div className="flex gap-1.5 justify-center mt-2">
                    <span className="bg-indigo-500/10 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {maleAge} tuổi
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                      {profile.maleZodiac}
                    </span>
                  </div>

                  {/* Birthday countdown */}
                  <div className="mt-3 text-xs text-indigo-300 font-semibold bg-indigo-500/5 py-1 px-3.5 rounded-lg border border-indigo-500/10">
                    {maleNextBirthdayCountdown === 0 
                      ? "Mừng sinh nhật hôm nay! 🎉" 
                      : `Còn ${maleNextBirthdayCountdown} ngày tới sinh nhật`}
                  </div>
                </div>
              </div>

              {/* FEMALE CARD */}
              <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 flex flex-col items-center text-center shadow-lg hover:border-slate-700 transition-all">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-pink-400/60 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {profile.femaleAvatar ? (
                      <img 
                        src={profile.femaleAvatar} 
                        alt="Avatar Female" 
                        style={{ transform: `scale(${profile.femaleScale}) translate(${profile.femaleOffsetX}px, ${profile.femaleOffsetY}px)` }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="text-3xl">👧</div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-pink-500 hover:bg-pink-600 rounded-full cursor-pointer text-white shadow-md transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleUploadFile('femaleAvatar', e)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-1 justify-center">
                    {profile.femaleName}
                    <span className="text-xs text-pink-400">♀️</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sinh nhật: {CoupleUtils.formatDisplayDate(profile.femaleBirthday)}</p>
                  
                  {/* Age & Zodiac badging */}
                  <div className="flex gap-1.5 justify-center mt-2">
                    <span className="bg-pink-500/10 text-pink-300 text-[10px] px-2 py-0.5 rounded-full border border-pink-500/20">
                      {femaleAge} tuổi
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                      {profile.femaleZodiac}
                    </span>
                  </div>

                  {/* Birthday countdown */}
                  <div className="mt-3 text-xs text-pink-300 font-semibold bg-pink-500/5 py-1 px-3.5 rounded-lg border border-pink-500/10">
                    {femaleNextBirthdayCountdown === 0 
                      ? "Mừng sinh nhật hôm nay! 🎂" 
                      : `Còn ${femaleNextBirthdayCountdown} ngày tới sinh nhật`}
                  </div>
                </div>
              </div>

            </div>

            {/* WALLPAPER PRESETS CHANGER BOARD */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Lựa Chọn Hình Nền (Sweet Wallpapers)</h3>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setProfile(p => ({ ...p, backgroundImage: 'preset_1' }))}
                  className={`h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-700 font-bold text-[10px] text-white border-2 transition-all ${profile.backgroundImage === 'preset_1' ? 'border-pink-400' : 'border-transparent'}`}
                >
                  Sunset Purple
                </button>
                <button 
                  onClick={() => setProfile(p => ({ ...p, backgroundImage: 'preset_2' }))}
                  className={`h-12 rounded-xl bg-gradient-to-tr from-orange-400 to-pink-500 font-bold text-[10px] text-white border-2 transition-all ${profile.backgroundImage === 'preset_2' ? 'border-pink-400' : 'border-transparent'}`}
                >
                  Peach Glow
                </button>
                <button 
                  onClick={() => setProfile(p => ({ ...p, backgroundImage: 'preset_3' }))}
                  className={`h-12 rounded-xl bg-gradient-to-tr from-[#CDB4DB] via-[#FFC8DD] to-[#FFA2B6] font-bold text-[10px] text-slate-800 border-2 transition-all ${profile.backgroundImage === 'preset_3' ? 'border-pink-400' : 'border-transparent'}`}
                >
                  Lavender Soft
                </button>
                <label 
                  className={`h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 flex flex-col items-center justify-center font-bold text-[10px] text-slate-300 cursor-pointer transition-all border-dashed ${profile.backgroundImage && !profile.backgroundImage.startsWith('preset_') ? 'border-pink-400' : 'border-slate-700'}`}
                >
                  <span>Tự chọn 🖼️</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleUploadFile('backgroundImage', e)} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* ACTION DIRECTORIES */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowMilestonesDialog(true)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl font-bold text-sm text-slate-100 flex items-center justify-center gap-2 shadow transition-colors"
                id="milestone-book-btn"
              >
                <BookOpen className="w-4 h-4 text-pink-400" />
                <span>Sổ Mốc Kỷ Niệm 📖</span>
              </button>
              <button 
                onClick={openEditProfile}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all"
                id="edit-profile-btn"
              >
                <Edit3 className="w-4 h-4 text-white" />
                <span>Chỉnh Sửa Thông Tin</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: MENSTRUAL CYCLE DIARY SCREEN */}
        {activeTab === 'menstrual' && (
          <div id="menstrual-tab-content" className="space-y-6 animate-fade-in animate-duration-300">
            
            {/* HERO WHEEL STATUS INDICATOR */}
            <div className={`border p-6 rounded-3xl ${currentCycleStatus.color} transition-all duration-350 shadow-inner flex flex-col md:flex-row items-center gap-6 justify-between select-none`}>
              <div className="text-center md:text-left space-y-1">
                <span className="text-[10px] uppercase font-black bg-slate-900/40 text-slate-300 py-1 px-3.5 rounded-full tracking-wide">Trạng Thái Sức Khỏe</span>
                <h2 className="text-2xl font-black text-white mt-1.5">{currentCycleStatus.title}</h2>
                <p className="text-xs text-slate-300 font-medium">{currentCycleStatus.description}</p>
              </div>

              {/* Stats circle detail */}
              <div className="flex gap-4 bg-slate-950/40 border border-slate-800 rounded-2xl py-3 px-4 w-full md:w-auto justify-around shrink-0 text-slate-200">
                <div className="text-center min-w-[70px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Chu Kỳ TB</span>
                  <span className="text-xl font-black text-rose-400">{menstrualStats.averageCycle} ngày</span>
                </div>
                <div className="border-r border-slate-800/60 my-1"></div>
                <div className="text-center min-w-[70px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Ngắn Nhất</span>
                  <span className="text-xl font-black text-slate-300">
                    {menstrualStats.minCycle ? `${menstrualStats.minCycle} ngày` : '--'}
                  </span>
                </div>
                <div className="border-r border-slate-800/60 my-1"></div>
                <div className="text-center min-w-[70px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Dài Nhất</span>
                  <span className="text-xl font-black text-slate-300">
                    {menstrualStats.maxCycle ? `${menstrualStats.maxCycle} ngày` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN CALENDAR AND SECTOR PANEL */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-xl">
              
              {/* CALENDAR CONTROLLER BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-800/60 pb-5">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const prev = new Date(calendarDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarDate(prev);
                    }}
                    className="p-2 border border-slate-800 rounded-xl hover:bg-slate-800 bg-slate-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <h3 className="text-lg font-extrabold text-white min-w-[140px] text-center capitalize">
                    Tháng {calendarDate.getMonth() + 1} / {calendarDate.getFullYear()}
                  </h3>
                  <button 
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarDate(next);
                    }}
                    className="p-2 border border-slate-800 rounded-xl hover:bg-slate-800 bg-slate-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCalendarMode(calendarMode === 'month' ? 'year' : 'month')}
                    className="py-1.5 px-3.5 text-xs font-bold border border-slate-800 bg-slate-900 rounded-xl text-slate-300 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-rose-400" />
                    <span>{calendarMode === 'month' ? 'Xem cả Năm 📅' : 'Quay lại Tháng'}</span>
                  </button>

                  <button 
                    onClick={() => openLogCycle()}
                    className="py-1.5 px-3.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow transition-all flex items-center gap-1.5"
                    id="log-cycle-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Ghi nhận Kinh nguyệt</span>
                  </button>
                </div>
              </div>

              {/* CALENDAR RENDER ENGINE */}
              {calendarMode === 'month' ? (
                <div>
                  {/* Grid of days naming */}
                  <div className="grid grid-cols-7 text-center text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <span>CN</span>
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                  </div>

                  {/* Grid of numbers */}
                  <div className="grid grid-cols-7 gap-2.5">
                    {monthDays.map((cell, idx) => {
                      const cellDate = cell.dateStr;
                      const status = cycleMap[cellDate] || 'NONE';
                      const isTodayStr = CoupleUtils.formatDate(new Date());
                      const isToday = cellDate === isTodayStr;
                      const isSelected = selectedCalendarDate === cellDate;

                      return (
                        <div 
                          key={idx}
                          onClick={() => setSelectedCalendarDate(cellDate)}
                          className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm ${getDayStatusClass(status, isToday, isSelected)} ${!cell.isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}
                        >
                          <span className="font-extrabold">{cell.dayNum}</span>
                          
                          {/* Small icon overlays */}
                          {status === 'PERIOD' && <span className="text-[9px] mt-0.5 mt-[-1px]">🩸</span>}
                          {status === 'UPCOMING' && <span className="text-[9px] mt-[-1px]">⏳</span>}
                          {status === 'FERTILE' && <span className="text-[9px] mt-[-2px]">✨</span>}
                          {status === 'OVULATION' && <span className="text-[9px] mt-[-3px]">🥚</span>}
                          {status === 'SAFE' && <span className="text-[9px] mt-[-1px]">🌿</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* LEGEND GLOSSARY */}
                  <div className="flex flex-wrap justify-center gap-3 mt-6 border-t border-slate-900 pt-5 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500 block shadow-[0_0_4px_rgba(239,68,68,0.5)]"></span>
                      <span>Trong kỳ kinh 🩸</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400/30 border border-dashed border-rose-400/70 block"></span>
                      <span>Dự kiến kinh ⏳</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-500/80 block shadow-[0_0_4px_rgba(99,102,241,0.5)]"></span>
                      <span>Dễ thụ thai ✨</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-600 block ring-1 ring-purple-300"></span>
                      <span>Rụng trứng 🥚</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 block"></span>
                      <span>Ngày an toàn 🌿</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-800 block"></span>
                      <span>Ngày bình thường</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* YEAR COMPACT MODE SCREEN */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                  {Array.from({ length: 12 }).map((_, mIdx) => {
                    const currentYear = calendarDate.getFullYear();
                    const demoMonth = new Date(currentYear, mIdx, 1);
                    const daysInDemo = new Date(currentYear, mIdx + 1, 0).getDate();
                    const startOffset = demoMonth.getDay();

                    return (
                      <div key={mIdx} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                        <h4 className="text-xs font-black text-rose-300 tracking-wider mb-2 text-center capitalize">
                          Tháng {mIdx + 1}
                        </h4>
                        
                        <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center text-slate-500 font-bold mb-1">
                          <span>C</span><span>H</span><span>B</span><span>T</span><span>N</span><span>S</span><span>B</span>
                        </div>

                        <div className="grid grid-cols-7 gap-0.5">
                          {/* Offset spaces */}
                          {Array.from({ length: startOffset }).map((_, oIdx) => (
                            <div key={`offset-${oIdx}`} className="aspect-square opacity-0"></div>
                          ))}

                          {/* Real numbers */}
                          {Array.from({ length: daysInDemo }).map((_, dIdx) => {
                            const dmNum = dIdx + 1;
                            const dStr = CoupleUtils.formatDate(new Date(currentYear, mIdx, dmNum));
                            const status = cycleMap[dStr] || 'NONE';

                            let bgClass = 'bg-slate-800 text-slate-400';
                            if (status === 'PERIOD') bgClass = 'bg-red-500 text-white';
                            if (status === 'UPCOMING') bgClass = 'bg-rose-400/30 text-rose-200';
                            if (status === 'FERTILE') bgClass = 'bg-indigo-500/80 text-white';
                            if (status === 'OVULATION') bgClass = 'bg-purple-600 text-white';
                            if (status === 'SAFE') bgClass = 'bg-emerald-500/20 text-emerald-300';

                            return (
                              <div 
                                key={dIdx}
                                className={`aspect-square rounded-sm text-[8px] flex items-center justify-center font-bold ${bgClass}`}
                              >
                                {dmNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* CALENDAR SELECTED DAY DETAILS CARDS */}
            {activeSelectedDayDetail && (
              <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-rose-500/20 p-5 shadow-lg border-l-4 border-l-rose-500 animate-slide-up">
                <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mb-3">
                  <span className="text-slate-100 font-black">Ngày: {CoupleUtils.formatDisplayDate(activeSelectedDayDetail.date)}</span>
                  <span className="text-xs bg-slate-900 border border-slate-800 rounded-full py-1 px-3 text-slate-300 font-bold">
                    Trạng thái: <span className="text-rose-400">{DayStatusTranslation[activeSelectedDayDetail.status]}</span>
                  </span>
                </div>

                {activeSelectedDayDetail.log ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Chu Kỳ Tính Toán</span>
                        <span className="text-sm font-extrabold text-slate-200">{activeSelectedDayDetail.log.cycleLength} ngày</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Số Ngày Hành Kinh</span>
                        <span className="text-sm font-extrabold text-slate-200">{activeSelectedDayDetail.log.periodLength} ngày</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Thử nghiệm LH (Rụng Trứng)</span>
                        <span className="text-sm font-extrabold text-indigo-300">{activeSelectedDayDetail.log.lhTestResult || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Thân Nhiệt BBT</span>
                        <span className="text-sm font-extrabold text-[#FFA2B6]">
                          {activeSelectedDayDetail.log.bbt ? `${activeSelectedDayDetail.log.bbt}°C` : 'N/A'}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Chất nhầy cổ tử cung</span>
                        <span className="text-sm font-extrabold text-slate-200">{activeSelectedDayDetail.log.cervicalMucus || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleDeleteCycle(activeSelectedDayDetail.log!.id!)}
                        className="py-1.5 px-3.5 bg-slate-950/40 hover:bg-red-950/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa nhật ký này</span>
                      </button>
                      <button 
                        onClick={() => openLogCycle(activeSelectedDayDetail.log)}
                        className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa thông số</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-xs mb-3 italic">Hôm nay chưa có dữ liệu chẩn đoán hoặc ghi nhận kỳ kinh.</p>
                    <button 
                      onClick={() => openLogCycle()}
                      className="py-1.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-400" />
                      <span>Thêm nhật ký cho ngày này</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DYNAMIC CYCLE PREDICTOR REPORT PANEL */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-extrabold text-white">Kết Quả Tính Toán Theo 7 Bước Quy Chuẩn 📊</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">Kỳ Kinh Dự Kiến Kế Tiếp</h4>
                  <ul className="text-sm space-y-2 text-slate-300">
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                      <span>Kỳ kế 1:</span>
                      <strong className="text-rose-400">
                        {menstrualStats.predictedPeriodStart ? CoupleUtils.formatDisplayDate(menstrualStats.predictedPeriodStart) : 'Chưa có thông số'}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg opacity-85">
                      <span>Kỳ kế 2:</span>
                      <strong>
                        {menstrualStats.predictedPeriodStart2 ? CoupleUtils.formatDisplayDate(menstrualStats.predictedPeriodStart2) : 'Chưa có thông số'}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg opacity-70">
                      <span>Kỳ kế 3:</span>
                      <strong>
                        {menstrualStats.predictedPeriodStart3 ? CoupleUtils.formatDisplayDate(menstrualStats.predictedPeriodStart3) : 'Chưa có thông số'}
                      </strong>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider">Khoảng Thời Gian Cơ Bản</h4>
                  <ul className="text-sm space-y-2 text-slate-300 font-medium">
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                      <span>Ngày rụng trứng:</span>
                      <strong className="text-purple-400">
                        {menstrualStats.ovulationDate ? CoupleUtils.formatDisplayDate(menstrualStats.ovulationDate) : 'Chưa xác định'}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                      <span>Cửa sổ dễ thụ thai:</span>
                      <strong className="text-indigo-400">
                        {menstrualStats.fertileStart && menstrualStats.fertileEnd 
                          ? `${CoupleUtils.formatDisplayDate(menstrualStats.fertileStart)} - ${CoupleUtils.formatDisplayDate(menstrualStats.fertileEnd)}`
                          : 'Chưa xác định'}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                      <span>An toàn sau kinh nguyệt (Hạn hẹp):</span>
                      <strong className="text-emerald-400">
                        {menstrualStats.safePeriod1Start && menstrualStats.safePeriod1End && menstrualStats.safePeriod1Start <= menstrualStats.safePeriod1End
                          ? `${CoupleUtils.formatDisplayDate(menstrualStats.safePeriod1Start)} - ${CoupleUtils.formatDisplayDate(menstrualStats.safePeriod1End)}`
                          : 'Bỏ qua (quá ngắn)'}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                      <span>An toàn sau rụng trứng (Tuyệt đối):</span>
                      <strong className="text-emerald-400 font-extrabold">
                        {menstrualStats.safePeriod2Start && menstrualStats.safePeriod2End 
                          ? `${CoupleUtils.formatDisplayDate(menstrualStats.safePeriod2Start)} - ${CoupleUtils.formatDisplayDate(menstrualStats.safePeriod2End)}`
                          : 'Chưa xác định'}
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AI PRESTIGE DIAGNOSTIC BANNER */}
            <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-[#1e1b4b] rounded-3xl border border-indigo-500/30 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Dự Đoán Thông Minh qua AI 🩺✨</h3>
                    <p className="text-slate-400 text-[11px]">Sử dụng mô hình Gemini để phân tích outlier và độ lệch chuẩn chính xác hơn</p>
                  </div>
                </div>

                <button 
                  onClick={handleTriggerAiAnalysis}
                  disabled={isAiLoading}
                  className="w-full sm:w-auto py-2 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-750 text-white rounded-xl shadow-lg border-2 border-indigo-400/20 font-bold text-xs select-none shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-[1.02] transform transition-all flex items-center justify-center gap-2"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{aiProgressText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Phân Tích Bằng AI (Gemini)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loader or Error indicator */}
              {aiError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-300 flex items-start gap-2 max-w-lg mx-auto relative z-10">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Lỗi trong quá trình phân tích:</p>
                    <p>{aiError}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">Mẹo: Đảm bảo đã nhập các ngày bắt đầu hợp lệ và khóa bí mật đã được cài đặt trong settings.</p>
                  </div>
                </div>
              )}

              {/* RENDER RESPONSES AND STATS OBTAINED */}
              {aiResult ? (
                <div className="space-y-4 border-t border-slate-800/80 pt-5 mt-4 relative z-10 animate-fade-in">
                  
                  {/* Confidence metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Chu kỳ TB (AI)</span>
                      <strong className="text-base font-extrabold text-[#FFA2B6]">{aiResult.average_cycle_length} ngày</strong>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Chu kỳ Trung vị</span>
                      <strong className="text-base font-extrabold text-slate-200">{aiResult.median_cycle_length || '--'} ngày</strong>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Độ ổn định</span>
                      <strong className="text-base font-extrabold text-indigo-400">{aiResult.cycle_stability || 'Bình thường'}</strong>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Độ tin cậy</span>
                      <strong className="text-base font-extrabold text-emerald-400">{aiResult.confidence_score || '85'}%</strong>
                    </div>
                  </div>

                  {/* Prediction insights columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1">
                        <span>🗓️ Ngày dự đoán tối ưu qua AI</span>
                      </h4>
                      <ul className="text-sm space-y-2 text-slate-300 font-medium">
                        <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                          <span>Ngày hành kinh kế:</span>
                          <strong className="text-rose-400">
                            {aiResult.next_period_date ? CoupleUtils.formatDisplayDate(aiResult.next_period_date) : 'N/A'}
                          </strong>
                        </li>
                        <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                          <span>Dao động sai số:</span>
                          <span className="text-slate-300">{aiResult.prediction_range || '+- 1 ngày'}</span>
                        </li>
                        <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                          <span>Ước đoán rụng trứng (AI):</span>
                          <strong className="text-purple-400">
                            {aiResult.estimated_ovulation_date ? CoupleUtils.formatDisplayDate(aiResult.estimated_ovulation_date) : 'N/A'}
                          </strong>
                        </li>
                        <li className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg">
                          <span>Hành lang thụ thai rộng:</span>
                          <span className="text-indigo-400 font-semibold">{aiResult.fertility_window || 'N/A'}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">⚠️ Phát Hiện Chu Kỳ Bất Thường</h4>
                      <p className="text-xs text-slate-400">Hỗ trợ loại bỏ các chu kỳ bị kéo dài do căng thẳng hoặc sức khoẻ tạm thời.</p>
                      
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div>
                          <span className="font-bold block text-slate-400">Các Outliers phát hiện:</span>
                          <span className="text-rose-300 font-medium font-mono">
                            {aiResult.outliers && aiResult.outliers.length > 0 
                              ? aiResult.outliers.join(', ') 
                              : 'Không phát hiện (chu kỳ đồng đều ổn định).'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold block text-slate-400">Thụ thai thấp:</span>
                          <span className="text-emerald-400">{aiResult.low_fertility_days || 'Các ngày còn lại trong chu kỳ.'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deep descriptive Vietnamese text */}
                  <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl">
                    <h5 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      <span>Ý Kiến Chuyên Gia AI & Lập Luận</span>
                    </h5>
                    <p className="text-xs text-indigo-200 leading-relaxed font-normal whitespace-pre-line text-justify">{aiResult.reasoning}</p>
                  </div>

                </div>
              ) : (
                !isAiLoading && (
                  <div className="text-center py-6 border border-dashed border-indigo-500/20 rounded-2xl bg-indigo-950/10 mt-4 h-full relative z-10 flex flex-col items-center justify-center">
                    <Smile className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="text-xs text-slate-300 font-bold">Chưa Có Khảo Sát Báo Cáo AI Cho Kỳ Học Này</p>
                    <p className="text-[10px] text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">Hãy ấn nút "Phân Tích Bằng AI" ở góc phải để nhận báo cáo chuẩn đoán chu kỳ chuyên sâu từ thông số thực tế của bạn.</p>
                  </div>
                )
              )}

              {/* Secure health advice watermark note */}
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500 mt-5 relative z-10">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Số liệu AI được bảo mật cục bộ và chỉ nhằm mục đích tham khảo, không thay thế cho chẩn đoán y tế chuyên khoa.</span>
              </div>
            </div>

            {/* PREVIOUS RECORD LOGS LISTINGS */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <span>Danh Sách Nhật Ký Chu Kỳ Đã Ghi Chép ({cycles.length})</span>
                </h3>
              </div>

              {cycles.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic text-xs">
                  Chưa ghi chép bất kỳ chu kỳ nào. Hãy dùng nút "Ghi nhận Kinh nguyệt" để thêm mới.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {[...cycles].sort((a,b) => b.startDate.localeCompare(a.startDate)).map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-slate-750 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
                          <strong className="text-sm text-slate-100">Ngày bắt đầu: {CoupleUtils.formatDisplayDate(item.startDate)}</strong>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                          <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                            Chu kỳ: <strong className="text-rose-400">{item.cycleLength} ngày</strong>
                          </span>
                          <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                            Độ dài hành kinh: <strong className="text-pink-400">{item.periodLength} ngày</strong>
                          </span>
                          {item.bbt && (
                            <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                              BBT: <strong>{item.bbt}°C</strong>
                            </span>
                          )}
                          {item.lhTestResult && item.lhTestResult !== 'Không có' && (
                            <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                              Trứng: <strong>{item.lhTestResult}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => openLogCycle(item)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs transition-colors"
                          title="Sửa bản ghi này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => item.id && handleDeleteCycle(item.id)}
                          className="p-1.5 bg-slate-950 hover:bg-red-950/30 text-rose-400 border border-rose-500/10 rounded-lg text-xs transition-colors"
                          title="Xóa bản ghi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          BOTTOM NAVIGATION SCAFFOLD (SÁT VỚI JETPACK COMPOSE BOTTOM NAV)
         ------------------------------------------------------------- */}
      <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-6 py-2 pb-6 flex items-center justify-around shadow-2xl">
        <button 
          onClick={() => setActiveTab('love')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 transition-all text-xs font-bold ${activeTab === 'love' ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          id="tab-btn-love"
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'love' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
            <Heart className={`w-5 h-5 ${activeTab === 'love' ? 'fill-rose-500 stroke-rose-500' : ''}`} />
          </div>
          <span>Ngày Yêu ❤️</span>
        </button>

        <button 
          onClick={() => setActiveTab('menstrual')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 transition-all text-xs font-bold ${activeTab === 'menstrual' ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          id="tab-btn-menstrual"
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'menstrual' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span>Chu Kỳ Kinh Nguyệt 🩸</span>
        </button>
      </nav>

      {/* =============================================================
          DIALOG POPOUPS (DIALOGS)
         ============================================================= */}
      
      {/* 1. EDIT PROFILE INFO DIALOG */}
      {showEditProfileDialog && (
        <div id="dialog-edit-profile" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] shadow-2xl select-text animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-rose-500" />
                <span>Chỉnh Sửa Thông Tin ✏️</span>
              </h3>
              <button 
                onClick={() => setShowEditProfileDialog(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* LOVE DATE */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Ngày Bắt Đầu Yêu (.loveDate)</label>
                <input 
                  type="date" 
                  value={editLoveDate}
                  onChange={(e) => setEditLoveDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm md:text-base font-medium text-white focus:outline-none focus:border-rose-500 placeholder-slate-600 font-mono"
                />
              </div>

              <div className="border-t border-slate-850 my-2"></div>

              {/* MALE INPUTS */}
              <div className="space-y-3 p-3 bg-indigo-950/20 rounded-xl border border-indigo-500/10">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Thông Tin Bạn Nam 👦</span>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Biệt danh / Tên bạn Nam:</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên"
                    value={editMaleName}
                    onChange={(e) => setEditMaleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Ngày sinh Bạn Nam:</label>
                  <input 
                    type="date" 
                    value={editMaleBirth}
                    onChange={(e) => setEditMaleBirth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* FEMALE INPUTS */}
              <div className="space-y-3 p-3 bg-pink-950/20 rounded-xl border border-pink-500/10">
                <span className="text-[10px] font-black tracking-widest text-pink-400 uppercase">Thông Tin Bạn Nữ 👧</span>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Biệt danh / Tên bạn Nữ:</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên"
                    value={editFemaleName}
                    onChange={(e) => setEditFemaleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Ngày sinh Bạn Nữ:</label>
                  <input 
                    type="date" 
                    value={editFemaleBirth}
                    onChange={(e) => setEditFemaleBirth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setShowEditProfileDialog(false)}
                className="flex-1 py-2.5 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-400 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
                id="save-profile-btn"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CROP / SLIDERS ADJUSMENTS DIALOG */}
      {showAdjustDialog && (
        <div id="dialog-sliders-align" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 overflow-y-auto max-h-[95vh] shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Căn Chỉnh Góc Ảnh Chân Dung & Nền 📐</span>
              </h3>
              <button 
                onClick={() => setShowAdjustDialog(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                id="close-adjust-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* BACKGROUND WALLPAPER ORIENTATION */}
              <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-300 block uppercase tracking-wider text-[10px]">Cắt Ảnh Hình Nền Tự Chọn</span>
                <p className="text-[10px] text-slate-400 italic">Chỉ áp dụng khi bạn tải ảnh nền từ bộ nhớ máy lên.</p>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Tỷ lệ Zoom ({profile.bgScale.toFixed(1)}x):</span>
                    <span>1.0x - 3.0x</span>
                  </div>
                  <input 
                    type="range" min="1.0" max="3.0" step="0.1"
                    value={profile.bgScale}
                    onChange={(e) => setProfile(p => ({ ...p, bgScale: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Căng Xéo ngang ({profile.bgOffsetX}px):</span>
                    <span>-150px - 150px</span>
                  </div>
                  <input 
                    type="range" min="-150" max="150" step="5"
                    value={profile.bgOffsetX}
                    onChange={(e) => setProfile(p => ({ ...p, bgOffsetX: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Căng Xéo Dọc ({profile.bgOffsetY}px):</span>
                    <span>-150px - 150px</span>
                  </div>
                  <input 
                    type="range" min="-150" max="150" step="5"
                    value={profile.bgOffsetY}
                    onChange={(e) => setProfile(p => ({ ...p, bgOffsetY: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Góc Xoay Nghiêng ({profile.bgRotation}°):</span>
                    <span>-180° - 180°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" step="5"
                    value={profile.bgRotation}
                    onChange={(e) => setProfile(p => ({ ...p, bgRotation: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* MALE AVATAR CROPPING */}
              <div className="bg-indigo-950/15 border border-indigo-500/10 p-3 rounded-xl space-y-2">
                <span className="font-extrabold text-indigo-400 block uppercase tracking-wider text-[10px]">Cắt Ảnh Chân Dung Nam ♂️</span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Zoom ({profile.maleScale.toFixed(1)}x):</span>
                    <span>0.5x - 3.0x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="3.0" step="0.1"
                    value={profile.maleScale}
                    onChange={(e) => setProfile(p => ({ ...p, maleScale: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="font-mono block">Ngang ({profile.maleOffsetX}px):</span>
                    <input 
                      type="range" min="-100" max="100" step="2"
                      value={profile.maleOffsetX}
                      onChange={(e) => setProfile(p => ({ ...p, maleOffsetX: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono block">Dọc ({profile.maleOffsetY}px):</span>
                    <input 
                      type="range" min="-100" max="100" step="2"
                      value={profile.maleOffsetY}
                      onChange={(e) => setProfile(p => ({ ...p, maleOffsetY: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* FEMALE AVATAR CROPPING */}
              <div className="bg-pink-950/15 border border-pink-500/10 p-3 rounded-xl space-y-2">
                <span className="font-extrabold text-pink-400 block uppercase tracking-wider text-[10px]">Cắt Ảnh Chân Dung Nữ ♀️</span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Zoom ({profile.femaleScale.toFixed(1)}x):</span>
                    <span>0.5x - 3.0x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="3.0" step="0.1"
                    value={profile.femaleScale}
                    onChange={(e) => setProfile(p => ({ ...p, femaleScale: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="font-mono block">Ngang ({profile.femaleOffsetX}px):</span>
                    <input 
                      type="range" min="-100" max="100" step="2"
                      value={profile.femaleOffsetX}
                      onChange={(e) => setProfile(p => ({ ...p, femaleOffsetX: parseInt(e.target.value) }))}
                      className="w-full accent-pink-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono block">Dọc ({profile.femaleOffsetY}px):</span>
                    <input 
                      type="range" min="-100" max="100" step="2"
                      value={profile.femaleOffsetY}
                      onChange={(e) => setProfile(p => ({ ...p, femaleOffsetY: parseInt(e.target.value) }))}
                      className="w-full accent-pink-400"
                    />
                  </div>
                </div>
              </div>

            </div>

            <button 
              onClick={() => {
                // Reset all to default parameters
                setProfile(prev => ({
                  ...prev,
                  maleScale: 1.0,
                  maleOffsetX: 0,
                  maleOffsetY: 0,
                  femaleScale: 1.0,
                  femaleOffsetX: 0,
                  femaleOffsetY: 0,
                  bgScale: 1.0,
                  bgOffsetX: 0,
                  bgOffsetY: 0,
                  bgRotation: 0
                }));
              }}
              className="w-full mt-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Reset parameters về gốc</span>
            </button>
            
            <button 
              onClick={() => setShowAdjustDialog(false)}
              className="w-full mt-2.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg transition-colors"
            >
              Hoàn Thành
            </button>
          </div>
        </div>
      )}

      {/* 3. TIMELINE MILESTONES SCROLL DIALOG */}
      {showMilestonesDialog && (
        <div id="dialog-love-milestones" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 flex flex-col max-h-[85vh] shadow-2xl animate-scale-up select-text">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-3 shrink-0">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                  <span>Sổ Mốc Kỷ Niệm Tình Yêu 📖</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Dòng thời gian các cột mốc ý nghĩa của gia đình bạn</p>
              </div>
              <button 
                onClick={() => setShowMilestonesDialog(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                id="close-milestones-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scroll list with nearest upcoming focus highlight */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {calculatedMilestones.map((item, idx) => {
                const isPast = item.daysRemaining < 0;
                const isNearest = idx === nearestMilestoneIndex;

                let borderStyle = 'border-slate-800 bg-slate-900/60';
                if (isNearest) borderStyle = 'border-rose-500 bg-gradient-to-tr from-slate-900 via-slate-900 to-[#31111d] ring-2 ring-rose-500/20';
                if (isPast) borderStyle = 'border-slate-800/40 bg-slate-950/30 opacity-45';

                return (
                  <div 
                    key={idx}
                    className={`border p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all ${borderStyle}`}
                  >
                    <div className="space-y-1">
                      {isNearest && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-[10px] font-black text-white uppercase tracking-wider animate-pulse mb-1">
                          <Heart className="w-3 h-3 fill-white text-white" />
                          <span>Mốc sự kiện kế tiếp cận kề ✨</span>
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Lịch bàn: {CoupleUtils.formatDisplayDate(item.dateStr)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {isPast ? (
                        <span className="text-[10px] bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-slate-500 font-semibold uppercase">
                          Đã qua
                        </span>
                      ) : item.daysRemaining === 0 ? (
                        <span className="text-xs bg-rose-500 text-white font-black py-1 px-3 rounded-lg shadow-lg uppercase tracking-wide inline-block animate-bounce">
                          Hôm Nay! ✨
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-xl block">
                          Còn <strong>{item.daysRemaining}</strong> ngày
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowMilestonesDialog(false)}
              className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs shadow-md transition-colors shrink-0"
            >
              Đóng Đọc Kỷ Niệm
            </button>
          </div>
        </div>
      )}

      {/* 4. DIALOG LOG / EDIT MENSTRUAL CYCLE */}
      {showLogCycleDialog && (
        <div id="dialog-log-menstrual" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 overflow-y-auto max-h-[95vh] shadow-2xl select-text animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800/85 pb-4 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                <span>{logId ? "Chỉnh sửa chu kỳ ✏️" : "Ghi nhận chu kỳ mới 🩸"}</span>
              </h3>
              <button 
                onClick={() => setShowLogCycleDialog(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                id="close-log-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {logError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 text-xs text-red-300 flex items-start gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{logError}</span>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block uppercase tracking-wide">1. Ngày bắt đầu kỳ kinh (*)</label>
                <input 
                  type="date" 
                  value={logStartDate}
                  onChange={(e) => setLogStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block uppercase tracking-wide">2. Chu Kỳ (ngày)</label>
                  <input 
                    type="number" 
                    min="21" max="40"
                    value={logCycleLength}
                    onChange={(e) => setLogCycleLength(parseInt(e.target.value) || 28)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Giới hạn: 21 - 40 ngày</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block uppercase tracking-wide">3. Số ngày hành kinh</label>
                  <input 
                    type="number" 
                    min="2" max="10"
                    value={logPeriodLength}
                    onChange={(e) => setLogPeriodLength(parseInt(e.target.value) || 5)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Giới hạn: 2 - 10 ngày</span>
                </div>
              </div>

              <div className="border-t border-slate-850 my-2"></div>

              {/* DYNAMIC SYMPTOM LOG DETAILS */}
              <div className="space-y-3.5 p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl">
                <span className="text-[10px] font-black tracking-widest text-slate-400 block uppercase">Chỉ số sinh lý mở rộng (Tùy chọn)</span>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Thử nghiệm rụng trứng LH:</label>
                  <select 
                    value={logLhTest}
                    onChange={(e) => setLogLhTest(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-505"
                  >
                    <option value="Không có">Không có dữ liệu</option>
                    <option value="Dương tính (Đạt đỉnh)">Dương tính (Đạt đỉnh 🥚)</option>
                    <option value="Âm tính">Âm tính</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Nhiệt độ cơ thể cơ sở (BBT °C):</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: 36.6"
                    value={logBbt}
                    onChange={(e) => setLogBbt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-505"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">Trạng thái dịch tử cung:</label>
                  <select 
                    value={logMucus}
                    onChange={(e) => setLogMucus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-505"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Dai dính">Dai dính</option>
                    <option value="Trắng đục dẻo">Trắng đục dẻo</option>
                    <option value="Loãng ướt (Lòng trắng trứng)">Loãng ướt (Lòng trắng trứng ✨)</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setShowLogCycleDialog(false)}
                className="flex-1 py-2.5 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-400 transition-colors"
                id="cancel-save-cycle-btn"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveCycle}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
                id="save-cycle-confirm-btn"
              >
                Lưu Ghi Nhật Nhật
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
