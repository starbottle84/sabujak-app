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
  Hash,
  Lock,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = {
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
const appId = 'sabujak-app-v1';

// --- Data: 20 Themes ---
const ALL_THEMES = [
  { id: 'sunflower', name: '해바라기', category: '식물', emojis: ['🌱','🌿','🪴','🌻','🐝🌻','✨🌻'], images: [null, null, null, null, null, null], stages: ['씨앗','새싹','줄기','꽃봉오리','활짝 핀 꽃','눈부신 해바라기'] },
  { id: 'cat', name: '고양이', category: '동물', emojis: ['🍼','🐱','🐈','🧶🐈','👑🐈','✨🐈'], images: [null, null, null, null, null, null], stages: ['아기 고양이','어린 고양이','산책 고양이','장난꾸러기','고양이 대장','전설의 고양이'] },
  { id: 'dog', name: '강아지', category: '동물', emojis: ['🍼','🐶','🐕','🥏🐕','🦮','✨🐕'], images: [null, null, null, null, null, null], stages: ['아기 강아지','꼬마 강아지','달리는 강아지','원반왕 강아지','듬직한 강아지','히어로 강아지'] },
  { id: 'rabbit', name: '토끼', category: '동물', emojis: ['🍼','🐰','🐇','🥕🐇','🎩🐰','✨🐰'], images: [null, null, null, null, null, null], stages: ['아기 토끼','쫑긋 토끼','깡총 토끼','당근 냠냠','마술사 토끼','달나라 토끼'] },
  { id: 'panda', name: '판다', category: '동물', emojis: ['🍼','🐼','🎋🐼','💤🐼','🐼🎾','✨🐼'], images: [null, null, null, null, null, null], stages: ['꼬맹이 판다','대나무꾼','잠꾸러기','데굴데굴','판다 대장','우주 판다'] },
];

const ROUTINE_TEMPLATES = [
  { task: '이불 개기', icon: '🛏️', points: 10, cat: '생활' },
  { task: '양치하기', icon: '🪥', points: 20, cat: '생활' },
  { task: '세수하기', icon: '🧼', points: 10, cat: '생활' },
  { task: '옷 갈아입기', icon: '👕', points: 20, cat: '생활' },
  { task: '신발 정리', icon: '👟', points: 10, cat: '생활' },
  { task: '숙제하기', icon: '✏️', points: 30, cat: '학습' },
  { task: '독서 30분', icon: '📚', points: 30, cat: '학습' },
  { task: '일기 쓰기', icon: '📓', points: 30, cat: '학습' },
  { task: '인사 잘하기', icon: '🙋', points: 20, cat: '마음' },
  { task: '심부름 하기', icon: '🧺', points: 30, cat: '마음' },
  { task: '줄넘기 하기', icon: '➰', points: 30, cat: '운동' },
  { task: '스트레칭', icon: '🧘', points: 20, cat: '운동' },
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(0);
  const [currentThemeId, setCurrentThemeId] = useState('sunflower');
  const [amRoutines, setAmRoutines] = useState(DEFAULT_AM);
  const [pmRoutines, setPmRoutines] = useState(DEFAULT_PM);
  const [history, setHistory] = useState([]); 
  const [parentPin, setParentPin] = useState('0000');
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [settingsTab, setSettingsTab] = useState('themes'); 
  const [modalType, setModalType] = useState(null); 
  const [templateTarget, setTemplateTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Splash Loading & Auth Initialization
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    
    const initAuth = async () => {
        try {
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
        } catch (err) {
            console.error("Auth Error:", err);
            if (err.code === 'auth/unauthorized-domain') {
                showToast("⚠️ Firebase 콘솔에서 현재 도메인을 '승인된 도메인'에 추가해야 합니다.");
            }
        }
    };
    initAuth();

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // 2. Sync Data with Firestore (RULE 1: 6 segments path)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScore(data.score || 0);
        setCurrentThemeId(data.themeId || 'sunflower');
        setAmRoutines(data.amRoutines || DEFAULT_AM);
        setPmRoutines(data.pmRoutines || DEFAULT_PM);
        setHistory(data.history || []);
        setParentPin(data.parentPin || '0000');
      } else {
        saveData(0, 'sunflower', DEFAULT_AM, DEFAULT_PM, [], '0000');
      }
    }, (err) => {
        console.error("Firestore Loading Error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const saveData = async (s, tId, am, pm, hist, pin) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), {
        score: s,
        themeId: tId,
        amRoutines: am,
        pmRoutines: pm,
        history: hist,
        parentPin: pin || parentPin,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore Save Error:", err);
      if (err.code === 'permission-denied') {
          showToast("❌ 저장 권한이 없습니다. Firebase 설정을 확인하세요.");
      }
    }
  };

  const login = async (providerName) => {
    try {
      if (providerName === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else if (providerName === 'anonymous') {
        await signInAnonymously(auth);
      } else {
        showToast(`${providerName} 연동은 곧 지원될 예정입니다.`);
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
          showToast("⚠️ 이 도메인은 승인되지 않았습니다. Firebase 콘솔 설정을 확인하세요.");
      } else {
          showToast("로그인 중 오류가 발생했습니다.");
      }
    }
  };

  const currentTheme = useMemo(() => 
    ALL_THEMES.find(t => t.id === currentThemeId) || ALL_THEMES[0]
  , [currentThemeId]);

  const stageIndex = Math.min(Math.floor(score / 100), currentTheme.stages.length - 1);
  const progress = (score % 100);

  const completeRoutine = (routineId, type) => {
    const today = new Date().toISOString().split('T')[0];
    const targetRoutine = type === 'am' ? amRoutines.find(r=>r.id===routineId) : pmRoutines.find(r=>r.id===routineId);
    
    if (!targetRoutine || targetRoutine.done) return;

    let newScore = score + targetRoutine.points;
    let newAm = amRoutines.map(r => r.id === routineId ? {...r, done: true} : r);
    let newPm = pmRoutines.map(r => r.id === routineId ? {...r, done: true} : r);
    
    const newHist = [...history];
    const histIdx = newHist.findIndex(h => h.date === today);
    if (histIdx > -1) {
      newHist[histIdx][type === 'am' ? 'amCount' : 'pmCount'] += 1;
    } else {
      newHist.push({ date: today, amCount: type === 'am' ? 1 : 0, pmCount: type === 'pm' ? 1 : 0 });
    }

    setScore(newScore);
    saveData(newScore, currentThemeId, newAm, newPm, newHist, parentPin);
    showToast(`✨ ${targetRoutine.task} 완료! +${targetRoutine.points}점!`);
    setModalType(null);
  };

  const deleteRoutine = (id, type) => {
    const newAm = type === 'am' ? amRoutines.filter(r => r.id !== id) : amRoutines;
    const newPm = type === 'pm' ? pmRoutines.filter(r => r.id !== id) : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history, parentPin);
  };

  const updateRoutineField = (id, type, field, value) => {
    const newAm = type === 'am' ? amRoutines.map(r => r.id === id ? { ...r, [field]: value } : r) : amRoutines;
    const newPm = type === 'pm' ? pmRoutines.map(r => r.id === id ? { ...r, [field]: value } : r) : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history, parentPin);
  };

  const addTemplateRoutine = (template) => {
    const newRoutine = { id: Date.now().toString(), ...template, done: false };
    const newAm = templateTarget === 'am' ? [...amRoutines, newRoutine] : amRoutines;
    const newPm = templateTarget === 'pm' ? [...pmRoutines, newRoutine] : pmRoutines;
    setAmRoutines(newAm);
    setPmRoutines(newPm);
    saveData(score, currentThemeId, newAm, newPm, history, parentPin);
    setModalType(null);
    showToast(`✅ ${template.task} 추가 완료!`);
  };

  const handlePinSubmit = () => {
    if (pinInput === parentPin) {
      setActiveTab('settings');
      setModalType(null);
      setPinInput('');
    } else {
      showToast('❌ 비밀번호가 틀렸습니다.');
      setPinInput('');
    }
  };

  // --- Views ---

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200]">
        <div className="w-32 h-32 bg-orange-100 rounded-[40px] flex items-center justify-center mb-8 animate-bounce">
          <ImageIcon size={64} className="text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-orange-500 tracking-tighter mb-2">SABUJAK</h1>
        <p className="text-slate-400 font-bold animate-pulse">우리 아이 습관 도우미</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[50px] shadow-2xl p-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">반가워요!</h2>
          <p className="text-slate-400 font-bold mb-10 text-center">아이와 함께 습관을 만들고<br/>캐릭터를 성장시켜 보세요.</p>
          <div className="w-full space-y-3">
            <button onClick={() => login('google')} className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-50 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> 구글로 시작하기
            </button>
            <button onClick={() => login('anonymous')} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">익명으로 시작하기</button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => login('naver')} className="py-4 bg-[#03C75A] text-white rounded-2xl font-bold text-sm">네이버</button>
              <button onClick={() => login('kakao')} className="py-4 bg-[#FEE500] text-slate-900 rounded-2xl font-bold text-sm">카카오</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 flex flex-col items-center">
      {toast && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-orange-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce text-center max-w-[90vw]">{toast}</div>}
      
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
          <div className="flex flex-col">
            <span className="text-orange-500 font-black text-2xl tracking-tighter">SABUJAK</span>
            <span className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => auth.signOut()} className="p-3 text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
            <button onClick={() => activeTab === 'home' ? setModalType('pin') : setActiveTab('home')} className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:text-orange-600 transition-all">{activeTab === 'home' ? <Settings size={24} /> : <X size={24} />}</button>
          </div>
        </header>

        {activeTab === 'home' ? (
          <main className="flex flex-col md:flex-row p-6 sm:p-8 gap-8 h-full min-h-[600px]">
            <div className="flex flex-col gap-6 w-full md:w-1/3">
              <button onClick={() => setModalType('am')} className="flex-1 group bg-amber-50 hover:bg-amber-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all">
                <div className="p-5 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform"><Sun size={40} className="text-amber-500" /></div>
                <span className="text-xl font-black text-amber-700">오전 사부작</span>
                <span className="text-sm text-amber-600 font-bold opacity-70">시작하기</span>
              </button>
              <button onClick={() => setModalType('pm')} className="flex-1 group bg-indigo-50 hover:bg-indigo-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all">
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
                <div className="mb-6 transform hover:scale-110 transition-transform">
                  {currentTheme.images?.[stageIndex] ? (
                    <img src={currentTheme.images[stageIndex]} alt="stage" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="text-[120px] leading-none animate-pulse">{currentTheme.emojis[stageIndex]}</div>
                  )}
                </div>
                <div className="bg-green-100 text-green-700 px-6 py-2 rounded-2xl font-black text-xl">{currentTheme.stages[stageIndex]}</div>
              </div>
              <div className="w-full space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-black text-slate-500">GROWTH PROGRESS</span>
                  <span className="text-2xl font-black text-orange-600">{progress}%</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-center text-slate-400 font-bold text-sm">TOTAL: <span className="text-slate-800">{score}</span> POINTS</div>
              </div>
            </div>
          </main>
        ) : (
          /* Settings View */
          <div className="flex flex-col h-full min-h-[600px]">
            <nav className="flex px-8 border-b border-slate-50 bg-slate-50/50">
              {['themes', 'routines', 'security'].map(t => (
                <button key={t} onClick={() => setSettingsTab(t)} className={`px-6 py-5 text-sm font-black transition-all relative ${settingsTab === t ? 'text-orange-600' : 'text-slate-400'}`}>
                  {t === 'themes' ? '테마' : t === 'routines' ? '루틴' : '보안'}
                  {settingsTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-t-full" />}
                </button>
              ))}
            </nav>
            <div className="p-8 flex-1 overflow-y-auto max-h-[500px]">
              {settingsTab === 'security' && (
                <div className="max-w-sm mx-auto space-y-6 text-center">
                   <div className="p-4 bg-slate-100 rounded-3xl text-slate-400 inline-block mb-4"><Lock size={32}/></div>
                   <h3 className="text-xl font-black mb-4">부모님 비밀번호 변경</h3>
                   <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} maxLength={4} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black mb-4 outline-none focus:border-orange-500" placeholder="새 번호 (4자리)" />
                   <button onClick={()=>{setParentPin(pinInput); saveData(score, currentThemeId, amRoutines, pmRoutines, history, pinInput); showToast("🔒 비밀번호가 변경되었습니다."); setPinInput('');}} className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg">비밀번호 저장</button>
                </div>
              )}
              {settingsTab === 'themes' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ALL_THEMES.map(theme => (
                    <button key={theme.id} onClick={() => { setCurrentThemeId(theme.id); saveData(score, theme.id, amRoutines, pmRoutines, history, parentPin); }} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${currentThemeId === theme.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                      <span className="text-4xl">{theme.emojis[stageIndex] || theme.emojis[0]}</span>
                      <span className="font-bold text-sm">{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {settingsTab === 'routines' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-black text-lg text-amber-600 flex items-center gap-2"><Sun size={20}/> 오전 루틴</h3><button onClick={() => { setModalType('template'); setTemplateTarget('am'); }} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100"><Plus size={20}/></button></div>
                    <div className="space-y-2">
                      {amRoutines.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3"><span className="text-2xl">{r.icon}</span><span className="font-bold text-slate-700">{r.task}</span></div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-100 focus-within:border-orange-300">
                              <Hash size={14} className="text-slate-400 mr-1" />
                              <input type="number" value={r.points} onChange={(e) => updateRoutineField(r.id, 'am', 'points', parseInt(e.target.value) || 0)} className="w-12 py-1 bg-transparent text-sm font-black text-orange-600 outline-none text-right" />
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
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3"><span className="text-2xl">{r.icon}</span><span className="font-bold text-slate-700">{r.task}</span></div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-100 focus-within:border-indigo-300">
                              <Hash size={14} className="text-slate-400 mr-1" />
                              <input type="number" value={r.points} onChange={(e) => updateRoutineField(r.id, 'pm', 'points', parseInt(e.target.value) || 0)} className="w-12 py-1 bg-transparent text-sm font-black text-indigo-600 outline-none text-right" />
                            </div>
                            <button onClick={() => deleteRoutine(r.id, 'pm')} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType === 'pin' && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 flex flex-col items-center animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-6">부모님 확인</h3>
            <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} maxLength={4} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-3xl font-black mb-6 outline-none focus:border-orange-500" autoFocus />
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setModalType(null)} className="py-4 bg-slate-100 text-slate-400 font-black rounded-2xl">닫기</button>
              <button onClick={handlePinSubmit} className="py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-200">확인</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'template' && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-200">
            <div className="p-8 bg-orange-50 flex justify-between items-center">
              <div className="flex items-center gap-4"><h3 className="text-xl font-black text-orange-700">추천 템플릿</h3></div>
              <button onClick={() => setModalType(null)}><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3">
              {ROUTINE_TEMPLATES.map((tmpl, i) => (
                <button key={i} onClick={() => addTemplateRoutine(tmpl)} className="flex flex-col items-start p-4 bg-white border border-slate-100 rounded-3xl hover:border-orange-300 hover:bg-orange-50 text-left">
                  <span className="text-3xl mb-2">{tmpl.icon}</span>
                  <span className="font-black text-slate-700 text-sm leading-tight">{tmpl.task}</span>
                  <span className="text-[10px] font-black text-orange-500 mt-1">+{tmpl.points} PT</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(modalType === 'am' || modalType === 'pm') && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-200">
            <div className={`p-8 ${modalType === 'am' ? 'bg-amber-50' : 'bg-indigo-50'} flex justify-between items-center`}>
              <h3 className="text-xl font-black">{modalType === 'am' ? '오전 사부작' : '오후 사부작'}</h3>
              <button onClick={() => setModalType(null)}><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(modalType === 'am' ? amRoutines : pmRoutines).map(r => (
                <button key={r.id} onClick={() => !r.done && completeRoutine(r.id, modalType)} className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${r.done ? 'bg-slate-50 opacity-50 border-slate-100' : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-md'}`}>
                  <div className="flex items-center gap-4 text-left">
                    <span className="text-3xl">{r.icon}</span>
                    <div>
                      <div className={`font-black ${r.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{r.task}</div>
                      <div className="text-xs font-black text-orange-500">+{r.points} PT</div>
                    </div>
                  </div>
                  {r.done ? <CheckCircle2 className="text-green-500" size={28}/> : <Circle className="text-slate-200" size={28}/>}
                </button>
              ))}
              {(modalType === 'am' ? amRoutines : pmRoutines).length === 0 && <div className="text-center py-20 text-slate-300 font-bold">루틴이 없습니다. 설정에서 추가해 주세요!</div>}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-slate-300 font-black text-[10px] tracking-[0.3em] uppercase">Small habits create big changes</footer>
    </div>
  );
}
