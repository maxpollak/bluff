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
  Square, Circle, Triangle, Minus, Copy, Check
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
  { normal: "Write an actor you could beat in a physical fight.", bluff: "Who is the ugliest actor in Hollywood?" },
  { normal: "What is the worst smell in the world?", bluff: "Name a food that you absolutely hate." },
  { normal: "What is the most useless superpower?", bluff: "What would you do if you were invisible for a day?" },
  { normal: "Draw the color that best describes your current mood.", bluff: "What is your favorite color?" },
  { normal: "Name a fruit that would be a terrible weapon.", bluff: "What is your favorite fruit to eat?" },
  { normal: "Draw a logo for a company that sells 'Disappointment'.", bluff: "Draw a logo for a generic tech company." },
  { normal: "What animal would be the rudest if it could talk?", bluff: "What is your favorite animal?" },
  { normal: "What's the weirdest thing you've seen in a bathroom?", bluff: "Name an object you find in a typical bathroom." }
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
      if (initialData) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = initialData;
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
        {disabled && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
             <span className="bg-white/90 px-4 py-2 rounded-full font-bold text-stone-500 shadow-lg text-sm sm:text-base">Canvas Frozen</span>
          </div>
        )}
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
  const [hasVoted, setHasVoted] = useState(false);
  const [myDrawing, setMyDrawing] = useState('');
  const [joinedRoomCode, setJoinedRoomCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Directly points to your database's 'rooms' collection
  const getRoomRef = (code) => doc(collection(db, 'rooms'), code.trim());

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
    if (gameState?.status === 'DRAWING') {
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
    const prompt = PROMPT_PAIRS[Math.floor(Math.random() * PROMPT_PAIRS.length)];
    const impId = gameState.players[Math.floor(Math.random() * gameState.players.length)].id;
    
    const isGameOver = gameState.players.some(p => p.score >= (gameState.targetScore || 5));
    const playersToSave = isGameOver 
      ? gameState.players.map(p => ({ ...p, score: 0 })) 
      : gameState.players;

    await updateDoc(getRoomRef(joinedRoomCode), {
      status: 'DRAWING', currentPrompt: prompt, impostorId: impId,
      drawings: {}, votes: {}, readyPlayers: [], timer: 90, 
      round: isGameOver ? 1 : (gameState.round || 1) + 1,
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

  const t = THEMES[gameState?.theme] || THEMES.rose;

  if (!gameState) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-blue-600 italic text-center mb-6 sm:mb-8">BLUFF</h1>
          <div className="space-y-3 sm:space-y-4">
            <input type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-3 sm:p-4 bg-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base" />
            <button onClick={createRoom} disabled={loading} className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Host Game</button>
            
            {/* THIS IS THE JOIN BUTTON FIX: Stacks neatly on phones! */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <input type="text" maxLength={6} inputMode="numeric" pattern="[0-9]*" placeholder="6-Digit Code" value={roomCode} onChange={e => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))} className="w-full sm:flex-1 p-3 sm:p-4 bg-slate-100 rounded-xl text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base" />
              <button onClick={joinRoom} disabled={loading} className="w-full sm:w-auto px-8 py-3 sm:py-0 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 active:scale-95 transition-all text-base">Join</button>
            </div>
            
            {error && <p className="text-red-500 text-center font-medium mt-2 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'LOBBY') {
    return (
      <div className={`min-h-[100dvh] ${t.bg} p-4 sm:p-6 text-white transition-colors duration-500 flex flex-col`} style={t.style}>
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black drop-shadow-md">{gameState.code}</h2>
            <button onClick={copyInviteLink} className="mt-2 flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all">
              {linkCopied ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
              {linkCopied ? "Copied!" : "Copy Invite Link"}
            </button>
          </div>
        </div>
        
        {isHost && (
          <div className="mb-4 sm:mb-6 bg-stone-900/60 p-4 rounded-xl border border-stone-900/40 shadow-inner backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2 drop-shadow-sm">
              <Palette size={14} /> Room Theme
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pb-4 border-b border-white/20 mb-4">
              {Object.keys(THEMES).map(k => (
                <button key={k} onClick={() => updateDoc(getRoomRef(joinedRoomCode), {theme: k})} 
                  style={THEMES[k].style} 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border-2 ${THEMES[k].bg} transition-all duration-300 ${gameState.theme === k ? 'border-white scale-110 shadow-xl ring-2 ring-white/50' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`} />
              ))}
            </div>
            
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90 mb-3 flex items-center justify-between drop-shadow-sm">
              <span className="flex items-center gap-2"><Trophy size={14} /> Points to Win</span>
              <span className="text-base sm:text-lg font-black bg-white/20 px-3 py-1 rounded-lg">{gameState.targetScore || 5}</span>
            </h3>
            <input 
              type="range" min="3" max="15" 
              value={gameState.targetScore || 5} 
              onChange={e => updateDoc(getRoomRef(joinedRoomCode), { targetScore: parseInt(e.target.value) })}
              className="w-full accent-white cursor-pointer" 
            />
          </div>
        )}

        {!isHost && (
          <div className="mb-4 sm:mb-6 bg-stone-900/30 p-4 rounded-xl border border-stone-900/20 shadow-inner backdrop-blur-md flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90 drop-shadow-sm">Points to Win</span>
            <span className="text-lg sm:text-xl font-black bg-white/20 px-4 py-1 rounded-lg shadow-inner">{gameState.targetScore || 5}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-4 sm:p-6 text-stone-800 flex-1 sm:h-72 overflow-y-auto mb-4 sm:mb-6 shadow-2xl">
          {gameState.players.map(p => (
            <div key={p.id} className="p-2 sm:p-3 mb-2 bg-stone-50 rounded-xl font-bold flex items-center gap-3 border border-stone-100 text-sm sm:text-base">
              <div className={`w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center transition-colors duration-500 flex-shrink-0`}>{p.name[0]}</div>
              <span className="truncate">{p.name} {p.id === localPlayerId && "(You)"}</span>
            </div>
          ))}
        </div>
        {isHost && (
          <button onClick={startRound} disabled={gameState.players.length < 2} className="w-full py-3 sm:py-4 bg-white text-stone-800 rounded-2xl font-black shadow-xl active:scale-95 transition-all mt-auto text-sm sm:text-base">Start Round</button>
        )}
      </div>
    );
  }

  if (gameState.status === 'DRAWING' || gameState.status === 'REVEAL') {
    const isImp = gameState.impostorId === localPlayerId;
    const prompt = isImp ? gameState.currentPrompt.bluff : gameState.currentPrompt.normal;
    const isFrozen = gameState.status === 'REVEAL';
    const isReady = gameState.readyPlayers?.includes(localPlayerId);

    return (
      <div className="h-[100dvh] bg-stone-50 flex flex-col">
        <div className="bg-white p-3 sm:p-4 border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex-1 pr-2 sm:pr-4 min-w-0">
            <span className="text-[10px] font-bold text-stone-400 block uppercase">Your Secret Prompt</span>
            <span className={`text-sm sm:text-lg font-black leading-tight truncate block ${t.text} transition-colors duration-500`}>{prompt}</span>
          </div>
          <div className="font-mono font-bold bg-stone-100 px-3 py-1 rounded-full text-sm sm:text-base flex-shrink-0">{gameState.timer}s</div>
        </div>
        <div className="flex-1 p-2 overflow-hidden flex flex-col">
          <DrawingCanvas key={gameState.round} onSave={(d) => setMyDrawing(d)} disabled={isFrozen} initialData={myDrawing} themeObj={t} />
        </div>
        {!isFrozen && (
          <div className="p-3 sm:p-4 bg-white border-t border-stone-200 flex justify-between items-center z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase">{gameState.readyPlayers?.length || 0} / {gameState.players.length} Done</span>
            <button onClick={toggleReady}
              className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all ${isReady ? 'bg-green-500 text-white shadow-lg shadow-green-200 ring-2 ring-green-400 ring-offset-2' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>
              {isReady ? "READY!" : "DONE"}
            </button>
          </div>
        )}
        {isFrozen && isHost && (
          <button onClick={goToVoting} className={`m-3 sm:m-4 py-3 sm:py-4 ${t.bg} text-white rounded-xl font-black shadow-lg active:scale-95 transition-all text-sm sm:text-base`} style={t.style}>Open Voting</button>
        )}
      </div>
    );
  }

  if (gameState.status === 'VOTING') {
    return (
      <div className="min-h-[100dvh] bg-stone-50 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-black mb-1 sm:mb-2 text-stone-800">Vote for the Impostor!</h2>
        <p className="text-stone-500 mb-4 sm:mb-6 font-medium text-xs sm:text-base">Target Prompt: <span className={`font-bold ${t.text} transition-colors duration-500`}>{gameState.currentPrompt.normal}</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {gameState.players.map(p => (
            <button key={p.id} disabled={hasVoted || p.id === localPlayerId} onClick={() => {submitVote(p.id); setHasVoted(true);}}
              className={`bg-white p-2 rounded-2xl border-2 shadow-sm transition-all ${gameState.votes?.[localPlayerId] === p.id ? `${t.border} ring-4 ${t.activeRing}` : 'border-stone-100 hover:border-stone-300'}`}>
              <div className="aspect-square bg-stone-50 rounded-xl mb-2 overflow-hidden border border-stone-100 relative">
                {gameState.drawings?.[p.id] ? (
                  <img src={gameState.drawings[p.id]} className="w-full h-full object-contain absolute inset-0" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold text-[10px] tracking-wider absolute inset-0">NO DRAWING</div>
                )}
              </div>
              <span className="font-bold text-xs sm:text-sm text-stone-700 truncate block">{p.name} {p.id === localPlayerId && "(You)"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState.status === 'COUNTDOWN') {
    return (
      <div className={`min-h-[100dvh] ${t.bg} flex flex-col items-center justify-center text-white transition-colors duration-500 p-4`} style={t.style}>
        <h2 className="text-xl sm:text-2xl font-black text-white/90 tracking-widest uppercase mb-4 drop-shadow-md bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm text-center">All Votes In!</h2>
        <div className="text-center animate-pulse text-[10rem] sm:text-[15rem] font-black drop-shadow-2xl leading-none">{gameState.timer}</div>
      </div>
    );
  }

  if (gameState.status === 'RESULTS') {
    const imp = gameState.players.find(p => p.id === gameState.impostorId);
    const isGameOver = gameState.players.some(p => p.score >= (gameState.targetScore || 5));
    const maxScore = Math.max(...gameState.players.map(p => p.score));
    const winners = gameState.players.filter(p => p.score === maxScore && p.score >= (gameState.targetScore || 5));

    return (
      <div className="min-h-[100dvh] bg-stone-50 p-4 sm:p-6 flex flex-col">
        {isGameOver && (
          <div className="text-center bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 p-4 sm:p-6 rounded-3xl mb-4 sm:mb-6 shadow-2xl border-4 border-amber-200 animate-bounce">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest mb-1">🏆 Game Over! 🏆</h2>
            <p className="font-black text-xl sm:text-2xl drop-shadow-sm">{winners.map(w => w.name).join(' & ')} Won!</p>
          </div>
        )}
        <div className="text-center mb-6 sm:mb-8 mt-2">
          <div className={`${t.text} font-bold uppercase tracking-widest text-xs sm:text-sm mb-1 sm:mb-2 opacity-80 transition-colors duration-500`}>The Impostor Was</div>
          <h2 className="text-4xl sm:text-5xl font-black text-stone-800 drop-shadow-sm">{imp?.name}</h2>
        </div>
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl shadow-stone-200/50 border border-stone-100 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs font-bold border-b border-stone-100 pb-3 sm:pb-4 mb-3 sm:mb-4 gap-2">
            <span className="text-stone-500">Group: <span className="text-stone-800">{gameState.currentPrompt.normal}</span></span>
            <span className={`${t.text} transition-colors duration-500`}>Impostor: <span className="font-black">{gameState.currentPrompt.bluff}</span></span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {gameState.players.sort((a,b)=>b.score-a.score).map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center p-3 sm:p-4 rounded-2xl ${p.id === gameState.impostorId ? `${t.lightBg} ${t.border}` : 'bg-stone-50 border border-stone-100'} transition-colors duration-500`}>
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden pr-2">
                  <span className="font-black text-stone-400 text-xs sm:text-base flex-shrink-0 w-4 text-center">{i+1}</span>
                  <span className={`font-bold truncate text-sm sm:text-base ${p.id === gameState.impostorId ? t.text : 'text-stone-700'}`}>{p.name} {p.id === localPlayerId && "(You)"}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  <Trophy size={14} className={`sm:w-4 sm:h-4 ${isGameOver && winners.some(w => w.id === p.id) ? "text-amber-500 scale-125" : "text-stone-300"}`} />
                  <span className="font-black text-stone-800 text-base sm:text-lg">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {isHost && <button onClick={startRound} className={`mt-4 sm:mt-6 py-3 sm:py-4 ${t.bg} text-white rounded-2xl font-black text-base sm:text-lg shadow-lg active:scale-95 transition-all duration-500 w-full flex-shrink-0`} style={t.style}>{isGameOver ? 'Play Again (Reset Scores)' : 'Play Next Round'}</button>}
      </div>
    );
  }

  return null;
}