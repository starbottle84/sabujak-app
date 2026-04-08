export const ALL_THEMES = [
  { 
    id: 'sunflower', 
    name: '해바라기', 
    category: '식물', 
    emojis: ['🌱','🌿','🪴','🌻','🐝🌻','✨🌻'], 
    images: [
      '/themes/sunflower/stage-1.png', 
      '/themes/sunflower/stage-2.png', 
      '/themes/sunflower/stage-3.png', 
      '/themes/sunflower/stage-4.png', 
      '/themes/sunflower/stage-5.png', 
      '/themes/sunflower/stage-6.png'
    ], 
    stages: ['씨앗','새싹','줄기','꽃봉오리','활짝 핀 꽃','눈부신 해바라기'] 
  },
  { id: 'cat', name: '고양이', category: '동물', emojis: ['🍼','🐱','🐈','🧶🐈','👑🐈','✨🐈'], images: [null, null, null, null, null, null], stages: ['아기 고양이','어린 고양이','산책 고양이','장난꾸러기','고양이 대장','전설의 고양이'] },
  { id: 'dog', name: '강아지', category: '동물', emojis: ['🍼','🐶','🐕','🥏🐕','🦮','✨🐕'], images: [null, null, null, null, null, null], stages: ['아기 강아지','꼬마 강아지','달리는 강아지','원반왕 강아지','듬직한 강아지','히어로 강아지'] },
  { id: 'rabbit', name: '토끼', category: '동물', emojis: ['🍼','🐰','🐇','🥕🐇','🎩🐰','✨🐰'], images: [null, null, null, null, null, null], stages: ['아기 토끼','쫑긋 토끼','깡총 토끼','당근 냠냠','마술사 토끼','달나라 토끼'] },
  { id: 'panda', name: '판다', category: '동물', emojis: ['🍼','🐼','🎋🐼','💤🐼','🐼🎾','✨🐼'], images: [null, null, null, null, null, null], stages: ['꼬맹이 판다','대나무꾼','잠꾸러기','데굴데굴','판다 대장','우주 판다'] },
];

export const ROUTINE_TEMPLATES = [
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

export const DEFAULT_AM = [
  { id: 'am1', task: '이불 개기', points: 10, icon: '🛏️', done: false },
  { id: 'am2', task: '양치하기', points: 20, icon: '🪥', done: false },
];

export const DEFAULT_PM = [
  { id: 'pm1', task: '장난감 정리', points: 20, icon: '🧸', done: false },
  { id: 'pm2', task: '책 한 권 읽기', points: 30, icon: '📚', done: false },
];
