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
  Square, Circle, Triangle, Minus, Copy, Check, Flame, RotateCw, Smartphone
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
  { normal: "What video game requires the most skill?", bluff: "What is a game you would play with your kids?" },
  { normal: "How many days can you survive in prison?", bluff: "Name an amount of days/months/ years between 0 and 2 years" },
  { normal: "What age should you stop going to the club?", bluff: "Pick a number between 21 and 90" },
  { normal: "What is your pump-up song?", bluff: "What's a song you wouldn't skip if it came on?" },
  { normal: "How much money would it take you to run through the street naked right now?", bluff: "Choose an amount of money between $1 and $100,000" },
  { normal: "What show or movie is really uncomfortable to watch with parents?", bluff: "What's a TV show you watch that you would not recommend to a friend?" },
  { normal: "What influencer do you think you could beat in a fight?", bluff: "Who was the first Youtuber you remember watching" },
  { normal: "What age did you get your first allowance?", bluff: "What age did your parents buy your first video game?" },
  { normal: "How many people would show up to your birthday party?", bluff: "Pick a number between 5 and 300" },
  { normal: "What two artists should collaborate on a song?", bluff: "Name two music artists that have dated" },
  { normal: "How long can you go without showering?", bluff: "Write a number of days between 0 and 31" },
  { normal: "What actor do you think you can beat in a fight?", bluff: "Who is your favorite actor?" },
  { normal: "What is the worst food to order on a date?", bluff: "What is your favorite food to order at a restaurant?" },
  { normal: "What color would you say your mood is right now?", bluff: "What's your least favorite color?" },
  { normal: "Name someone here who you think would be a secret serial killer", bluff: "Who do you think is the most forgetful person here?" },
  { normal: "If you started training right now, how long would it take you to dunk a basketball?", bluff: "Pick a time frame between 2 weeks and 1 year" },
  { normal: "What is the largest animal you think you could beat in a fight?", bluff: "What's an animal you've seen up close before?" },
  { normal: "How fast do you think you can throw a baseball?", bluff: "Pick a miles-per-hour number between 10 and 100" },
  { normal: "How many times do you pee a day?", bluff: "Put a number between 0 and 8" },
  { normal: "Who is the worst actor?", bluff: "Name an actor you recognize immediately by their voice" },
  { normal: "How many times a week do you wash your feet in the shower?", bluff: "On average, how many cups of water do you drink a day?" },
  { normal: "If someone is showing you a video on their phone, what is the longest it should be?", bluff: "Put a time between 0 seconds and 10 minutes" },
  { normal: "Worst emoji to reply to the FBI?", bluff: "What emoji do you use the most when texting?" },
  { normal: "Which celeb should be president?", bluff: "Who is the most overrated celebrity?" },
  { normal: "How many days can you go without eating?", bluff: "Pick a number between 1 and 40 (Answer in \"days\")" },
  { normal: "Best age to retire?", bluff: "What age would you want to stay forever?" },
  { normal: "Age you want to have kids?", bluff: "Pick a number between 24 and 75" },
  { normal: "Athlete you can beat at their own sport?", bluff: "Who is the worst pro athlete?" },
  { normal: "How many days can you go without pooping?", bluff: "Pick a number between 1 and 20" },
  { normal: "How many hotdogs could you eat in one sitting?", bluff: "Most amount of hotdogs you have eaten in one sitting before?" },
  { normal: "What's the top speed of a human?", bluff: "What speed do you think you personally can run?" },
  { normal: "How many kids could you take in a fight?", bluff: "Number between 8 and 30" },
  { normal: "How much money would you donate to a children’s charity?", bluff: "Most amount of money would you pay for a fast-food meal" },
  { normal: "What would you bring to the past?", bluff: "Popular trend of 2025" },
  { normal: "If you had to use one emoji to describe your dating life, what would it be?", bluff: "What is your favorite animal emoji?" },
  { normal: "What would you tell your 10-year-old self if you could travel back in time?", bluff: "What advice would you give a dog?" },
  { normal: "How many yards do you think you could run after receiving an NFL kickoff?", bluff: "Pick a number between 5 and 100" },
  { normal: "Where would you hide buried treasure?", bluff: "Where is somewhere you would never stick your hand in" },
  { normal: "How many dates before kissing? (answer in terms of \"dates\")", bluff: "How many dates could you fit in your mouth (answer in terms of \"dates\")" },
  { normal: "If you could see any artist in concert, who would it be?", bluff: "What was the best concert you've been to?" },
  { normal: "How long should you grill a burger?", bluff: "How long on average does it take you to poop?" },
  { normal: "What item in your house can't you live without?", bluff: "What is the most fragile thing in your house?" },
  { normal: "Best age to have puberty?", bluff: "Pick a number between 9 and 15" },
  { normal: "Who is the most responsible person here?", bluff: "Who is the best driver here?" },
  { normal: "How much money would it take to reveal your internet search history?", bluff: "Pick a number between 1 million and 10 million" },
  { normal: "How many hours of sleep do you get per night?", bluff: "How many hours could you watch TV or doom scroll for without getting up?" },
  { normal: "How long can you go without leaving your house?", bluff: "Most amount of time you have gone without leaving your house?" },
  { normal: "Your dream Halloween costume?", bluff: "Ugliest actor" },
  { normal: "Who would make the best lawyer?", bluff: "Who argues the most?" },
  { normal: "What's your go-to drink?", bluff: "What drink did you last have" },
  { normal: "What age should you first get your phone?", bluff: "What age did you hit puberty" },
  { normal: "What item would you show a medieval peasant?", bluff: "What item do you use every day?" },
  { normal: "What would you show people from the future to represent 2025?", bluff: "What item represents your daily life right now?" }
];

const SUS_PROMPTS = [
  { normal: "What’s the longest you think you’d last during sex?", bluff: "How many minutes can you stay focused on one thing without getting distracted?" },
  { normal: "What’s a food that would be a terrible lube during sex?", bluff: "What’s a food that would be really messy to handle?" },
  { normal: "What’s a name that sounds like it belongs to someone with a huge penis?", bluff: "What’s a name that sounds very unconfident?" },
  { normal: "What’s a place you should absolutely NOT have sex?", bluff: "What’s a place you should hide while playing hide and seek?" },
  { normal: "What’s something that would immediately ruin the mood during sex?", bluff: "What’s something that would ruin a serious moment?" },
  { normal: "What’s something that would be weird to say right before sex?", bluff: "What’s something that would be good to say to your teacher" },
  { normal: "What’s an object that looks like a penis?", bluff: "What’s the tallest object you can think of" },
  { normal: "What’s something that would be awkward to moan during sex?", bluff: "What’s the name of your first pet" },
  { normal: "What’s a song that would make sex extremely uncomfortable?", bluff: "What's the last song you listened to?" },
  { normal: "What’s a word that sounds dirty even though it’s not?", bluff: "What’s a word you'd moan while having sex?" },
  { normal: "What’s something that would be weird to bring into bed during sex?", bluff: "What’s something that would be weird to bring to work?" },
  { normal: "What’s a profession that probably has the best sex lives?", bluff: "What’s a profession that seems the most exciting?" },
  { normal: "What’s something that would be suspicious to find in someone’s bedroom?", bluff: "What’s something that you own that you don't want other people to see?" },
  { normal: "What’s something that would make boobs less attractive?", bluff: "Write \"if they were on ____\" and fill in the blank with anyone" },
  { normal: "What’s something you’d never want someone to say about your penis?", bluff: "What’s something a snail would love to hear?" },
  { normal: "What’s something that would be the worst excuse to avoid sex?", bluff: "What’s the best excuse for not doing your homework?" },
  { normal: "What’s something that would make a hookup immediately awkward?", bluff: "Name a bad person" },
  { normal: "What’s something that would be weird to compliment about someone’s body?", bluff: "How would you compliment a horse?" },
  { normal: "What’s something that would be uncomfortable to hear during sex?", bluff: "What’s something weird to hear in a quiet moment?" },
  { normal: "What’s something that would make a kiss instantly bad?", bluff: "What’s something that would make a first impression bad?" },
  { normal: "What’s something that would be weird to do after sex?", bluff: "What’s something you would want to do after a sad movie" },
  { normal: "What’s something that would be the worst thing to say about someone’s vagina?", bluff: "How would you describe old person boobies" },
  { normal: "Create a name for a vagina", bluff: "Create a nickname for a turtle" },
  { normal: "Create a name for boobs", bluff: "Create a nickname for balls" }
];

const PRESET_COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ffffff'];

const THEMES = {
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-400', ring: 'focus:ring-rose-400', lightBg: 'bg-rose-100', lightText: 'text-rose-600', shadow: 'shadow-rose-200', hover: 'hover:bg-rose-600', activeRing: 'ring-rose-50', name: 'Rose' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500', ring: 'focus:ring-indigo-500', lightBg: 'bg-indigo-100', lightText: 'text-indigo-700', shadow: 'shadow-indigo-200', hover: 'hover:bg-indigo-700', activeRing: 'ring-indigo-50', name: 'Indigo' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-400', ring: 'focus:ring-emerald-400', lightBg: 'bg-emerald-100', lightText: 'text-emerald-700', shadow: 'shadow-emerald-200', hover: 'hover:bg-emerald-600', activeRing: 'ring-emerald-50', name: 'Emerald' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-400', ring: 'focus:ring-amber-400', lightBg: 'bg-amber-100', lightText: 'text-amber-700', shadow: 'shadow-amber-200', hover: 'hover:bg-amber-600', activeRing: 'ring-amber-50', name: 'Amber' },
  zebra: { bg: 'bg-zinc-800', text: 'text-zinc-800', border: 'border-zinc-500', ring: 'focus:ring-zinc-600', lightBg: 'bg-zinc-200', lightText: 'text-zinc-800', shadow: 'shadow-zinc-400', hover: 'hover:bg-zinc-900', activeRing: 'ring-zinc-100', name: 'Zebra', style: { backgroundImage: 'repeating-linear-gradient(45deg, #27272a, #27272a 15px, #3f3f46 15px, #3f3f46 30px)' } },
  grid: { bg: 'bg-slate-700', text: 'text-slate-700', border: 'border-slate-500', ring: 'focus:ring-slate-500', lightBg: 'bg-slate-200', lightText: 'text-slate-800', shadow: 'shadow-slate-400', hover: 'hover:bg-slate-800', activeRing: 'ring-slate-100', name: 'Grid', style: { backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#334155' } },
  dots: { bg: 'bg-cyan-700', text: 'text-cyan-700', border: 'border-cyan-500', ring: 'focus:ring-cyan-500', lightBg: 'bg-cyan-200', lightText: 'text-cyan-800', shadow: 'shadow-cyan-400', hover: 'hover:bg-cyan-800', activeRing: 'ring-cyan-100', name: 'Dots', style: { backgroundImage: 'radial-gradient(#06b6d4 2px, transparent 2px)', backgroundSize: '20px 20px', backgroundColor: '#0e7490' } }
};

const DrawingCanvas = ({ onSave, disabled, initialData, themeObj }) => {
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
  }, [initialData]);

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
    <div className="flex flex-col gap-2 w-full h-full relative">
      <div className="flex flex-wrap gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded-2xl shadow-md items-center justify-center">
        <div className="flex gap-1 sm:gap-2 justify-center w-full sm:w-auto">
          <div className="flex bg-stone-100 rounded-lg p-1">
            <button onClick={() => setTool('pen')} className={`p-1.5 sm:p-2 rounded ${tool === 'pen' ? 'bg-white shadow' : ''}`}><Palette size={18} /></button>
            <button onClick={() => setTool('eraser')} className={`p-1.5 sm:p-2 rounded ${tool === 'eraser' ? 'bg-white shadow' : ''}`}><Eraser size={18} /></button>
          </div>
          <div className="flex bg-stone-100 rounded-lg p-1">
            <button onClick={() => setTool('square')} className={`p-1.5 sm:p-2 rounded ${tool === 'square' ? 'bg-white shadow' : ''}`}><Square size={18} /></button>
            <button onClick={() => setTool('circle')} className={`p-1.5 sm:p-2 rounded ${tool === 'circle' ? 'bg-white shadow' : ''}`}><Circle size={18} /></button>
            <button onClick={() => setTool('triangle')} className={`p-1.5 sm:p-2 rounded ${tool === 'triangle' ? 'bg-white shadow' : ''}`}><Triangle size={18} /></button>
            <button onClick={() => setTool('line')} className={`p-1.5 sm:p-2 rounded ${tool === 'line' ? 'bg-white shadow' : ''}`}><Minus size={18} /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 justify-center w-full sm:w-auto">
          <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(e.target.value)} className="w-16 sm:w-20" />
          <div className="flex gap-1 sm:gap-1.5 ml-1 flex-wrap justify-center">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 shadow-sm ${color === c ? 'border-stone-800 scale-110' : 'border-stone-200'}`} style={{ backgroundColor: c }} />
            ))}
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-inner flex items-center justify-center cursor-pointer border-2 border-stone-800" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
              <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-white/50" style={{ backgroundColor: color }} />
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
          <button onClick={undo} className="ml-1 p-1.5 sm:p-2 hover:bg-stone-100 rounded bg-stone-50"><Undo2 size={18} /></button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-inner border-2 border-dashed border-stone-200 relative overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startAction}
          onMouseMove={performAction}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={startAction}
          onTouchMove={performAction}
          onTouchEnd={stopAction}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isPortrait, setIsPortrait] = useState(false);
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
  const [hasVoted, setHasVoted] = useState(false);
  const [myDrawing, setMyDrawing] = useState('');
  const [joinedRoomCode, setJoinedRoomCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const getRoomRef = (code) => doc(collection(db, 'rooms'), code.trim());

  useEffect(() => {
    const checkOrientation = () => {
        setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 1024);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
      }
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
    }, (err) => {
      console.error("Snapshot error:", err);
      setError("Sync Error: " + err.message);
    });
  }, [user, joinedRoomCode, localPlayerId]);

  useEffect(() => {
    if (gameState?.status === 'DRAWING' || gameState?.status === 'LOBBY') {
      setHasVoted(false);
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

  useEffect(() => {
    if (isHost && gameState?.status === 'DRAWING') {
      if (gameState.readyPlayers?.length === gameState.players.length && gameState.players.length > 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        updateDoc(getRoomRef(joinedRoomCode), { status: 'REVEAL', timer: 0 });
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

  const runTimer = (seconds, nextStatus) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let timeLeft = seconds;
    timerRef.current = setInterval(async () => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        if (nextStatus === 'RESULTS_CALC') calculateResults();
        else updateDoc(getRoomRef(joinedRoomCode), { status: nextStatus, timer: 0 });
      } else {
        updateDoc(getRoomRef(joinedRoomCode), { timer: timeLeft });
      }
    }, 1000);
  };

  const copyInviteLink = () => {
    const textArea = document.createElement("textarea");
    textArea.value = window.location.href;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const createRoom = async () => {
    if (!userName.trim()) return setError("Name required");
    if (!user) return setError("Connecting to server, please wait...");
    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await setDoc(getRoomRef(code), {
        code, hostId: localPlayerId, theme: 'rose', status: 'LOBBY',
        targetScore: 5,
        susMode: false,
        susQuestionsAsked: 0,
        susRequest: null,
        players: [{ id: localPlayerId, name: userName, score: 0 }],
        readyPlayers: [], drawings: {}, votes: {}, round: 1, createdAt: Date.now()
      });
      setJoinedRoomCode(code);
      setIsHost(true);
    } catch (err) { setError("Failed to create room: " + err.message); } 
    finally { setLoading(false); }
  };

  const joinRoom = async () => {
    if (!userName.trim() || !roomCode.trim()) return setError("Name/Code required");
    if (!user) return setError("Connecting to server, please wait...");
    setLoading(true);
    const roomRef = getRoomRef(roomCode);
    try {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) throw new Error("Room not found");
      const data = snap.data();
      if (data.players.length >= 8) throw new Error("Room full");
      if (data.status !== 'LOBBY') throw new Error("Game already in progress");

      if (!data.players.some(p => p.id === localPlayerId)) {
        await updateDoc(roomRef, { players: arrayUnion({ id: localPlayerId, name: userName, score: 0 }) });
      }
      setJoinedRoomCode(roomCode);
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const startRound = async () => {
    if (!user || !isHost) return;

    let useSus = false;
    
    if (gameState.susMode) {
        const estimatedTotalRounds = gameState.targetScore || 5; 
        const targetSusQuestions = Math.max(1, Math.round(estimatedTotalRounds * 0.25));
        const susCount = gameState.susQuestionsAsked || 0;
        const currentRound = gameState.round || 1;
        const estimatedRoundsLeft = Math.max(1, estimatedTotalRounds - currentRound + 1);

        if (susCount < targetSusQuestions) {
            const probability = (targetSusQuestions - susCount) / estimatedRoundsLeft;
            useSus = Math.random() <= probability;
        }
    }

    const promptList = useSus ? SUS_PROMPTS : PROMPT_PAIRS;
    const prompt = promptList[Math.floor(Math.random() * promptList.length)];
    const impId = gameState.players[Math.floor(Math.random() * gameState.players.length)].id;
    
    const isGameOver = gameState.players.some(p => p.score >= (gameState.targetScore || 5));
    const playersToSave = isGameOver 
      ? gameState.players.map(p => ({ ...p, score: 0 })) 
      : gameState.players;

    const newRound = isGameOver ? 1 : (gameState.round || 1) + 1;
    const newSusCount = isGameOver ? 0 : (useSus ? (gameState.susQuestionsAsked || 0) + 1 : (gameState.susQuestionsAsked || 0));

    await updateDoc(getRoomRef(joinedRoomCode), {
      status: 'DRAWING', currentPrompt: prompt, impostorId: impId,
      drawings: {}, votes: {}, readyPlayers: [], timer: 90, 
      round: newRound,
      susQuestionsAsked: newSusCount,
      players: playersToSave
    });
    runTimer(90, 'REVEAL');
  };

  const calculateResults = async () => {
    if (!user || !isHost) return;
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(getRoomRef(joinedRoomCode));
        if (!snap.exists()) return;
        const { players, votes, impostorId } = snap.data();
        const voteEntries = Object.entries(votes || {});
        const caughtCount = voteEntries.filter(([v, t]) => t === impostorId).length;

        const updated = players.map(p => {
          let add = 0;
          if (p.id === impostorId) {
            if (caughtCount === 0) add = 3;
            else if (caughtCount < players.length / 2) add = 2;
          } else if (votes[p.id] === impostorId) add = 1;
          return { ...p, score: p.score + add };
        });
        transaction.update(getRoomRef(joinedRoomCode), { players: updated, status: 'RESULTS' });
      });
    } catch (e) { console.error("Result calc failed:", e); }
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
    if (hasVoted || gameState?.status !== 'VOTING' || !user) return;
    setHasVoted(true);
    await updateDoc(getRoomRef(joinedRoomCode), { [`votes.${localPlayerId}`]: targetUid });
  };

  const requestSusMode = async () => {
    if (!user || isHost) return;
    await updateDoc(getRoomRef(joinedRoomCode), { susRequest: { requesterName: userName, requesterId: localPlayerId } });
  };

  const handleSusRequest = async (accept) => {
    if (!isHost) return;
    if (accept) {
      await updateDoc(getRoomRef(joinedRoomCode), { susMode: true, susRequest: null });
    } else {
      await updateDoc(getRoomRef(joinedRoomCode), { susRequest: null });
    }
  };

  const t = THEMES[gameState?.theme] || THEMES.rose;

  // GLOBAL ORIENTATION OVERLAY
  if (isPortrait) {
    return (
      <div className="fixed inset-0 z-[999] bg-stone-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 mb-6 relative">
          <RotateCw size={96} className="text-blue-500 animate-spin-slow opacity-20 absolute inset-0" />
          <Smartphone size={80} className="text-white absolute inset-0 m-auto animate-bounce-horizontal" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Turn your phone sideways</h2>
        <p className="text-stone-400 font-bold text-sm max-w-[200px]">This game is designed to be played in landscape mode for a better whiteboard experience.</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-blue-600 italic text-center mb-6 sm:mb-8 tracking-tighter">BLUFF</h1>
          <div className="space-y-3">
            <input type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-3 sm:p-4 bg-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base" />
            <button onClick={createRoom} disabled={loading} className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Host Game</button>
            <div className="flex gap-2 pt-1">
              <input type="text" maxLength={6} inputMode="numeric" pattern="[0-9]*" placeholder="6-Digit Code" value={roomCode} onChange={e => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))} className="flex-1 p-3 sm:p-4 bg-slate-100 rounded-xl text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base" />
              <button onClick={joinRoom} disabled={loading} className="px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 active:scale-95 transition-all text-base">Join</button>
            </div>
            {error && <p className="text-red-500 text-center font-medium mt-2 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'LOBBY') {
    return (
      <div className={`min-h-screen ${t.bg} p-4 sm:p-6 text-white transition-colors duration-500 flex flex-col`} style={t.style}>
        {isHost && gameState.susRequest && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                 <div className="text-5xl mb-4 flex justify-center"><Flame size={48} className="text-rose-500" /></div>
                 <h3 className="text-lg sm:text-xl font-black text-stone-800 mb-6 leading-tight">
                    {gameState.susRequest.requesterName} has requested Sus addition, turn it on?
                 </h3>
                 <div className="flex gap-3">
                    <button onClick={() => handleSusRequest(false)} className="flex-1 py-3 bg-stone-200 text-stone-700 hover:bg-stone-300 font-bold rounded-xl transition-all">No</button>
                    <button onClick={() => handleSusRequest(true)} className="flex-1 py-3 bg-rose-500 text-white hover:bg-rose-600 font-bold rounded-xl shadow-lg shadow-rose-200 transition-all">Yes</button>
                 </div>
             </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black drop-shadow-md leading-none">{gameState.code}</h2>
            <button onClick={copyInviteLink} className="mt-2 flex items-center gap-1.5 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-all">
              {linkCopied ? <Check size={12} className="text-green-300" /> : <Copy size={12} />}
              {linkCopied ? "Copied!" : "Invite Link"}
            </button>
          </div>
          {isHost && (
             <button onClick={startRound} disabled={gameState.players.length < 2} className="px-8 py-3 bg-white text-stone-800 rounded-xl font-black shadow-xl active:scale-95 transition-all text-sm uppercase">Start Game</button>
          )}
        </div>
        
        <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col gap-4">
                {isHost ? (
                    <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-900/40 shadow-inner backdrop-blur-md overflow-y-auto">
                        <label className="flex items-center justify-between bg-stone-900/40 p-3 rounded-xl border border-stone-900/20 cursor-pointer hover:bg-stone-900/60 transition-all mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
                            <Flame size={14} className={gameState.susMode ? "text-rose-400" : "text-stone-400"} />
                            Include Sus questions
                        </span>
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${gameState.susMode ? 'bg-rose-500' : 'bg-stone-600'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${gameState.susMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={!!gameState.susMode} onChange={(e) => updateDoc(getRoomRef(joinedRoomCode), { susMode: e.target.checked })} />
                        </label>

                        <div className="flex gap-4 items-center mb-4 pb-4 border-b border-white/10">
                            <div className="flex-1">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Theme</h3>
                                <div className="flex flex-wrap gap-2">
                                {Object.keys(THEMES).map(k => (
                                    <button key={k} onClick={() => updateDoc(getRoomRef(joinedRoomCode), {theme: k})} 
                                    style={THEMES[k].style} 
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${gameState.theme === k ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`} />
                                ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Win At</span>
                            <div className="flex items-center gap-3">
                                <input type="range" min="3" max="15" value={gameState.targetScore || 5} onChange={e => updateDoc(getRoomRef(joinedRoomCode), { targetScore: parseInt(e.target.value) })} className="w-24 accent-white" />
                                <span className="text-base font-black bg-white/20 px-2 py-0.5 rounded">{gameState.targetScore || 5}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-stone-900/30 p-4 rounded-xl border border-stone-900/20 shadow-inner backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/90">Points to Win</span>
                            <span className="text-lg font-black bg-white/20 px-4 py-1 rounded-lg">{gameState.targetScore || 5}</span>
                        </div>
                        {!gameState.susMode ? (
                            <button onClick={requestSusMode} className="w-full py-3 bg-stone-900/40 hover:bg-stone-900/60 border border-stone-900/20 rounded-xl text-xs font-bold text-white/90 uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <Flame size={14} className="text-stone-400" /> Request Sus addition
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-100 uppercase tracking-widest flex items-center justify-center gap-2">
                                <Flame size={14} className="text-rose-400" /> Sus addition is ON
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="w-1/3 bg-white rounded-2xl p-4 text-stone-800 overflow-y-auto shadow-2xl flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b pb-2 mb-1">Players</h3>
                {gameState.players.map(p => (
                    <div key={p.id} className="p-2 bg-stone-50 rounded-lg font-bold flex items-center gap-2 border border-stone-100 text-xs">
                        <div className={`w-5 h-5 rounded-full ${t.bg} text-white flex items-center justify-center text-[10px]`}>{p.name[0]}</div>
                        <span className="truncate">{p.name} {p.id === localPlayerId && "(You)"}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'DRAWING' || gameState.status === 'REVEAL') {
    const isImp = gameState.impostorId === localPlayerId;
    const prompt = isImp ? gameState.currentPrompt.bluff : gameState.currentPrompt.normal;
    const isFrozen = gameState.status === 'REVEAL';
    const isReady = gameState.readyPlayers?.includes(localPlayerId);

    return (
      <div className="fixed inset-0 h-screen w-screen bg-white flex flex-col overflow-hidden">
        {/* Landscape-optimized Header */}
        <div className="bg-white px-4 py-2 border-b flex justify-between items-center z-10 shadow-sm shrink-0">
          <div className="flex-1 pr-4 min-w-0">
            <span className="text-[8px] font-black text-stone-400 block uppercase leading-none mb-0.5">Prompt</span>
            <span className={`text-sm font-black leading-tight truncate block ${t.text}`}>{prompt}</span>
          </div>
          <div className="font-mono font-bold bg-stone-100 px-3 py-1 rounded-full text-xs flex-shrink-0">{gameState.timer}s</div>
        </div>

        <div className="flex-1 p-1 overflow-hidden flex flex-col">
          <DrawingCanvas key={gameState.round} onSave={(d) => setMyDrawing(d)} disabled={isFrozen} initialData={myDrawing} themeObj={t} />
        </div>

        <div className="px-3 py-1.5 bg-white border-t border-stone-100 flex justify-between items-center z-10 shrink-0">
          <span className="text-[9px] font-bold text-stone-400 uppercase">{gameState.readyPlayers?.length || 0}/{gameState.players.length} Ready</span>
          <div className="flex gap-2">
            {!isFrozen ? (
                <button onClick={toggleReady}
                    className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${isReady ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    {isReady ? "LOCKED IN" : "SUBMIT"}
                </button>
            ) : (
                isHost && (
                    <button onClick={goToVoting} className={`px-8 py-2 ${t.bg} text-white rounded-lg font-black text-xs shadow-lg uppercase`}>Reveal Vote</button>
                )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'VOTING') {
    return (
      <div className="min-h-screen bg-stone-50 p-4 overflow-y-auto">
        <h2 className="text-xl font-black mb-1 text-stone-800">Who's lying?</h2>
        <p className="text-stone-500 mb-4 font-medium text-xs italic">The prompt was: <span className={`font-bold not-italic ${t.text}`}>{gameState.currentPrompt.normal}</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gameState.players.map(p => (
            <button key={p.id} disabled={hasVoted || p.id === localPlayerId} onClick={() => {submitVote(p.id); setHasVoted(true);}}
              className={`bg-white p-2 rounded-2xl border-2 shadow-sm transition-all ${gameState.votes?.[localPlayerId] === p.id ? `${t.border} ring-2 ${t.activeRing}` : 'border-stone-100 hover:border-stone-300'}`}>
              <div className="aspect-video bg-stone-100 rounded-xl mb-2 overflow-hidden border border-stone-100 relative">
                {gameState.drawings?.[p.id] ? (
                  <img src={gameState.drawings[p.id]} className="w-full h-full object-contain absolute inset-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold text-[8px] uppercase tracking-widest absolute inset-0 text-center">Empty Canvas</div>
                )}
              </div>
              <span className="font-bold text-xs text-stone-700 truncate block">{p.name} {p.id === localPlayerId && "(You)"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState.status === 'COUNTDOWN') {
    return (
      <div className={`h-screen ${t.bg} flex flex-col items-center justify-center text-white`} style={t.style}>
        <h2 className="text-xl font-black text-white/90 tracking-widest uppercase mb-4 drop-shadow-md bg-black/20 px-6 py-2 rounded-full">Results in...</h2>
        <div className="text-center animate-pulse text-[10rem] font-black drop-shadow-2xl leading-none">{gameState.timer}</div>
      </div>
    );
  }

  if (gameState.status === 'RESULTS') {
    const imp = gameState.players.find(p => p.id === gameState.impostorId);
    const isGameOver = gameState.players.some(p => p.score >= (gameState.targetScore || 5));
    const maxScore = Math.max(...gameState.players.map(p => p.score));
    const winners = gameState.players.filter(p => p.score === maxScore && p.score >= (gameState.targetScore || 5));

    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-row gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col justify-center text-center">
            {isGameOver && (
            <div className="bg-amber-400 text-amber-900 p-4 rounded-2xl mb-4 shadow-xl border-4 border-amber-200">
                <h2 className="text-xl font-black uppercase tracking-widest">🏆 Game Won!</h2>
                <p className="font-black text-lg">{winners.map(w => w.name).join(' & ')}</p>
            </div>
            )}
            <div className={`${t.text} font-black uppercase tracking-widest text-[10px] mb-1 opacity-70`}>The Impostor Was</div>
            <h2 className="text-4xl font-black text-stone-800 mb-6 drop-shadow-sm">{imp?.name}</h2>
            {isHost && <button onClick={startRound} className={`py-4 ${t.bg} text-white rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all w-full`} style={t.style}>{isGameOver ? 'New Game' : 'Next Round'}</button>}
        </div>

        <div className="flex-1 bg-white rounded-2xl p-4 shadow-xl border border-stone-100 overflow-y-auto">
          <div className="text-[9px] font-black border-b border-stone-100 pb-2 mb-3 flex flex-col gap-1">
            <span className="text-stone-400 uppercase tracking-widest">Prompts</span>
            <span className="text-stone-800">Normal: {gameState.currentPrompt.normal}</span>
            <span className={t.text}>Bluff: {gameState.currentPrompt.bluff}</span>
          </div>
          <div className="space-y-1.5">
            {gameState.players.sort((a,b)=>b.score-a.score).map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center p-2 rounded-xl ${p.id === gameState.impostorId ? `${t.lightBg} border border-dashed ${t.border}` : 'bg-stone-50 border border-stone-100'}`}>
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <span className="font-black text-stone-300 text-[10px] w-3">{i+1}</span>
                  <span className={`font-bold truncate text-xs ${p.id === gameState.impostorId ? t.text : 'text-stone-700'}`}>{p.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy size={12} className={isGameOver && winners.some(w => w.id === p.id) ? "text-amber-500" : "text-stone-300"} />
                  <span className="font-black text-stone-800 text-sm">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}