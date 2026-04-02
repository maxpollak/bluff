import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, 
  collection, arrayUnion, arrayRemove, runTransaction 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Palette, Eraser, Undo2, Trophy, UserCircle, 
  Square, Circle, Triangle, Minus, Copy, Check, Flame, Info, Loader2, LogOut, X, MessageCircle
} from 'lucide-react';

// --- YOUR REAL FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDY2rHyxeEv3Ks6HRU6T0W9XGcHwyF_ii8",
  authDomain: "bluff-game-4014d.firebaseapp.com",
  projectId: "bluff-game-4014d",
  storageBucket: "bluff-game-4014d.firebasestorage.app",
  messagingSenderId: "436952634868",
  appId: "1:436952634868:web:ad21a066788a32c49fd5a1",
  measurementId: "G-4L3P4CE5ZQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PROMPT_PAIRS = [
  { id: "n1", normal: "What video game requires the most skill?", bluff: "What is a video game you would play with your kids?" },
  { id: "n2", normal: "How many days can you survive in prison?", bluff: "Name an amount of days/months/ years between 0 and 2 years" },
  { id: "n3", normal: "What age should you stop going to the club?", bluff: "Pick a number between 21 and 90" },
  { id: "n4", normal: "What is your pump-up song?", bluff: "What's a song you wouldn't skip if it came on?" },
  { id: "n5", normal: "How much money would it take you to run through the street naked right now?", bluff: "Choose an amount of money between $1 and $100,000" },
  { id: "n6", normal: "What show or movie is really uncomfortable to watch with parents?", bluff: "What's a TV show you watch that you would not recommend to a friend?" },
  { id: "n7", normal: "What influencer do you think you could beat in a fight?", bluff: "Who was the first Youtuber you remember watching" },
  { id: "n8", normal: "What age did you get your first allowance?", bluff: "What age did your parents buy your first video game?" },
  { id: "n9", normal: "How many people would show up to your birthday party?", bluff: "Pick a number between 5 and 300" },
  { id: "n10", normal: "What two artists should collaborate on a song?", bluff: "Name two music artists that have dated" },
  { id: "n11", normal: "How long can you go without showering?", bluff: "Write a number of days between 0 and 31" },
  { id: "n12", normal: "What actor do you think you can beat in a fight?", bluff: "Who is your favorite actor?" },
  { id: "n13", normal: "What is the worst food to order on a date?", bluff: "What is your favorite food to order at a restaurant?" },
  { id: "n14", normal: "What color would you say your mood is right now?", bluff: "What's your least favorite color?" },
  { id: "n15", normal: "Name someone here who you think would be a secret serial killer", bluff: "Who do you think is the most forgetful person here?" },
  { id: "n16", normal: "If you started training right now, how long would it take you to dunk a basketball?", bluff: "Pick a time frame between 2 weeks and 1 year" },
  { id: "n17", normal: "What is the largest animal you think you could beat in a fight?", bluff: "What's an animal you've seen up close before?" },
  { id: "n18", normal: "How fast do you think you can throw a baseball?", bluff: "Pick a miles-per-hour number between 10 and 100" },
  { id: "n19", normal: "How many times do you pee a day?", bluff: "Put a number between 0 and 8" },
  { id: "n20", normal: "Who is the worst actor?", bluff: "Name an actor you recognize immediately by their voice" },
  { id: "n21", normal: "How many times a week do you wash your feet in the shower?", bluff: "On average, how many cups of water do you drink a day?" },
  { id: "n22", normal: "If someone is showing you a video on their phone, what is the longest it should be?", bluff: "Put a time between 0 seconds and 10 minutes" },
  { id: "n23", normal: "Worst emoji to reply to the FBI?", bluff: "What emoji do you use the most when texting?" },
  { id: "n24", normal: "Which celeb should be president?", bluff: "Who is the most overrated celebrity?" },
  { id: "n25", normal: "How many days can you go without eating?", bluff: "Pick a number between 1 and 40 (Answer in \"days\")" },
  { id: "n26", normal: "Best age to retire?", bluff: "What age would you want to stay forever?" },
  { id: "n27", normal: "Age you want to have kids?", bluff: "Pick a number between 24 and 75" },
  { id: "n28", normal: "Athlete you can beat at their own sport?", bluff: "Who is the worst pro athlete?" },
  { id: "n29", normal: "How many days can you go without pooping?", bluff: "Pick a number between 1 and 20" },
  { id: "n30", normal: "How many hotdogs could you eat in one sitting?", bluff: "Amount of coins you could stack before the pile falls" },
  { id: "n31", normal: "What's the top speed of a human?", bluff: "What speed do you think you personally can run?" },
  { id: "n32", normal: "How many kids could you take in a fight?", bluff: "Number between 8 and 30" },
  { id: "n33", normal: "How much money would it take to reveal your internet search history?", bluff: "Pick a number between 1 million and 10 million" },
  { id: "n34", normal: "How many hours of sleep do you get per night?", bluff: "How many hours could you watch TV or doom scroll for without getting up?" },
  { id: "n35", normal: "How long can you survive in the woods?", bluff: "Most amount of time you have gone without leaving your house?" },
  { id: "n36", normal: "Your dream Halloween costume?", bluff: "Ugliest actor" },
  { id: "n37", normal: "Who would make the best lawyer?", bluff: "Who argues the most?" },
  { id: "n38", normal: "What's your go-to drink?", bluff: "What drink did you last have" },
  { id: "n39", normal: "What age should you first get your phone?", bluff: "What age did you hit puberty" }
];

const SUS_PROMPTS = [
  { id: "s1", normal: "What’s the longest you think you’d last during sex?", bluff: "How many minutes can you stay focused on one thing without getting distracted?" },
  { id: "s2", normal: "What’s a food that would be a terrible lube during sex?", bluff: "What’s a food that would be really messy to handle?" },
  { id: "s3", normal: "What’s a name that sounds like it belongs to someone with a huge penis?", bluff: "What’s a name that sounds very unconfident?" },
  { id: "s4", normal: "What’s a place you should absolutely NOT have sex?", bluff: "What’s a place you should hide while playing hide and seek?" },
  { id: "s5", normal: "What’s something that would immediately ruin the mood during sex?", bluff: "What’s something that would ruin a serious moment?" },
  { id: "s6", normal: "What’s something that would be weird to say right before sex?", bluff: "What’s something that would be good to say to your teacher" },
  { id: "s7", normal: "What’s an object that looks like a penis?", bluff: "What’s the tallest object you can think of" },
  { id: "s8", normal: "What’s something that would be awkward to moan during sex?", bluff: "What’s the name of your first pet" },
  { id: "s9", normal: "What’s a song that would make sex extremely uncomfortable?", bluff: "What's the last song you listened to?" },
  { id: "s10", normal: "What’s a word that sounds dirty even though it’s not?", bluff: "What’s a word you'd moan while having sex?" },
  { id: "s11", normal: "What’s something that would be weird to bring into bed during sex?", bluff: "What’s something that would be weird to bring to work?" },
  { id: "s12", normal: "What’s a profession that probably has the best sex lives?", bluff: "What’s a profession that seems the most exciting?" },
  { id: "s13", normal: "What’s something that would be suspicious to find in someone’s bedroom?", bluff: "What’s something that you own that you don't want other people to see?" },
  { id: "s14", normal: "What’s something that would make boobs less attractive?", bluff: "Write \"if they were on ____\" and fill in the blank with anyone" },
  { id: "s15", normal: "What’s something you’d never want someone to say about your penis?", bluff: "What’s something a snail would love to hear?" },
  { id: "s16", normal: "What’s something that would be the worst excuse to avoid sex?", bluff: "What’s the best excuse for not doing your homework?" },
  { id: "s17", normal: "What’s something that would make a hookup immediately awkward?", bluff: "Name a bad person" },
  { id: "s18", normal: "What’s something that would be weird to compliment about someone’s body?", bluff: "How would you compliment a horse?" },
  { id: "s19", normal: "What’s something that would be uncomfortable to hear during sex?", bluff: "What’s something weird to hear in a quiet moment?" },
  { id: "s20", normal: "What’s something that would make a kiss instantly bad?", bluff: "What’s something that would make a first impression bad?" },
  { id: "s21", normal: "What’s something that would be weird to do after sex?", bluff: "What’s something you would want to do after a sad movie" },
  { id: "s22", normal: "What’s something that would be the worst thing to say about someone’s vagina?", bluff: "How would you describe old person boobies" },
  { id: "s23", normal: "Create a name for a vagina", bluff: "Create a nickname for a turtle" },
  { id: "s24", normal: "Create a name for boobs", bluff: "Create a nickname for balls" }
];

const PRESET_COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ffffff'];

const THEMES = {
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-400', ring: 'focus:ring-rose-400', lightBg: 'bg-rose-100', lightText: 'text-rose-600', shadow: 'shadow-rose-200', hover: 'hover:bg-rose-600', activeRing: 'ring-rose-50', name: 'Rose', color: '#f43f5e' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500', ring: 'focus:ring-indigo-500', lightBg: 'bg-indigo-100', lightText: 'text-indigo-700', shadow: 'shadow-indigo-200', hover: 'hover:bg-indigo-700', activeRing: 'ring-indigo-50', name: 'Indigo', color: '#4f46e5' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-400', ring: 'focus:ring-emerald-400', lightBg: 'bg-emerald-100', lightText: 'text-emerald-700', shadow: 'shadow-emerald-200', hover: 'hover:bg-emerald-600', activeRing: 'ring-emerald-50', name: 'Emerald', color: '#10b981' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-400', ring: 'focus:ring-amber-400', lightBg: 'bg-amber-100', lightText: 'text-amber-700', shadow: 'shadow-amber-200', hover: 'hover:bg-amber-600', activeRing: 'ring-amber-50', name: 'Amber', color: '#f59e0b' },
  zebra: { bg: 'bg-zinc-800', text: 'text-zinc-800', border: 'border-zinc-500', ring: 'focus:ring-zinc-600', lightBg: 'bg-zinc-200', lightText: 'text-zinc-800', shadow: 'shadow-zinc-400', hover: 'hover:bg-zinc-900', activeRing: 'ring-zinc-100', name: 'Zebra', style: { backgroundImage: 'repeating-linear-gradient(45deg, #27272a, #27272a 15px, #3f3f46 15px, #3f3f46 30px)' } },
  grid: { bg: 'bg-slate-700', text: 'text-slate-700', border: 'border-slate-500', ring: 'focus:ring-slate-500', lightBg: 'bg-slate-200', lightText: 'text-slate-800', shadow: 'shadow-slate-400', hover: 'hover:bg-slate-800', activeRing: 'ring-slate-100', name: 'Grid', style: { backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#334155' } },
  dots: { bg: 'bg-cyan-700', text: 'text-cyan-700', border: 'border-cyan-500', ring: 'focus:ring-cyan-500', lightBg: 'bg-cyan-200', lightText: 'text-cyan-800', shadow: 'shadow-cyan-400', hover: 'hover:bg-cyan-800', activeRing: 'ring-cyan-100', name: 'Dots', style: { backgroundImage: 'radial-gradient(#06b6d4 2px, transparent 2px)', backgroundSize: '20px 20px', backgroundColor: '#0e7490' } }
};

const DrawingCanvas = ({ onSave, disabled, initialData, hideTools }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen'); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [history, setHistory] = useState([]);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (initialData && initialData !== '') {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = initialData;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initialData, hideTools]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startAction = (e) => {
    if (disabled) return;
    const { x, y } = getPos(e);
    setStartX(x);
    setStartY(y);
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    setHistory(prev => [...prev, canvasRef.current.toDataURL()]);
  };

  const performAction = (e) => {
    if (!isDrawing || disabled) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.putImageData(snapshot, 0, 0); 
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fillStyle = color;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      setStartX(x);
      setStartY(y);
      setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    } else if (tool === 'square') {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (tool === 'circle') {
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(startX + (x - startX) / 2, startY);
      ctx.lineTo(startX, y);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopAction = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onSave(canvasRef.current.toDataURL());
    }
  };

  const undo = () => {
    if (history.length === 0 || disabled) return;
    const last = history[history.length - 1];
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = last;
    setHistory(prev => prev.slice(0, -1));
    onSave(last);
  };

  return (
    <div className="flex flex-col gap-1 w-full h-full relative">
      {!hideTools && (
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-md items-center justify-center shrink-0">
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            <button onClick={() => setTool('pen')} className={`p-1.5 rounded ${tool === 'pen' ? 'bg-white shadow' : ''}`}><Palette size={16} /></button>
            <button onClick={() => setTool('eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-white shadow' : ''}`}><Eraser size={16} /></button>
          </div>
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            <button onClick={() => setTool('square')} className={`p-1.5 rounded ${tool === 'square' ? 'bg-white shadow' : ''}`}><Square size={16} /></button>
            <button onClick={() => setTool('circle')} className={`p-1.5 rounded ${tool === 'circle' ? 'bg-white shadow' : ''}`}><Circle size={16} /></button>
            <button onClick={() => setTool('triangle')} className={`p-1.5 rounded ${tool === 'triangle' ? 'bg-white shadow' : ''}`}><Triangle size={16} /></button>
            <button onClick={() => setTool('line')} className={`p-1.5 rounded ${tool === 'line' ? 'bg-white shadow' : ''}`}><Minus size={16} /></button>
          </div>
          <div className="flex items-center gap-2">
              <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(e.target.value)} className="w-16 accent-stone-800" />
              <div className="flex gap-1">
              {PRESET_COLORS.slice(0, 5).map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border border-stone-200 shadow-sm ${color === c ? 'ring-2 ring-stone-800 scale-110' : ''}`} style={{ backgroundColor: c }} />
              ))}
              </div>
              <button onClick={undo} className="p-1.5 bg-stone-50 rounded hover:bg-stone-100"><Undo2 size={16} /></button>
          </div>
        </div>
      )}
      <div className={`flex-1 bg-white ${hideTools ? '' : 'rounded-2xl shadow-inner border border-stone-200'} relative overflow-hidden touch-none`}>
        <canvas ref={canvasRef} onMouseDown={startAction} onMouseMove={performAction} onMouseUp={stopAction} onMouseLeave={stopAction} onTouchStart={startAction} onTouchMove={performAction} onTouchEnd={stopAction} className="w-full h-full" />
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);
  const [localPlayerId] = useState(() => {
    const stored = sessionStorage.getItem('bluff_player_id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('bluff_player_id', newId);
    return newId;
  });

  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [userName, setUserName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myDrawing, setMyDrawing] = useState('');
  const [joinedRoomCode, setJoinedRoomCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [revealStep, setRevealStep] = useState(0); 

  const getRoomRef = (code) => doc(collection(db, 'rooms'), code.trim());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.length === 6 && /^\d+$/.test(code)) {
      setRoomCode(code);
    }
  }, []);

  useEffect(() => {
    const iconUrl = '/logo.png'; 
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = iconUrl;
    document.title = "BLUFF";
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !joinedRoomCode) return;
    return onSnapshot(getRoomRef(joinedRoomCode), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGameState(data);
        setIsHost(data.hostId === localPlayerId);
      } else {
        setGameState(null);
      }
    });
  }, [user, joinedRoomCode, localPlayerId]);

  useEffect(() => {
    if (gameState?.status === 'REVEAL') {
      setRevealStep(0);
      const timer = setTimeout(() => {
        setRevealStep(1);
      }, 3000); 
      return () => clearTimeout(timer);
    } else {
      setRevealStep(0);
    }
  }, [gameState?.status, gameState?.round]);

  useEffect(() => {
    if (gameState?.status === 'DRAWING' || gameState?.status === 'LOBBY') {
      setMyDrawing('');
    }
  }, [gameState?.status, gameState?.round]);

  useEffect(() => {
    if (isHost && gameState?.status === 'VOTING') {
      const voteCount = Object.keys(gameState.votes || {}).length;
      if (voteCount === gameState.players.length && voteCount > 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        updateDoc(getRoomRef(joinedRoomCode), { status: 'COUNTDOWN', timer: 3 });
        runTimer(3, 'RESULTS_CALC');
      }
    }
  }, [gameState?.votes, gameState?.status, isHost, joinedRoomCode, gameState?.players?.length]);

  // FIX: Reveal logic handles 10 second discussion countdown for the host
  useEffect(() => {
    if (isHost && gameState?.status === 'DRAWING') {
      if (gameState.readyPlayers?.length === gameState.players.length && gameState.players.length > 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        updateDoc(getRoomRef(joinedRoomCode), { status: 'REVEAL', timer: 10 }); 
        runTimer(10, 'REVEAL'); 
      }
    }
  }, [gameState?.readyPlayers, gameState?.status, isHost, joinedRoomCode, gameState?.players?.length]);

  useEffect(() => {
    if (gameState?.status === 'REVEAL' && !gameState.readyPlayers?.includes(localPlayerId)) {
      if (myDrawing) {
        updateDoc(getRoomRef(joinedRoomCode), { [`drawings.${localPlayerId}`]: myDrawing });
      }
    }
  }, [gameState?.status, gameState?.readyPlayers, joinedRoomCode, localPlayerId, myDrawing]);

  const runTimer = (seconds, context) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let timeLeft = seconds;
    timerRef.current = setInterval(async () => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        if (context === 'RESULTS_CALC') calculateResults();
        else updateDoc(getRoomRef(joinedRoomCode), { timer: 0 }); 
      } else {
        updateDoc(getRoomRef(joinedRoomCode), { timer: timeLeft });
      }
    }, 1000);
  };

  const copyInviteLink = () => {
    const el = document.createElement('textarea');
    el.value = window.location.origin + window.location.pathname + '?room=' + gameState.code;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const createRoom = async () => {
    if (!userName.trim()) return setError("Name required");
    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await setDoc(getRoomRef(code), {
        code, hostId: localPlayerId, theme: 'rose', status: 'LOBBY',
        targetScore: 5, susMode: false, usedPrompts: [],
        players: [{ id: localPlayerId, name: userName, score: 0 }],
        readyPlayers: [], drawings: {}, votes: {}, round: 1, createdAt: Date.now()
      });
      setJoinedRoomCode(code);
      setIsHost(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const joinRoom = async () => {
    if (!userName.trim() || !roomCode.trim()) return setError("Missing info");
    setLoading(true);
    try {
      const snap = await getDoc(getRoomRef(roomCode));
      if (!snap.exists()) throw new Error("Room not found");
      const data = snap.data();
      if (!data.players.some(p => p.id === localPlayerId)) {
        await updateDoc(getRoomRef(roomCode), { players: arrayUnion({ id: localPlayerId, name: userName, score: 0 }) });
      }
      setJoinedRoomCode(roomCode);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const startRound = async () => {
    if (!isHost) return;
    if (gameState.players.length < 2) return;

    let pool = gameState.susMode ? SUS_PROMPTS : PROMPT_PAIRS;
    const available = pool.filter(p => !gameState.usedPrompts?.includes(p.id));
    
    if (available.length === 0) {
      await updateDoc(getRoomRef(joinedRoomCode), { usedPrompts: [] });
    } else {
      pool = available;
    }

    const prompt = pool[Math.floor(Math.random() * pool.length)];
    const impId = gameState.players[Math.floor(Math.random() * gameState.players.length)].id;
    const isGameOver = gameState.players.some(p => p.score >= (gameState.targetScore || 5));
    
    await updateDoc(getRoomRef(joinedRoomCode), {
      status: 'DRAWING', currentPrompt: prompt, impostorId: impId,
      usedPrompts: arrayUnion(prompt.id),
      drawings: {}, votes: {}, readyPlayers: [], timer: 90, 
      round: isGameOver ? 1 : (gameState.round || 1) + 1,
      players: isGameOver ? gameState.players.map(p => ({...p, score: 0})) : gameState.players
    });
    runTimer(90, 'DRAWING');
  };

  const calculateResults = async () => {
    if (!isHost) return;
    await runTransaction(db, async (t) => {
      const snap = await t.get(getRoomRef(joinedRoomCode));
      const { players, votes, impostorId } = snap.data();
      const caughtCount = Object.values(votes || {}).filter(v => v === impostorId).length;
      const updated = players.map(p => {
        let add = 0;
        if (p.id === impostorId) add = caughtCount === 0 ? 3 : (caughtCount < players.length / 2 ? 2 : 0);
        else if (votes[p.id] === impostorId) add = 1;
        return { ...p, score: p.score + add };
      });
      t.update(getRoomRef(joinedRoomCode), { players: updated, status: 'RESULTS' });
    });
  };

  const toggleReady = async () => {
    if (!user || gameState?.status !== 'DRAWING') return;
    const isReady = gameState.readyPlayers?.includes(localPlayerId);
    const roomRef = getRoomRef(joinedRoomCode);
    if (isReady) {
      await updateDoc(roomRef, { readyPlayers: arrayRemove(localPlayerId) });
    } else {
      await updateDoc(roomRef, { 
        readyPlayers: arrayUnion(localPlayerId),
        [`drawings.${localPlayerId}`]: myDrawing 
      });
    }
  };

  const goToVoting = async () => {
    if (!isHost || !user) return;
    await updateDoc(getRoomRef(joinedRoomCode), { status: 'VOTING', timer: 0 }); 
  };

  const submitVote = async (targetUid) => {
    if (gameState?.status !== 'VOTING' || !user) return;
    // Switching votes: Just update with the new target. 
    // Host logic handles the lock when everyone has voted.
    await updateDoc(getRoomRef(joinedRoomCode), { [`votes.${localPlayerId}`]: targetUid });
  };

  const requestSusMode = async () => {
    if (!user || isHost) return;
    await updateDoc(getRoomRef(joinedRoomCode), { susRequest: { requesterName: userName, requesterId: localPlayerId } });
  };

  const handleSusRequest = async (accept) => {
    if (!isHost) return;
    await updateDoc(getRoomRef(joinedRoomCode), { susMode: accept ? true : gameState.susMode, susRequest: null });
  };

  const leaveGame = async () => {
    // 1. Snapshot the code
    const codeToClear = joinedRoomCode;
    // 2. Clear local states immediately to break the render loop
    setJoinedRoomCode('');
    setGameState(null);
    setRoomCode('');
    setShowLeaveConfirm(false);
    
    // 3. Update DB asynchronously
    if (codeToClear && user) {
        try {
            const roomRef = getRoomRef(codeToClear);
            const snap = await getDoc(roomRef);
            if (snap.exists()) {
                const players = snap.data().players || [];
                const updated = players.filter(p => p.id !== localPlayerId);
                await updateDoc(roomRef, { players: updated });
            }
        } catch (e) { console.error("Exit err:", e); }
    }
    // 4. Clean URL
    window.history.replaceState(null, '', window.location.origin + window.location.pathname);
  };

  const t = THEMES[gameState?.theme] || THEMES.rose;

  const LeaveButton = () => (
    <div className="fixed bottom-3 right-3 z-[1000]">
      <button onClick={() => setShowLeaveConfirm(true)} className="p-2.5 bg-black/20 hover:bg-black/40 text-white/80 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-90">
        <LogOut size={18} />
      </button>
    </div>
  );

  const LeaveModal = () => showLeaveConfirm && (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-stone-800">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
        <h3 className="text-2xl font-black mb-4 leading-none uppercase">LEAVE GAME?</h3>
        <p className="text-stone-500 font-bold mb-8 leading-tight">Are you sure you want to exit to the home screen?</p>
        <div className="flex gap-3">
          <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-4 bg-stone-100 font-black rounded-2xl active:scale-95">STAY</button>
          <button onClick={leaveGame} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-200 active:scale-95 text-sm uppercase">LEAVE</button>
        </div>
      </div>
    </div>
  );

  // --- ENTRY SCREEN ---
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md mx-auto my-auto text-stone-800">
          <h1 className="text-5xl font-black text-blue-600 italic text-center mb-8 tracking-tighter uppercase font-black leading-none">BLUFF</h1>
          <div className="space-y-4">
            <input type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold" />
            <button onClick={createRoom} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all font-black leading-none uppercase">HOST GAME</button>
            <div className="flex flex-col gap-3">
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="Room Code" value={roomCode} onChange={e => setRoomCode(e.target.value.replace(/\D/g, ''))} className="w-full p-4 bg-slate-50 rounded-2xl text-center font-bold tracking-widest focus:border-blue-500 border-2 border-transparent outline-none transition-all font-bold" />
              <button onClick={joinRoom} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black active:scale-95 transition-all uppercase text-sm tracking-widest font-black leading-none text-center">Join Room</button>
            </div>
            {error && <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
            <div className="pt-6 border-t border-stone-100 flex items-start gap-3 opacity-60">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0"><Info size={20} /></div>
              <div className="text-left text-[11px] text-stone-500 leading-tight font-bold">For the best experience, tap <span className="font-bold text-stone-700">"Add to Home Screen"</span> in Safari to play Bluff like a native app.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOBBY SCREEN (One-Page Layout) ---
  if (gameState.status === 'LOBBY') {
    return (
      <div className={`fixed inset-0 ${t.bg} p-4 sm:p-8 text-white flex flex-col items-center justify-center overflow-hidden`} style={t.style}>
        {isHost && gameState.susRequest && (
          <div className="fixed inset-0 z-[2050] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 text-stone-800 text-center">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full">
                 <Flame size={64} className="text-rose-500 mx-auto mb-4 animate-bounce" />
                 <h3 className="text-xl font-black mb-6 tracking-tight leading-tight font-black">{gameState.susRequest.requesterName} wants Sus addition!</h3>
                 <div className="flex gap-3">
                    <button onClick={() => handleSusRequest(false)} className="flex-1 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl active:scale-95 transition-all uppercase font-black text-sm">Skip</button>
                    <button onClick={() => handleSusRequest(true)} className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all uppercase font-black text-sm">Enable</button>
                 </div>
             </div>
          </div>
        )}

        <div className="w-full max-w-5xl h-full flex flex-col landscape:flex-row gap-4 sm:gap-6 overflow-hidden items-center justify-center">
          <div className="flex flex-col gap-4 w-full landscape:w-1/2 overflow-hidden shrink-0">
            <div className="bg-white/10 p-4 sm:p-6 rounded-[2rem] border border-white/10 flex flex-col gap-4 text-center shadow-lg">
               <div className="leading-none text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Room Code</span>
                    <h2 className="text-4xl sm:text-5xl font-black drop-shadow-md tracking-tighter">{gameState.code}</h2>
               </div>
               {isHost && (
                 <button onClick={startRound} disabled={gameState.players.length < 2} className="w-full py-3 sm:py-4 bg-white text-stone-800 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-50 transition-all uppercase tracking-tighter text-sm sm:text-base leading-none">
                    {gameState.players.length < 2 ? 'Need 2 Players' : 'Start Game'}
                 </button>
               )}
            </div>

            {isHost ? (
               <div className="bg-white/10 p-4 sm:p-6 rounded-[2rem] border border-white/10 flex flex-col gap-5 shadow-lg">
                  <label className="flex items-center justify-between bg-black/20 p-3 sm:p-4 rounded-2xl cursor-pointer hover:bg-black/30 transition-all border border-white/5 shrink-0">
                    <span className="font-bold flex items-center gap-3 text-sm tracking-tight font-black uppercase leading-none text-white"><Flame size={20} className={gameState.susMode ? "text-rose-400" : "text-stone-400"} /> Sus Mode</span>
                    <div className={`w-14 h-7 rounded-full p-1 transition-all ${gameState.susMode ? 'bg-rose-500' : 'bg-stone-600'}`}><div className={`w-5 h-5 rounded-full bg-white transition-all ${gameState.susMode ? 'translate-x-7' : 'translate-x-0'}`} /></div>
                    <input type="checkbox" className="hidden" checked={!!gameState.susMode} onChange={(e) => updateDoc(getRoomRef(joinedRoomCode), { susMode: e.target.checked })} />
                  </label>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block text-center font-black text-white">Room Theme</span>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                      {Object.keys(THEMES).map(k => (
                        <button key={k} onClick={() => updateDoc(getRoomRef(joinedRoomCode), {theme: k})} 
                          style={THEMES[k].style || { backgroundColor: THEMES[k].color }} 
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-4 transition-all shadow-lg ${gameState.theme === k ? 'border-white scale-110 ring-4 ring-white/20' : 'border-black/20 opacity-80 hover:opacity-100'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-2 border-t border-white/10 shrink-0 font-black text-white">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Win At: {gameState.targetScore || 5} pts</span>
                    <input type="range" min="3" max="15" value={gameState.targetScore || 5} onChange={e => updateDoc(getRoomRef(joinedRoomCode), { targetScore: parseInt(e.target.value) })} className="w-24 sm:w-32 accent-white" />
                  </div>
               </div>
            ) : (
               <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 flex flex-col gap-4 text-center">
                  <div className="flex justify-between items-center px-2 font-black uppercase tracking-widest text-xs text-white/50 font-black"><span>Points to Win</span><span>{gameState.targetScore || 5}</span></div>
                  {!gameState.susMode ? (
                    <button onClick={requestSusMode} className="w-full py-4 bg-black/20 hover:bg-black/30 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-inner active:scale-95 font-black uppercase"><Flame size={18} /> Request Sus Mode</button>
                  ) : (
                    <div className="w-full py-4 bg-rose-500/20 border border-rose-500/20 rounded-2xl font-black text-xs uppercase tracking-widest text-rose-100 flex items-center justify-center gap-2 font-black uppercase tracking-widest">Sus Mode Enabled</div>
                  )}
               </div>
            )}
          </div>

          <div className="flex flex-col flex-1 bg-white rounded-[2rem] p-4 sm:p-6 text-stone-800 shadow-2xl overflow-hidden min-h-[180px] w-full">
             <h3 className="font-black uppercase tracking-tighter text-stone-400 border-b border-stone-100 pb-3 mb-3 flex justify-between shrink-0 font-black">Players <span>{gameState.players.length}</span></h3>
             <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {gameState.players.map(p => (
                  <div key={p.id} className="p-3 bg-stone-50 rounded-xl font-bold flex items-center gap-3 border border-stone-100 shrink-0 leading-none font-black font-bold"><div className={`w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center text-xs shadow-sm font-black`}>{p.name[0]}</div><span className="truncate flex-1 tracking-tight">{p.name}</span>{p.id === localPlayerId && <span className="text-[8px] bg-stone-200 px-1.5 py-1 rounded-full uppercase tracking-tighter opacity-70 font-black">You</span>}</div>
                ))}
             </div>
             <button onClick={copyInviteLink} className={`mt-4 w-full py-3 ${t.lightBg} ${t.lightText} rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 font-black uppercase`}>
                {linkCopied ? <Check size={14} /> : <Copy size={14} />} {linkCopied ? 'Copied!' : 'Copy Room Link'}
             </button>
          </div>
        </div>
        <LeaveButton />
        <LeaveModal />
      </div>
    );
  }

  // --- GAMEPLAY STATES ---
  if (gameState.status === 'DRAWING' || gameState.status === 'REVEAL' || gameState.status === 'VOTING' || gameState.status === 'RESULTS' || gameState.status === 'COUNTDOWN') {
    if (!gameState.currentPrompt && gameState.status !== 'COUNTDOWN' && gameState.status !== 'RESULTS') {
      return (
        <div className={`fixed inset-0 ${t.bg} flex flex-col items-center justify-center text-white p-8 text-center`}>
          <Loader2 size={48} className="animate-spin mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-widest font-black">Syncing Round...</h2>
        </div>
      );
    }

    if (gameState.status === 'DRAWING' || gameState.status === 'REVEAL') {
      const isImp = gameState.impostorId === localPlayerId;
      const promptText = isImp ? gameState.currentPrompt?.bluff : gameState.currentPrompt?.normal;
      const isReady = gameState.readyPlayers?.includes(localPlayerId);
      const isRevealing = gameState.status === 'REVEAL';
      const showLabel = isRevealing && revealStep === 1;
      
      return (
        <div className="fixed inset-0 h-[100svh] w-screen bg-white flex flex-col overflow-hidden text-stone-800">
          {/* Header */}
          <div className={`bg-white px-5 py-3 border-b border-stone-100 flex justify-between items-center z-10 shrink-0 transition-all duration-700 ${isRevealing ? 'bg-stone-50 border-none' : ''}`}>
             <div className="flex-1 pr-6 min-w-0">
               <span className={`text-[9px] font-black text-stone-400 block uppercase mb-1 tracking-widest font-black transition-opacity ${isRevealing && revealStep === 0 ? 'opacity-0' : 'opacity-100'}`}>
                 {isRevealing ? "Group Question" : "Secret Prompt"}
               </span>
               <span className={`font-black break-words whitespace-normal leading-tight block ${t.text} transition-all duration-700 ${isRevealing && revealStep === 0 ? 'text-2xl sm:text-4xl text-center fixed inset-0 flex items-center justify-center px-10 text-stone-900 bg-white z-[100]' : 'text-sm sm:text-lg'}`}>
                  {isRevealing && revealStep === 0 ? `QUESTION: ${gameState.currentPrompt?.normal}` : (isRevealing ? gameState.currentPrompt?.normal : promptText)}
               </span>
             </div>
             {!isRevealing && (
               <div className="font-mono font-black bg-stone-100 px-4 py-1.5 rounded-full text-xs sm:text-base border border-stone-200 shrink-0 font-black">{gameState.timer}s</div>
             )}
          </div>

          {/* Time to Discuss Label */}
          {showLabel && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                <div className="bg-amber-400 text-amber-900 px-6 py-2 rounded-full font-black text-sm uppercase shadow-xl flex items-center gap-2 border-2 border-amber-200">
                    <MessageCircle size={16} /> Time to discuss!
                </div>
            </div>
          )}

          {/* Whiteboard */}
          <div className={`flex-1 overflow-hidden transition-opacity duration-500 ${isRevealing && revealStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <DrawingCanvas key={gameState.round} onSave={(d) => setMyDrawing(d)} disabled={isReady || isRevealing} initialData={myDrawing} hideTools={isRevealing} />
          </div>

          {!isRevealing && (
            <div className="px-5 py-2.5 bg-white border-t border-stone-100 flex justify-between items-center shrink-0">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest font-black">{gameState.readyPlayers?.length || 0} / {gameState.players.length} Ready</span>
              <button onClick={toggleReady} className={`px-6 sm:px-10 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg active:scale-90 ${isReady ? 'bg-green-500 text-white shadow-green-200' : 'bg-stone-800 text-white shadow-stone-200'} uppercase font-black`}>
                  {isReady ? "LOCKED IN" : "SUBMIT"}
              </button>
            </div>
          )}

          {isRevealing && isHost && revealStep === 1 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full px-6 flex justify-center z-[110]">
              {gameState.timer > 0 ? (
                <div className="px-10 py-4 bg-stone-200 text-stone-400 rounded-2xl font-black uppercase text-xs tracking-widest font-black">
                   Wait to Vote ({gameState.timer}s)
                </div>
              ) : (
                <button onClick={goToVoting} className="px-12 py-4 bg-black text-white rounded-2xl font-black shadow-2xl active:scale-95 hover:scale-105 uppercase tracking-widest transition-all font-black border-2 border-white/20">
                    REVEAL VOTING PAGE
                </button>
              )}
            </div>
          )}
          <LeaveButton />
          <LeaveModal />
        </div>
      );
    }

    if (gameState.status === 'VOTING') {
      const currentSelection = gameState.votes?.[localPlayerId];
      return (
        <div className="min-h-[100dvh] bg-stone-50 p-6 overflow-y-auto flex flex-col items-center text-stone-800">
          <div className="w-full max-w-6xl h-full flex flex-col">
             <div className="mb-6 shrink-0 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-1 leading-none uppercase font-black">Who's Lying?</h2>
                  <p className="text-stone-400 font-bold text-xs sm:text-sm leading-tight font-bold">Target Question: <span className={`font-black not-italic break-words ${t.text} uppercase`}>"{gameState.currentPrompt?.normal}"</span></p>
                  <p className="text-stone-500 text-[10px] uppercase font-black mt-2">Tap any player to switch your vote.</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 flex-1">
               {gameState.players.map(p => (
                 <button key={p.id} disabled={p.id === localPlayerId} onClick={() => submitVote(p.id)}
                   className={`bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border-2 sm:border-4 shadow-xl transition-all text-left group ${currentSelection === p.id ? `${t.border} ring-4 sm:ring-8 ${t.activeRing} scale-105` : 'border-white hover:border-stone-100'}`}>
                   <div className="aspect-video bg-stone-50 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 overflow-hidden border border-stone-100 relative shadow-inner">
                     {gameState.drawings?.[p.id] ? <img src={gameState.drawings[p.id]} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 font-black text-[8px] sm:text-[10px] uppercase text-center p-4 tracking-tighter leading-none font-black">BLANK</div>}
                     {currentSelection === p.id && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg"><Check size={12} strokeWidth={4} /></div>
                     )}
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${t.bg} transition-transform group-hover:scale-110`} />
                      <span className="font-black text-xs sm:text-sm text-stone-800 truncate flex-1 tracking-tight font-black">{p.name}</span>
                      {p.id === localPlayerId && <span className="text-[9px] opacity-50 font-black shrink-0 tracking-tighter font-black">(You)</span>}
                   </div>
                 </button>
               ))}
             </div>
          </div>
          <LeaveButton />
          <LeaveModal />
        </div>
      );
    }

    if (gameState.status === 'COUNTDOWN') {
      return (
        <div className={`fixed inset-0 ${t.bg} flex flex-col items-center justify-center text-white z-[3000] p-6`} style={t.style}>
          <h2 className="text-xl sm:text-2xl font-black text-white/90 tracking-widest uppercase mb-4 sm:mb-8 drop-shadow-md bg-black/20 px-6 sm:px-8 py-2 sm:py-3 rounded-full backdrop-blur-md text-center font-black">Final Tally...</h2>
          <div className="text-[10rem] sm:text-[25rem] font-black drop-shadow-2xl animate-pulse leading-none font-black">{gameState.timer}</div>
          <LeaveButton />
          <LeaveModal />
        </div>
      );
    }

    if (gameState.status === 'RESULTS') {
      const imp = gameState.players.find(p => p.id === gameState.impostorId);
      const winners = gameState.players.filter(p => p.score === Math.max(...gameState.players.map(p => p.score)) && p.score >= (gameState.targetScore || 5));
      const isGameOver = winners.length > 0;
      
      return (
        <div className="min-h-[100dvh] bg-stone-50 p-4 sm:p-6 flex flex-col items-center text-stone-800 overflow-y-auto">
          <div className="w-full max-w-md flex flex-col gap-6">
            {isGameOver && (
               <div className="bg-amber-400 text-amber-900 p-6 rounded-[2.5rem] shadow-2xl border-4 border-amber-200 animate-bounce text-center">
                  <h2 className="text-2xl font-black uppercase mb-1 font-black leading-none font-black">🏆 WINNER!</h2>
                  <p className="font-black text-xl font-black">{winners.map(w => w.name).join(' & ')}</p>
               </div>
            )}

            <div className="text-center py-4">
              <div className={`${t.text} font-black uppercase tracking-widest text-[10px] mb-2 opacity-60 font-black`}>The Impostor Was</div>
              <h2 className="text-6xl font-black text-stone-800 drop-shadow-lg tracking-tighter uppercase leading-none font-black">{imp?.name}</h2>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-stone-100 flex flex-col">
              <div className="border-b border-stone-100 pb-4 mb-4 text-left space-y-3 shrink-0 font-black">
                  <div><span className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1 font-black">Group Question</span><span className="text-stone-800 font-bold block text-sm leading-tight tracking-tight break-words font-black">{gameState.currentPrompt?.normal}</span></div>
                  <div><span className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1 font-black">Impostor Question</span><span className={`${t.text} font-bold block text-sm leading-tight tracking-tight break-words font-black`}>{gameState.currentPrompt?.bluff}</span></div>
              </div>
              <div className="space-y-2 flex-1">
                {gameState.players.sort((a,b)=>b.score-a.score).map((p, i) => (
                  <div key={p.id} className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all ${p.id === gameState.impostorId ? `${t.lightBg} border-2 border-dashed ${t.border}` : 'bg-stone-50'}`}>
                      <div className="flex items-center gap-3 overflow-hidden font-black">
                          <span className="font-black text-stone-300 text-xs w-4 shrink-0">{i+1}</span>
                          <span className={`font-black truncate text-sm`}>{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-black">
                          <Trophy size={16} className={isGameOver && winners.some(w => w.id === p.id) ? "text-amber-500 scale-125" : "text-stone-200"} />
                          <span className="font-black text-stone-800 text-lg leading-none font-black">{p.score}</span>
                      </div>
                  </div>
                ))}
              </div>
            </div>

            {isHost && <button onClick={startRound} className={`py-6 ${t.bg} text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all w-full tracking-tighter uppercase font-black`}>{isGameOver ? 'START NEW GAME' : 'CONTINUE'}</button>}
          </div>
          <LeaveButton />
          <LeaveModal />
        </div>
      );
    }
  }

  return null;
}