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
const appId = 'sabujak-app-v1';

// --- Data: 20 Themes (이미지 필드 추가) ---
const ALL_THEMES = [
  { 
    id: 'sunflower', 
    name: '해바라기', 
    category: '식물', 
    emojis: ['🌱','🌿','🪴','🌻','🐝🌻','✨🌻'], 
    // 이미지 경로를 여기에 넣으세요. 없으면 이모지가 나옵니다.
    images: [null, null, null, null, null, null],
    stages: ['씨앗','새싹','줄기','꽃봉오리','활짝 핀 꽃','눈부신 해바라기'] 
  },
  { id: 'cat', name: '고양이', category: '동물', emojis: ['🍼','🐱','🐈','🧶🐈','👑🐈','✨🐈'], images: [null, null, null, null, null, null], stages: ['아기 고양이','어린 고양이','산책 고양이','장난꾸러기','고양이 대장','전설의 고양이'] },
  { id: 'dog', name: '강아지', category: '동물', emojis: ['🍼','🐶','🐕','🥏🐕','🦮','✨🐕'], images: [null, null, null, null, null, null], stages: ['아기 강아지','꼬마 강아지','달리는 강아지','원반왕 강아지','듬직한 강아지','히어로 강아지'] },
  // ... (다른 테마들도 동일하게 확장 가능)
];

const ROUTINE_TEMPLATES = [
  { task: '이불 개기', icon: '🛏️', points: 10, cat: '생활' },
  { task: '양치하기', icon: '🪥', points: 20, cat: '생활' },
  { task: '세수하기', icon: '🧼', points: 10, cat: '생활' },
  { task: '숙제하기', icon: '✏️', points: 30, cat: '학습' },
  { task: '독서 30분', icon: '📚', points: 30, cat: '학습' },
  { task: '부모님 안마', icon: '💆', points: 30, cat: '마음' },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(0);
  const [currentThemeId, setCurrentThemeId] = useState('sunflower');
  const [amRoutines, setAmRoutines] = useState([]);
  const [pmRoutines, setPmRoutines] = useState([]);
  const [history, setHistory] = useState([]); 
  const [parentPin, setParentPin] = useState('0000');
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [settingsTab, setSettingsTab] = useState('themes'); 
  const [modalType, setModalType] = useState(null); 
  const [pinInput, setPinInput] = useState('');
  const [toast, setToast] = useState(null);

  // 1. 초기 로딩 및 인증 체크
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500); // 2.5초간 로딩 화면 노출
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // 2. 데이터 동기화
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScore(data.score || 0);
        setCurrentThemeId(data.themeId || 'sunflower');
        setAmRoutines(data.amRoutines || []);
        setPmRoutines(data.pmRoutines || []);
        setHistory(data.history || []);
        setParentPin(data.parentPin || '0000');
      } else {
        saveData(0, 'sunflower', [], [], [], '0000');
      }
    }, (err) => console.error("데이터 로딩 실패:", err));

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
      console.error("저장 실패:", err);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const login = async (providerName) => {
    try {
      if (providerName === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else if (providerName === 'anonymous') {
        await signInAnonymously(auth);
      } else {
        showToast(`${providerName} 로그인은 현재 준비 중입니다.`);
      }
    } catch (err) {
      showToast("로그인에 실패했습니다.");
    }
  };

  const currentTheme = useMemo(() => 
    ALL_THEMES.find(t => t.id === currentThemeId) || ALL_THEMES[0]
  , [currentThemeId]);

  const stageIndex = Math.min(Math.floor(score / 100), currentTheme.stages.length - 1);
  const progress = (score % 100);

  const completeRoutine = (routineId, type) => {
    const today = new Date().toISOString().split('T')[0];
    let newScore = score + (type === 'am' ? amRoutines.find(r=>r.id===routineId).points : pmRoutines.find(r=>r.id===routineId).points);
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
    showToast(`✨ 사부작 완료! 성장에 한발짝 더!`);
    setModalType(null);
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

  // --- UI Components ---

  // 1. Loading Splash
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200]">
        <div className="w-32 h-32 bg-orange-100 rounded-[40px] flex items-center justify-center mb-8 animate-bounce">
          <ImageIcon size={64} className="text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-orange-500 tracking-tighter mb-2">SABUJAK</h1>
        <p className="text-slate-400 font-bold animate-pulse">오늘도 소중한 습관을 만들어요...</p>
      </div>
    );
  }

  // 2. Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[50px] shadow-2xl p-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg shadow-orange-200">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">반가워요!</h2>
          <p className="text-slate-400 font-bold mb-10 text-center">로그인하고 우리 아이의 성장을<br/>함께 기록해 보세요.</p>
          
          <div className="w-full space-y-3">
            <button onClick={() => login('google')} className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-slate-50 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> 구글로 시작하기
            </button>
            <button onClick={() => login('apple')} className="w-full py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:opacity-80 transition-all">
              <div className="w-5 h-5 flex items-center justify-center"></div> 애플로 시작하기
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => login('naver')} className="py-4 bg-[#03C75A] text-white rounded-2xl font-bold hover:opacity-90 transition-all text-sm">네이버 로그인</button>
              <button onClick={() => login('kakao')} className="py-4 bg-[#FEE500] text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all text-sm">카카오 로그인</button>
            </div>
            <button onClick={() => login('anonymous')} className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600">체험하기 (데이터 저장 안됨)</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 flex flex-col items-center">
      {toast && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-orange-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce text-center">{toast}</div>}
      
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col border border-slate-100">
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
          <div className="flex flex-col">
            <span className="text-orange-500 font-black text-2xl tracking-tighter">SABUJAK</span>
            <span className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => auth.signOut()} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
            <button onClick={() => activeTab === 'home' ? setModalType('pin') : setActiveTab('home')} className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all">{activeTab === 'home' ? <Settings size={24} /> : <X size={24} />}</button>
          </div>
        </header>

        {activeTab === 'home' ? (
          <main className="flex flex-col md:flex-row p-6 sm:p-8 gap-8 h-full min-h-[600px]">
            {/* 오전/오후 버튼 */}
            <div className="flex flex-col gap-6 w-full md:w-1/3">
              <button onClick={() => setModalType('am')} className="flex-1 group bg-amber-50 hover:bg-amber-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all border-2 border-transparent hover:border-amber-200">
                <div className="p-5 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform"><Sun size={40} className="text-amber-500" /></div>
                <span className="text-xl font-black text-amber-700">오전 사부작</span>
                <span className="text-sm text-amber-600 font-bold opacity-70">시작하기</span>
              </button>
              <button onClick={() => setModalType('pm')} className="flex-1 group bg-indigo-50 hover:bg-indigo-100 rounded-[32px] p-6 flex flex-col items-center justify-center transition-all border-2 border-transparent hover:border-indigo-200">
                <div className="p-5 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform"><Moon size={40} className="text-indigo-500" /></div>
                <span className="text-xl font-black text-indigo-700">오후 사부작</span>
                <span className="text-sm text-indigo-600 font-bold opacity-70">마무리하기</span>
              </button>
            </div>

            {/* 성장 창 (이미지 지원) */}
            <div className="flex-1 bg-white rounded-[40px] border-4 border-slate-50 p-8 flex flex-col items-center justify-between shadow-inner relative">
              <div className="absolute top-6 right-8 bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-black">LEVEL {stageIndex + 1}</div>
              
              <div className="w-full text-center">
                <h2 className="text-2xl font-black text-slate-800">{currentTheme.name}</h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{currentTheme.category}</p>
              </div>

              <div className="flex flex-col items-center py-10">
                <div className="mb-6 transition-all transform hover:scale-110 cursor-default select-none">
                  {currentTheme.images[stageIndex] ? (
                    <img src={currentTheme.images[stageIndex]} alt={currentTheme.stages[stageIndex]} className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="text-[120px] leading-none animate-pulse">{currentTheme.emojis[stageIndex]}</div>
                  )}
                </div>
                <div className="bg-green-100 text-green-700 px-6 py-2 rounded-2xl font-black text-xl">
                  {currentTheme.stages[stageIndex]}
                </div>
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
          /* 설정 화면 */
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
                <div className="max-w-sm mx-auto space-y-6">
                   <div className="flex flex-col items-center gap-4 py-6">
                     <div className="p-4 bg-slate-100 rounded-3xl text-slate-400"><Lock size={32}/></div>
                     <h3 className="text-xl font-black">부모님 비밀번호 변경</h3>
                   </div>
                   <div className="space-y-4">
                     <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} maxLength={4} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black outline-none focus:border-orange-500" placeholder="새 비밀번호 (4자리)" />
                     <button onClick={()=>{setParentPin(pinInput); saveData(score, currentThemeId, amRoutines, pmRoutines, history, pinInput); showToast("🔒 비밀번호가 변경되었습니다."); setPinInput('');}} className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg">비밀번호 저장</button>
                   </div>
                </div>
              )}
              {/* 테마 및 루틴 탭은 이전과 동일한 로직 유지 */}
              {settingsTab === 'themes' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ALL_THEMES.map(theme => (
                    <button key={theme.id} onClick={() => { setCurrentThemeId(theme.id); saveData(score, theme.id, amRoutines, pmRoutines, history, parentPin); }} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${currentThemeId === theme.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-100'}`}>
                      <span className="text-4xl">{theme.emojis[5]}</span>
                      <span className="font-bold text-sm">{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 모달: PIN 입력 / 루틴 선택 */}
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

      {/* 루틴 선택 모달 (오전/오후) */}
      {(modalType === 'am' || modalType === 'pm') && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col max-h-[80vh]">
            <div className={`p-8 ${modalType === 'am' ? 'bg-amber-50' : 'bg-indigo-50'} flex justify-between items-center`}>
              <h3 className="text-xl font-black">{modalType === 'am' ? '오전 사부작' : '오후 사부작'}</h3>
              <button onClick={() => setModalType(null)}><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(modalType === 'am' ? amRoutines : pmRoutines).map(r => (
                <button key={r.id} onClick={() => !r.done && completeRoutine(r.id, modalType)} className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${r.done ? 'bg-slate-50 opacity-50' : 'bg-white hover:border-orange-200'}`}>
                  <div className="flex items-center gap-4 text-left">
                    <span className="text-3xl">{r.icon}</span>
                    <div>
                      <div className={`font-black ${r.done ? 'line-through' : ''}`}>{r.task}</div>
                      <div className="text-xs font-black text-orange-500">+{r.points} PT</div>
                    </div>
                  </div>
                  {r.done ? <CheckCircle2 className="text-green-500" size={28}/> : <Circle className="text-slate-200" size={28}/>}
                </button>
              ))}
              {(modalType === 'am' ? amRoutines : pmRoutines).length === 0 && <div className="text-center py-20 text-slate-300 font-bold">등록된 루틴이 없습니다.</div>}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-slate-300 font-black text-[10px] tracking-[0.3em] uppercase">Small habits create big changes</footer>
    </div>
  );
}