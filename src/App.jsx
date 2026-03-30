import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  X, 
  Save, 
  ChevronRight,
  TrendingUp,
  Sparkles,
  Search,
  Hash
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';

// --- Firebase Configuration ---
// 주의: 로컬(VS Code)에서 실행할 때는 본인의 Firebase 설정값으로 교체해야 합니다.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyAkqKUlzthBLEEFqWTOB3uPRfrPBAit0Ag",
  authDomain: "sabujak-fa47a.firebaseapp.com",
  projectId: "sabujak-fa47a",
  storageBucket: "sabujak-fa47a.firebasestorage.app",
  messagingSenderId: "614209642026",
  appId: "1:614209642026:web:1e68e1c4048f9497d7ad53"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sabujak-app-v1';

// --- Data: 20 Themes ---
const ALL_THEMES = [
  { id: 'sunflower', name: '해바라기', category: '식물', emojis: ['🌱','🌿','🪴','🌻','🐝🌻','✨🌻'], stages: ['씨앗','새싹','줄기','꽃봉오리','활짝 핀 꽃','눈부신 해바라기'], color: '#FEF3C7' },
  { id: 'rose', name: '장미', category: '식물', emojis: ['🌱','🌿','🌵','🌷','🌹','🦋🌹'], stages: ['씨앗','새싹','가시 줄기','꽃봉오리','빨간 장미','아름다운 장미'], color: '#FEE2E2' },
  { id: 'cactus', name: '선인장', category: '식물', emojis: ['🌱','🌵','🌵🌸','🏜️🌵','🐫🌵','✨🌵'], stages: ['씨앗','꼬마 선인장','꽃 핀 선인장','사막 선인장','낙타 친구','거대 선인장'], color: '#DCFCE7' },
  { id: 'bamboo', name: '대나무', category: '식물', emojis: ['🌱','🌿','🎋','🎍','🐼🎍','🎋✨'], stages: ['죽순','어린 대나무','잎사귀','마디 대나무','판다와 대나무','울창한 대나무숲'], color: '#F0FDF4' },
  { id: 'tulip', name: '튤립', category: '식물', emojis: ['🧅','🌱','🌿','🌷','💐','✨💐'], stages: ['구근','새싹','줄기와 잎','꽃봉오리','활짝 핀 튤립','튤립 다발'], color: '#FDF2F8' },
  { id: 'cherry', name: '벚꽃', category: '식물', emojis: ['🌱','🌿','🌳','🌸','🌸✨','🏞️🌸'], stages: ['씨앗','어린 나무','가지','꽃망울','활짝 핀 벚꽃','벚꽃 동산'], color: '#FFF1F2' },
  { id: 'maple', name: '단풍나무', category: '식물', emojis: ['🌱','🌿','🌳','🍁','🍂','⛺🍁'], stages: ['씨앗','나무','초록 잎','붉은 단풍','낙엽 나무','캠핑 나무'], color: '#FFEDD5' },
  { id: 'lily', name: '백합', category: '식물', emojis: ['🌱','🌿','🪴','🌼','💐','✨🌼'], stages: ['씨앗','새싹','줄기','꽃봉오리','순백의 백합','은하수 백합'], color: '#F8FAFC' },
  { id: 'clover', name: '클로버', category: '식물', emojis: ['🌱','☘️','🍀','🐞🍀','🧚🍀','✨🍀'], stages: ['새싹','세잎 클로버','네잎 클로버','무당벌레 클로버','요정 클로버','행운의 평원'], color: '#ECFDF5' },
  { id: 'lavender', name: '라벤더', category: '식물', emojis: ['🌱','🌿','🪴','🌾','🟣','✨🌾'], stages: ['씨앗','새싹','줄기','보랏빛 봉오리','라벤더 꽃','보라색 평원'], color: '#F5F3FF' },
  { id: 'cat', name: '고양이', category: '동물', emojis: ['🍼','🐱','🐈','🧶🐈','👑🐈','✨🐈'], stages: ['아기 고양이','어린 고양이','산책 고양이','장난꾸러기','고양이 대장','전설의 고양이'], color: '#F1F5F9' },
  { id: 'dog', name: '강아지', category: '동물', emojis: ['🍼','🐶','🐕','🥏🐕','🦮','✨🐕'], stages: ['아기 강아지','꼬마 강아지','달리는 강아지','원반왕 강아지','듬직한 강아지','히어로 강아지'], color: '#FFFBEB' },
  { id: 'rabbit', name: '토끼', category: '동물', emojis: ['🍼','🐰','🐇','🥕🐇','🎩🐰','✨🐰'], stages: ['아기 토끼','쫑긋 토끼','깡총 토끼','당근 냠냠','마술사 토끼','달나라 토끼'], color: '#FFF7ED' },
  { id: 'bear', name: '곰', category: '동물', emojis: ['🍼','🐻','🍯🐻','🐻‍❄️','🐾🐻','✨🐻'], stages: ['아기 곰','꼬마 곰','꿀단지 곰','듬직한 백곰','어른 곰','숲의 수호신'], color: '#FAFAF9' },
  { id: 'panda', name: '판다', category: '동물', emojis: ['🍼','🐼','🎋🐼','💤🐼','🐼🎾','✨🐼'], stages: ['꼬맹이 판다','대나무꾼','잠꾸러기','데굴데굴','판다 대장','우주 판다'], color: '#F8FAFC' },
  { id: 'penguin', name: '펭귄', category: '동물', emojis: ['🥚','🐣','🐧','🐟🐧','❄️🐧','✨🐧'], stages: ['알','아기 펭귄','뒤뚱뒤뚱','사냥꾼 펭귄','남극의 왕','얼음 황제'], color: '#F0F9FF' },
  { id: 'hamster', name: '햄스터', category: '동물', emojis: ['🍼','🐹','🐹🌻','🐹🐹','🏠🐹','✨🐹'], stages: ['아기 햄찌','해씨 냠냠','볼빵빵 햄찌','햄스터 친구들','햄스터 하우스','전설의 햄찌'], color: '#FFF7ED' },
  { id: 'chick', name: '병아리', category: '동물', emojis: ['🥚','🐣','🐥','🐤','🐔','✨🐓'], stages: ['알','탄생','솜털 병아리','삐약삐약','어른 닭','황금 수탉'], color: '#FEFCE8' },
  { id: 'fox', name: '사막여우', category: '동물', emojis: ['🍼','🦊','🏜️🦊','💤🦊','👑🦊','✨🦊'], stages: ['아기 여우','귀가 큰 여우','모래놀이','잠꾸러기','사막의 왕','신비한 여우'], color: '#FFF7ED' },
  { id: 'quokka', name: '쿼카', category: '동물', emojis: ['🍼','🐹','🐹🤳','🐹🌿','🐹✨','✨🏆'], stages: ['아기 쿼카','방긋 쿼카','셀카왕 쿼카','잎사귀 냠냠','웃음 대장','행복 전도사'], color: '#F5F5F4' },
];

const ROUTINE_TEMPLATES = [
  { task: '이불 개기', icon: '🛏️', points: 10, cat: '생활' },
  { task: '양치하기', icon: '🪥', points: 20, cat: '생활' },
  { task: '세수하기', icon: '🧼', points: 10, cat: '생활' },
  { task: '기지개 켜기', icon: '🤸', points: 10, cat: '생활' },
  { task: '옷 갈아입기', icon: '👕', points: 20, cat: '생활' },
  { task: '머리 빗기', icon: '🪮', points: 10, cat: '생활' },
  { task: '신발 정리', icon: '👟', points: 10, cat: '생활' },
  { task: '비타민 먹기', icon: '💊', points: 10, cat: '생활' },
  { task: '가방 챙기기', icon: '🎒', points: 20, cat: '생활' },
  { task: '물 마시기', icon: '💧', points: 10, cat: '생활' },
  { task: '손 씻기', icon: '🫧', points: 10, cat: '생활' },
  { task: '목욕하기', icon: '🛁', points: 30, cat: '생활' },
  { task: '방 청소하기', icon: '🧹', points: 30, cat: '생활' },
  { task: '장난감 정리', icon: '🧸', points: 20, cat: '생활' },
  { task: '불 끄고 눕기', icon: '💡', points: 20, cat: '생활' },
  { task: '숙제하기', icon: '✏️', points: 30, cat: '학습' },
  { task: '독서 30분', icon: '📚', points: 30, cat: '학습' },
  { task: '학습지 풀기', icon: '📖', points: 30, cat: '학습' },
  { task: '일기 쓰기', icon: '📓', points: 30, cat: '학습' },
  { task: '영어 단어', icon: '🔤', points: 20, cat: '학습' },
  { task: '악기 연습', icon: '🎹', points: 30, cat: '학습' },
  { task: '그림 그리기', icon: '🎨', points: 20, cat: '학습' },
  { task: '알림장 확인', icon: '📝', points: 10, cat: '학습' },
  { task: '수학 문제', icon: '🔢', points: 30, cat: '학습' },
  { task: '한자 공부', icon: '🈵', points: 20, cat: '학습' },
  { task: '인사 잘하기', icon: '🙋', points: 20, cat: '마음' },
  { task: '부모님 안마', icon: '💆', points: 30, cat: '마음' },
  { task: '감사한 일 말하기', icon: '🙏', points: 20, cat: '마음' },
  { task: '식물 물주기', icon: '🪴', points: 20, cat: '마음' },
  { task: '거울 보고 웃기', icon: '🪞', points: 10, cat: '마음' },
  { task: '심부름 하기', icon: '🧺', points: 30, cat: '마음' },
  { task: '반려동물 챙기기', icon: '🦴', points: 20, cat: '마음' },
  { task: '친구 칭찬하기', icon: '👍', points: 20, cat: '마음' },
  { task: '고운 말 쓰기', icon: '🗣️', points: 20, cat: '마음' },
  { task: '식탁 닦기', icon: '🧻', points: 20, cat: '마음' },
  { task: '줄넘기 하기', icon: '➰', points: 30, cat: '운동' },
  { task: '스트레칭', icon: '🧘', points: 20, cat: '운동' },
  { task: '축구 연습', icon: '⚽', points: 30, cat: '운동' },
  { task: '동네 산책', icon: '👟', points: 30, cat: '운동' },
  { task: '제자리 뛰기', icon: '🏃', points: 20, cat: '운동' },
];

const DEFAULT_AM = [
  { id: 'am1', task: '이불 개기', points: 10, icon: '🛏️', done: false },
  { id: 'am2', task: '양치하기', points: 20, icon: '🪥', done: false },
];

const DEFAULT_PM = [
  { id: 'pm1', task: '장난감 정리', points: 20, icon: '🧸', done: false },
  { id: 'pm2', task: '책 한 권 읽기', points: 30, icon: '📚', done: false },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(0);
  const [currentThemeId, setCurrentThemeId] = useState('sunflower');
  const [amRoutines, setAmRoutines] = useState(DEFAULT_AM);
  const [pmRoutines, setPmRoutines] = useState(DEFAULT_PM);
  const [history, setHistory] = useState([]); 
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [settingsTab, setSettingsTab] = useState('themes'); 
  const [statsPeriod, setStatsPeriod] = useState('week'); 
  
  const [modalType, setModalType] = useState(null); 
  const [templateTarget, setTemplateTarget] = useState(null); 
  const [pinInput, setPinInput] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;

    // RULE 1: Consistent Path
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScore(data.score || 0);
        setCurrentThemeId(data.themeId || 'sunflower');
        setAmRoutines(data.amRoutines || DEFAULT_AM);
        setPmRoutines(data.pmRoutines || DEFAULT_PM);
        setHistory(data.history || []);
      } else {
        saveData(0, 'sunflower', DEFAULT_AM, DEFAULT_PM, []);
      }
    }, (err) => console.error("Firestore Error", err));

    return () => unsubscribe();
  }, [user]);

  const saveData = async (s, tId, am, pm, hist) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), {
        score: s,
        themeId: tId,
        amRoutines: am,
        pmRoutines: pm,
        history: hist,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Save Error", err);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const currentTheme = useMemo(() => 
    ALL_THEMES.find(t => t.id === currentThemeId) || ALL_THEMES[0]
  , [currentThemeId]);

  const stageIndex = Math.min(Math.floor(score / 100), currentTheme.stages.length - 1);
  const progress = (score % 100);

  const completeRoutine = (routineId, type) => {
    const today = new Date().toISOString().split('T')[0];
    let newScore = score;
    let newAm = [...amRoutines];
    let newPm = [...pmRoutines];
    let newHist = [...history];

    const targetList = type === 'am' ? newAm : newPm;
    const rIdx = targetList.findIndex(r => r.id === routineId);
    
    if (rIdx > -1 && !targetList[rIdx].done) {
      targetList[rIdx].done = true;
      newScore += targetList[rIdx].points;
      
      const histIdx = newHist.findIndex(h => h.date === today);
      if (histIdx > -1) {
        newHist[histIdx][type === 'am' ? 'amCount' : 'pmCount'] += 1;
      } else {
        newHist.push({ date: today, amCount: type === 'am' ? 1 : 0, pmCount: type === 'pm' ? 1 : 0 });
      }

      setScore(newScore);
      type === 'am' ? setAmRoutines(newAm) : setPmRoutines(newPm);
      setHistory(newHist);
      saveData(newScore, currentThemeId, newAm, newPm, newHist);
      showToast(`✨ ${targetList[rIdx].task} 완료! +${targetList[rIdx].points}점!`);
    }
    setModalType(null);
  };

  const handlePinSubmit = () => {
    if (pinInput === '0000') {
      setActiveTab('settings');
      setModalType(null);
      setPinInput('');
    } else {
      showToast('❌ PIN 번호가 틀렸습니다.');
      setPinInput('');
    }
  };

  const deleteRoutine = (id, type) => {
    const newAm = type === 'am' ? amRoutines.filter(r => r.id !== id) : amRoutines;
    const newPm = type === 'pm' ? pmRoutines.filter(r => r.id !== id) : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history);
  };

  const updateRoutineField = (id, type, field, value) => {
    const newAm = type === 'am' ? amRoutines.map(r => r.id === id ? { ...r, [field]: value } : r) : amRoutines;
    const newPm = type === 'pm' ? pmRoutines.map(r => r.id === id ? { ...r, [field]: value } : r) : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history);
  };

  const addTemplateRoutine = (template) => {
    const newRoutine = { id: Date.now().toString(), ...template, done: false };
    const newAm = templateTarget === 'am' ? [...amRoutines, newRoutine] : amRoutines;
    const newPm = templateTarget === 'pm' ? [...pmRoutines, newRoutine] : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history);
    setModalType(null);
    showToast(`✅ ${template.task} 추가 완료!`);
  };

  const renderStats = () => {
    const displayCount = statsPeriod === 'week' ? 7 : statsPeriod === 'month' ? 30 : 12;
    const data = history.length > 0 ? history : Array.from({length: 7}, (_, i) => ({
      date: `2024-01-0${i+1}`, amCount: 0, pmCount: 0
    }));
    const maxVal = Math.max(...data.map(d => d.amCount + d.pmCount), 1);

    return (
      <div className="flex flex-col h-full space-y-6">
        <div className="flex justify-center space-x-2 bg-slate-100 p-1 rounded-xl">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setStatsPeriod(p)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${statsPeriod === p ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>{p === 'week' ? '주간' : p === 'month' ? '월간' : '연간'}</button>
          ))}
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6 flex items-end justify-between space-x-2 min-h-[200px]">
          {data.slice(-displayCount).map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="w-full flex flex-col-reverse items-center space-y-reverse space-y-1">
                <div style={{ height: `${(d.amCount / maxVal) * 120}px` }} className="w-full max-w-[12px] bg-amber-400 rounded-t-full transition-all duration-500" />
                <div style={{ height: `${(d.pmCount / maxVal) * 120}px` }} className="w-full max-w-[12px] bg-indigo-400 rounded-t-full transition-all duration-500" />
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium truncate w-full text-center">{(d.date && d.date.includes('-')) ? d.date.split('-')[2] : i+1}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-4 text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-amber-400 rounded-full" /><span>오전 사부작</span></div>
          <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-indigo-400 rounded-full" /><span>오후 사부작</span></div>
        </div>
      </div>
    );
  };

  const todayDate = new Date();
  const dateString = todayDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 flex flex-col items-center overflow-x-hidden">
      {toast && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-orange-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce">{toast}</div>}
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col border border-slate-100">
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
          <div className="flex flex-col">
            <span className="text-orange-500 font-black text-2xl tracking-tighter">SABUJAK</span>
            <span className="text-slate-400 text-sm font-medium">{dateString}</span>
          </div>
          <button onClick={() => activeTab === 'home' ? setModalType('pin') : setActiveTab('home')} className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all">{activeTab === 'home' ? <Settings size={24} /> : <X size={24} />}</button>
        </header>

        {activeTab === 'home' ? (
          <main className="flex flex-col md:flex-row p-6 sm:p-8 gap-8 h-full min-h-[600px]">
            <div className="flex flex-col gap-6 w-full md:w-1/3">
              <button onClick={() => setModalType('am')} className="flex-1 group relative overflow-hidden bg-amber-50 hover:bg-amber-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all border-2 border-transparent hover:border-amber-200">
                <div className="p-5 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform"><Sun size={40} className="text-amber-500" /></div>
                <span className="text-xl font-black text-amber-700">오전 사부작</span>
                <span className="text-sm text-amber-600 font-bold opacity-70">시작하기</span>
              </button>
              <button onClick={() => setModalType('pm')} className="flex-1 group relative overflow-hidden bg-indigo-50 hover:bg-indigo-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all border-2 border-transparent hover:border-indigo-200">
                <div className="p-5 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform"><Moon size={40} className="text-indigo-500" /></div>
                <span className="text-xl font-black text-indigo-700">오후 사부작</span>
                <span className="text-sm text-indigo-600 font-bold opacity-70">마무리하기</span>
              </button>
            </div>
            <div className="flex-1 bg-white rounded-[40px] border-4 border-slate-50 p-8 flex flex-col items-center justify-between shadow-inner relative">
              <div className="absolute top-6 right-8 bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-black">LEVEL {stageIndex + 1}</div>
              <div className="w-full text-center">
                <h2 className="text-2xl font-black text-slate-800">{currentTheme.name}</h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{currentTheme.category}</p>
              </div>
              <div className="flex flex-col items-center py-10">
                <div className="text-[120px] leading-none mb-6 animate-pulse transition-all transform hover:scale-110 cursor-default select-none">{currentTheme.emojis[stageIndex]}</div>
                <div className="bg-green-100 text-green-700 px-6 py-2 rounded-2xl font-black text-xl">{currentTheme.stages[stageIndex]}</div>
              </div>
              <div className="w-full space-y-4">
                <div className="flex justify-between items-end mb-1"><span className="text-sm font-black text-slate-500">GROWTH PROGRESS</span><span className="text-2xl font-black text-orange-600">{progress}%</span></div>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner"><div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                <div className="text-center text-slate-400 font-bold text-sm">TOTAL: <span className="text-slate-800">{score}</span> POINTS</div>
              </div>
            </div>
          </main>
        ) : (
          <div className="flex flex-col h-full min-h-[600px]">
            <nav className="flex px-8 border-b border-slate-50 bg-slate-50/50">
              {['themes', 'routines', 'stats'].map(t => (
                <button key={t} onClick={() => setSettingsTab(t)} className={`px-6 py-5 text-sm font-black transition-all relative ${settingsTab === t ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'themes' ? '성장 테마' : t === 'routines' ? '루틴 관리' : '활동 통계'}{settingsTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-t-full" />}</button>
              ))}
            </nav>
            <div className="p-8 flex-1 overflow-y-auto max-h-[500px]">
              {settingsTab === 'themes' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ALL_THEMES.map(theme => (
                    <button key={theme.id} onClick={() => { setCurrentThemeId(theme.id); saveData(score, theme.id, amRoutines, pmRoutines, history); }} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${currentThemeId === theme.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}><span className="text-4xl">{theme.emojis[5]}</span><span className="font-bold text-sm text-slate-800">{theme.name}</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{theme.category}</span></button>
                  ))}
                </div>
              )}
              {settingsTab === 'routines' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-black text-lg text-amber-600 flex items-center gap-2"><Sun size={20}/> 오전 루틴</h3><button onClick={() => { setModalType('template'); setTemplateTarget('am'); }} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100"><Plus size={20}/></button></div>
                    <div className="space-y-2">
                      {amRoutines.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-3"><span className="text-2xl">{r.icon}</span><span className="font-bold text-slate-700">{r.task}</span></div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-100 focus-within:border-orange-300 transition-colors">
                              <Hash size={14} className="text-slate-400 mr-1" />
                              <input type="number" value={r.points} onChange={(e) => updateRoutineField(r.id, 'am', 'points', parseInt(e.target.value) || 0)} className="w-12 py-1 bg-transparent text-sm font-black text-orange-600 outline-none text-right" />
                              <span className="text-[10px] font-black text-slate-400 ml-1">PT</span>
                            </div>
                            <button onClick={() => deleteRoutine(r.id, 'am')} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-black text-lg text-indigo-600 flex items-center gap-2"><Moon size={20}/> 오후 루틴</h3><button onClick={() => { setModalType('template'); setTemplateTarget('pm'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"><Plus size={20}/></button></div>
                    <div className="space-y-2">
                      {pmRoutines.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-3"><span className="text-2xl">{r.icon}</span><span className="font-bold text-slate-700">{r.task}</span></div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-100 focus-within:border-indigo-300 transition-colors">
                              <Hash size={14} className="text-slate-400 mr-1" />
                              <input type="number" value={r.points} onChange={(e) => updateRoutineField(r.id, 'pm', 'points', parseInt(e.target.value) || 0)} className="w-12 py-1 bg-transparent text-sm font-black text-indigo-600 outline-none text-right" />
                              <span className="text-[10px] font-black text-slate-400 ml-1">PT</span>
                            </div>
                            <button onClick={() => deleteRoutine(r.id, 'pm')} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'stats' && renderStats()}
            </div>
          </div>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {modalType === 'pin' && (
              <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6"><Settings size={32} /></div>
                <h3 className="text-2xl font-black mb-2 text-slate-800">부모님 확인</h3>
                <p className="text-slate-400 text-center font-bold text-sm mb-6">설정을 변경하려면 PIN 번호(0000)를<br/>입력해 주세요.</p>
                <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-2xl font-black focus:border-orange-500 outline-none transition-all" placeholder="PIN 번호" autoFocus />
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <button onClick={() => setModalType(null)} className="py-4 bg-slate-50 text-slate-400 font-black rounded-2xl">닫기</button>
                  <button onClick={handlePinSubmit} className="py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-200">확인</button>
                </div>
              </div>
            )}
            {modalType === 'template' && (
              <div className="flex flex-col h-[80vh] max-h-[600px]">
                <div className="p-8 bg-orange-50 flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="bg-white p-3 rounded-2xl shadow-sm"><Sparkles className="text-orange-500"/></div><h3 className="text-xl font-black text-orange-700">루틴 추천 템플릿</h3></div>
                  <button onClick={() => setModalType(null)} className="text-slate-400"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6"><div className="grid grid-cols-2 gap-3">{ROUTINE_TEMPLATES.map((tmpl, i) => (<button key={i} onClick={() => addTemplateRoutine(tmpl)} className="flex flex-col items-start p-4 bg-white border border-slate-100 rounded-3xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"><div className="flex items-center justify-between w-full mb-2"><span className="text-3xl">{tmpl.icon}</span><span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-full text-slate-400 uppercase">{tmpl.cat}</span></div><span className="font-black text-slate-700 text-sm leading-tight">{tmpl.task}</span><span className="text-[10px] font-black text-orange-500 mt-1">+{tmpl.points} PT</span></button>))}</div></div>
                <div className="p-6 bg-slate-50/50"><button onClick={() => setModalType(null)} className="w-full py-5 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-3xl">나중에 추가하기</button></div>
              </div>
            )}
            {(modalType === 'am' || modalType === 'pm') && (
              <div className="flex flex-col h-[80vh] max-h-[600px]">
                <div className={`p-8 ${modalType === 'am' ? 'bg-amber-50' : 'bg-indigo-50'} flex justify-between items-center`}><div className="flex items-center gap-4"><div className="bg-white p-3 rounded-2xl shadow-sm">{modalType === 'am' ? <Sun className="text-amber-500"/> : <Moon className="text-indigo-500"/>}</div><h3 className={`text-xl font-black ${modalType === 'am' ? 'text-amber-700' : 'text-indigo-700'}`}>{modalType === 'am' ? '오전 사부작' : '오후 사부작'}</h3></div><button onClick={() => setModalType(null)} className="text-slate-400"><X size={24}/></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {(modalType === 'am' ? amRoutines : pmRoutines).map(routine => (
                    <button key={routine.id} onClick={() => !routine.done && completeRoutine(routine.id, modalType)} disabled={routine.done} className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${routine.done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-md'}`}>
                      <div className="flex items-center gap-4"><span className="text-3xl">{routine.icon}</span><div className="flex flex-col items-start"><span className={`font-black ${routine.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{routine.task}</span><span className="text-xs font-black text-orange-500">+{routine.points} POINTS</span></div></div>
                      {routine.done ? <CheckCircle2 className="text-green-500" size={28}/> : <Circle className="text-slate-200" size={28}/>}
                    </button>
                  ))}
                </div>
                <div className="p-6 bg-slate-50/50"><button onClick={() => setModalType(null)} className="w-full py-5 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-3xl shadow-sm">나중에 하기</button></div>
              </div>
            )}
          </div>
        </div>
      )}
      <footer className="mt-8 text-slate-300 font-black text-[10px] tracking-[0.3em] uppercase">Small habits create big changes</footer>
    </div>
  );
}