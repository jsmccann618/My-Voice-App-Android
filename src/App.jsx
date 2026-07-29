import { useState, useRef, useEffect, useCallback } from "react";
import { loadFromFirestore, saveToFirestore, uploadPhoto } from "./firebase";
import { sendMessage, subscribeToMessages, loadMessages, sendReply, markRead } from "./supabase";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
  {
    id:"eat", label:"Food & Drinks", emoji:"🍽️", photo:null,
    color:"#FF6B35", dark:"#C94A1A", light:"#FFAA85", phrase:"I want to eat",
    items:[
      {id:"e1",name:"Pizza",emoji:"🍕",photo:null},
      {id:"e2",name:"Mac & Cheese",emoji:"🧀",photo:null},
      {id:"e3",name:"Apple",emoji:"🍎",photo:null},
      {id:"e4",name:"Chicken Nuggets",emoji:"🍗",photo:null},
      {id:"e5",name:"Ice Cream",emoji:"🍦",photo:null},
      {id:"e6",name:"Sandwich",emoji:"🥪",photo:null},
    ],
  },
  {
    id:"go", label:"I Want to Go", emoji:"🚗", photo:null,
    color:"#4ECDC4", dark:"#2A9990", light:"#9EEEE8", phrase:"I want to go to",
    items:[
      {id:"g1",name:"McDonald's",emoji:"🍟",photo:null},
      {id:"g2",name:"The Park",emoji:"🌳",photo:null},
      {id:"g3",name:"Grandma's",emoji:"🏠",photo:null},
      {id:"g4",name:"The Store",emoji:"🛒",photo:null},
      {id:"g5",name:"School",emoji:"🏫",photo:null},
    ],
  },
  {
    id:"do", label:"I Want to Do", emoji:"⭐", photo:null,
    color:"#A855F7", dark:"#7B22D4", light:"#D4A0FF", phrase:"I want to",
    items:[
      {id:"d1",name:"Watch TV",emoji:"📺",photo:null},
      {id:"d2",name:"Play Outside",emoji:"⚽",photo:null},
      {id:"d3",name:"Read a Book",emoji:"📚",photo:null},
      {id:"d4",name:"Take a Bath",emoji:"🛁",photo:null},
      {id:"d5",name:"Play Games",emoji:"🎮",photo:null},
    ],
  },
  {
    id:"feel", label:"I Feel", emoji:"💛", photo:null,
    color:"#F59E0B", dark:"#B86E00", light:"#FCD34D", phrase:"I feel",
    items:[
      {id:"f1",name:"Happy",emoji:"😊",photo:null},
      {id:"f2",name:"Sad",emoji:"😢",photo:null},
      {id:"f3",name:"Hungry",emoji:"😋",photo:null},
      {id:"f4",name:"Tired",emoji:"😴",photo:null},
      {id:"f5",name:"Sick",emoji:"🤒",photo:null},
      {id:"f6",name:"Excited",emoji:"🤩",photo:null},
    ],
  },
  {
    id:"help", label:"I Need Help", emoji:"🙋", photo:null,
    color:"#EF4444", dark:"#B91C1C", light:"#FCA5A5", phrase:"I need help with",
    items:[
      {id:"h1",name:"Getting Dressed",emoji:"👕",photo:null},
      {id:"h2",name:"The Bathroom",emoji:"🚽",photo:null},
      {id:"h3",name:"Opening This",emoji:"🔓",photo:null},
      {id:"h4",name:"Finding Something",emoji:"🔍",photo:null},
    ],
  },
  {
    id:"yesno", label:"Yes / No", emoji:"👍", photo:null,
    color:"#10B981", dark:"#047857", light:"#6EE7B7", phrase:"",
    items:[
      {id:"y1",name:"Yes",emoji:"✅",photo:null},
      {id:"y2",name:"No",emoji:"❌",photo:null},
      {id:"y3",name:"Maybe",emoji:"🤔",photo:null},
      {id:"y4",name:"I Don't Know",emoji:"🤷",photo:null},
      {id:"y5",name:"Please",emoji:"🙏",photo:null},
      {id:"y6",name:"Thank You",emoji:"😊",photo:null},
      {id:"y7",name:"Stop",emoji:"✋",photo:null},
      {id:"y8",name:"More",emoji:"➕",photo:null},
    ],
  },
  {
    id:"watch", label:"I Want to Watch", emoji:"📺", photo:null,
    color:"#6366F1", dark:"#3730A3", light:"#A5B4FC", phrase:"I want to watch",
    items:[
      {
        id:"w1", name:"YouTube", emoji:"▶️", photo:null,
        logo:"https://www.youtube.com/img/desktop/yt_1200.png",
      },
      {
        id:"w2", name:"Disney+", emoji:"✨", photo:null,
        logo:"https://cnbl-cdn.bamgrid.com/assets/7ecc8bcb60ad77193058d63e321bd21cbac2fc67625b0a9de6c88b3155c19c69/original",
      },
    ],
  },
  {
    id:"listen", label:"I Want to Listen", emoji:"🎵", photo:null,
    color:"#EC4899", dark:"#BE185D", light:"#F9A8D4", phrase:"I want to listen to",
    items:[
      {
        id:"l1", name:"Amazon Music", emoji:"🎵", photo:null,
        logo:"https://m.media-amazon.com/images/G/01/digital/music/player/web/GM-image-US-en.png",
        appLink:null,
        webLink:"https://music.amazon.com/library/albums",
      },
    ],
  },
];

// ─── Default body parts ───────────────────────────────────────────────────────
const DEFAULT_BODY_PARTS = [
  { id:"bp_head",      name:"Head",      emoji:"🗣️", symptoms:[{id:"s1",name:"Hurts",emoji:"😣"},{id:"s2",name:"Itches",emoji:"🤚"}] },
  { id:"bp_arm_l",     name:"Left Arm",  emoji:"💪", symptoms:[{id:"s3",name:"Hurts",emoji:"😣"},{id:"s4",name:"Itches",emoji:"🤚"}] },
  { id:"bp_arm_r",     name:"Right Arm", emoji:"💪", symptoms:[{id:"s5",name:"Hurts",emoji:"😣"},{id:"s6",name:"Itches",emoji:"🤚"}] },
  { id:"bp_hand_l",    name:"Left Hand", emoji:"✋", symptoms:[{id:"s7",name:"Hurts",emoji:"😣"},{id:"s8",name:"Itches",emoji:"🤚"}] },
  { id:"bp_hand_r",    name:"Right Hand",emoji:"✋", symptoms:[{id:"s9",name:"Hurts",emoji:"😣"},{id:"s10",name:"Itches",emoji:"🤚"}] },
  { id:"bp_stomach",   name:"Stomach",   emoji:"🫃", symptoms:[{id:"s11",name:"Hurts",emoji:"😣"},{id:"s12",name:"Itches",emoji:"🤚"}] },
  { id:"bp_leg_l",     name:"Left Leg",  emoji:"🦵", symptoms:[{id:"s13",name:"Hurts",emoji:"😣"},{id:"s14",name:"Itches",emoji:"🤚"}] },
  { id:"bp_leg_r",     name:"Right Leg", emoji:"🦵", symptoms:[{id:"s15",name:"Hurts",emoji:"😣"},{id:"s16",name:"Itches",emoji:"🤚"}] },
  { id:"bp_feet_l",    name:"Left Foot", emoji:"🦶", symptoms:[{id:"s17",name:"Hurts",emoji:"😣"},{id:"s18",name:"Itches",emoji:"🤚"}] },
  { id:"bp_feet_r",    name:"Right Foot",emoji:"🦶", symptoms:[{id:"s19",name:"Hurts",emoji:"😣"},{id:"s20",name:"Itches",emoji:"🤚"}] },
];

// Body part positions (legacy — zones now handled per-save)
const BODY_PART_POSITIONS = {
  bp_head:    { x: 50, y: 8  },
  bp_arm_l:   { x: 12, y: 35 },
  bp_arm_r:   { x: 88, y: 35 },
  bp_hand_l:  { x: 10, y: 55 },
  bp_hand_r:  { x: 90, y: 55 },
  bp_stomach: { x: 50, y: 42 },
  bp_leg_l:   { x: 34, y: 68 },
  bp_leg_r:   { x: 66, y: 68 },
  bp_feet_l:  { x: 34, y: 90 },
  bp_feet_r:  { x: 66, y: 90 },
};

// ─── Storage (Firestore + Firebase Storage for photos) ───────────────────────
const SEED_DATA = { categories: SEED_CATEGORIES, parentPin: "1234", bodyParts: DEFAULT_BODY_PARTS };

// School Mode seed data
const SCHOOL_SEED_CATEGORIES = [
  {
    id:"school_need", label:"I Need", emoji:"🤚", photo:null,
    color:"#EF4444", dark:"#B91C1C", light:"#FCA5A5", phrase:"I need",
    items:[
      {id:"sn1",name:"Bathroom",emoji:"🚻",photo:null},
      {id:"sn2",name:"Water",emoji:"💧",photo:null},
      {id:"sn3",name:"Help",emoji:"🆘",photo:null},
      {id:"sn4",name:"Break",emoji:"⏸️",photo:null},
      {id:"sn5",name:"Nurse",emoji:"🏥",photo:null},
    ],
  },
  {
    id:"school_feel", label:"I Feel", emoji:"💛", photo:null,
    color:"#F59E0B", dark:"#C2701A", light:"#FFAA85", phrase:"I feel",
    items:[
      {id:"sf1",name:"Happy",emoji:"😄",photo:null},
      {id:"sf2",name:"Sad",emoji:"😢",photo:null},
      {id:"sf3",name:"Tired",emoji:"😴",photo:null},
      {id:"sf4",name:"Frustrated",emoji:"😤",photo:null},
      {id:"sf5",name:"Sick",emoji:"🤒",photo:null},
    ],
  },
  {
    id:"school_do", label:"I Want to Do", emoji:"⭐", photo:null,
    color:"#A855F7", dark:"#7C3AED", light:"#D8B4FE", phrase:"I want to",
    items:[
      {id:"sd1",name:"Read",emoji:"📖",photo:null},
      {id:"sd2",name:"Draw",emoji:"🎨",photo:null},
      {id:"sd3",name:"Play",emoji:"🧩",photo:null},
      {id:"sd4",name:"Recess",emoji:"🏃",photo:null},
      {id:"sd5",name:"Computer",emoji:"💻",photo:null},
    ],
  },
  {
    id:"school_yesno", label:"Yes/No", emoji:"✅", photo:null,
    color:"#10B981", dark:"#047857", light:"#6EE7B7", phrase:"",
    items:[
      {id:"sy1",name:"Yes",emoji:"✅",photo:null},
      {id:"sy2",name:"No",emoji:"❌",photo:null},
      {id:"sy3",name:"Maybe",emoji:"🤷",photo:null},
    ],
  },
];

const SCHOOL_SEED_DATA = { categories: SCHOOL_SEED_CATEGORIES, parentPin: "1234" };

// ─── School Mode helpers ──────────────────────────────────────────────────────
const SCHOOL_MODE_KEY = "myvoice_school_mode";
function getSchoolMode() {
  try { return localStorage.getItem(SCHOOL_MODE_KEY) === "true"; } catch { return false; }
}
function setSchoolModeLocal(val) {
  try { localStorage.setItem(SCHOOL_MODE_KEY, val ? "true" : "false"); } catch {}
}

function stripPhotos(categories) {
  return categories.map(cat => ({
    ...cat,
    photo: cat.photo?.startsWith("http") ? cat.photo : null,
    items: cat.items?.map(item => ({
      ...item,
      photo: item.photo?.startsWith("http") ? item.photo : null,
    })) || [],
  }));
}

function saveData(d) {
  const stripped = { ...d, categories: stripPhotos(d.categories) };
  saveToFirestore(stripped);
}

async function handlePhotoUpload(base64Data, path) {
  if (!base64Data || base64Data.startsWith("http")) return base64Data;
  const url = await uploadPhoto(base64Data, path);
  return url;
}

// ─── Speech (prefers male voice) ──────────────────────────────────────────────
function speak(text) {
  if (!text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 0.9;
  u.volume = 1;

  function pickVoiceAndSpeak() {
    const voices = window.speechSynthesis.getVoices();
    const maleNames = ["Alex","Fred","Daniel","Aaron","Arthur","Gordon","Reed","Thomas","Rishi","Microsoft David","Microsoft Mark","Google US English"];
    let chosen = null;
    for (const name of maleNames) {
      const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) { chosen = match; break; }
    }
    if (!chosen) {
      chosen = voices.find(v => v.lang.startsWith("en")) || null;
      u.pitch = 0.75;
    }
    if (chosen) u.voice = chosen;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = 2.0;
        gain.connect(ctx.destination);
      }
    } catch(e) {}
    window.speechSynthesis.speak(u);
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    pickVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      pickVoiceAndSpeak();
    };
  }
}

// ─── Smooth Blob SVG Paths ────────────────────────────────────────────────────
const BLOB_PATHS = [
  "M50,5 C70,2 90,15 95,35 C100,55 88,75 75,85 C62,95 40,98 25,88 C10,78 2,58 5,38 C8,18 30,8 50,5 Z",
  "M50,3 C72,0 93,12 97,33 C101,54 85,78 68,88 C51,98 28,96 14,82 C0,68 -2,45 8,28 C18,11 28,6 50,3 Z",
  "M48,4 C68,0 92,10 98,32 C104,54 90,76 72,87 C54,98 30,99 16,85 C2,71 0,48 8,30 C16,12 28,8 48,4 Z",
  "M52,4 C74,1 95,14 98,36 C101,58 87,80 70,89 C53,98 29,97 15,83 C1,69 2,46 10,28 C18,10 30,7 52,4 Z",
  "M50,6 C71,2 91,16 96,37 C101,58 87,77 71,87 C55,97 32,98 18,86 C4,74 1,52 7,33 C13,14 29,10 50,6 Z",
  "M49,3 C70,-1 94,11 98,34 C102,57 87,79 69,89 C51,99 26,98 13,84 C0,70 0,46 9,29 C18,12 28,7 49,3 Z",
];

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    id:i, color:["#FF6B35","#4ECDC4","#A855F7","#F59E0B","#10B981","#EF4444","#fff"][i%7],
    x:Math.random()*100, delay:Math.random()*0.5, size:7+Math.random()*11,
  }));
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:200,overflow:"hidden" }}>
      {pieces.map(p=>(
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:"-20px",
          width:p.size, height:p.size, borderRadius:"50%",
          background:p.color, opacity:0.9,
          animation:`fall 1.4s ${p.delay}s ease-in forwards`,
        }} />
      ))}
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:0;}}`}</style>
    </div>
  );
}

// ─── Blob Card ────────────────────────────────────────────────────────────────
function BlobCard({ item, phrase, color, dark, light, index, onSpeak, onEdit, onDelete, parentMode, onOpenMenu, onManageMenu, onManageCustomMenu, onSchedule }) {
  const [squish, setSquish] = useState(false);
  const blobPath = BLOB_PATHS[index % BLOB_PATHS.length];
  const uid = `bc_${item.id}`;
  const hasMenu = item.subMenu?.food?.length > 0;
  const hasCustomMenu = item.customMenu?.items?.length > 0;

  const DEEP_LINKS = {
    "youtube":      { app: "youtube://www.youtube.com", web: "https://www.youtube.com" },
    "disney+":      { app: "disneyplus://www.disneyplus.com", web: "https://www.disneyplus.com" },
    "amazon music": { app: "intent://#Intent;package=com.amazon.mp3;S.browser_fallback_url=https://music.amazon.com;end", web: "https://music.amazon.com" },
    "netflix":      { app: "nflx://www.netflix.com", web: "https://www.netflix.com" },
    "hulu":         { app: "hulu://www.hulu.com", web: "https://www.hulu.com" },
    "spotify":      { app: "spotify://open.spotify.com", web: "https://open.spotify.com" },
    "youtube kids": { app: "youtubekids://www.youtubekids.com", web: "https://www.youtubekids.com" },
  };

  function handlePress() {
    if (parentMode) return;
    setSquish(true);
    setTimeout(() => setSquish(false), 300);
    if (hasCustomMenu) { onOpenMenu(item, "custom"); return; }
    if (hasMenu) { onOpenMenu(item, "food"); return; }
    let phraseToUse = phrase;
    if (item.itemType === "drink") phraseToUse = "I want to drink";
    else if (item.itemType === "food") phraseToUse = "I want to eat";
    const full = phraseToUse ? `${phraseToUse} ${item.name}` : item.name;
    speak(full);
    const nameKey = item.name.toLowerCase().trim();
    const deepLink = item.appLink ? { app: item.appLink, web: item.webLink || item.appLink } : DEEP_LINKS[nameKey];
    onSpeak(full, !!deepLink);
    if (deepLink) {
      let url = deepLink.app;
      if (url && url.startsWith("music://albums/")) {
        const asin = url.replace("music://albums/", "").split("?")[0].toUpperCase();
        url = `https://music.amazon.com/albums/${asin}`;
      }
      window.location.href = url;
      setTimeout(() => { window.location.href = "/"; }, 100);
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      <button onClick={handlePress} style={{
        background:"none", border:"none", cursor: parentMode ? "default" : "pointer", padding:0,
        display:"flex", flexDirection:"column", alignItems:"center",
        transform: squish ? "scale(1.08) scaleY(0.88)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        filter: squish ? `drop-shadow(0 0 12px ${color}88)` : `drop-shadow(0 5px 10px ${dark}55)`,
        width:"100%",
      }}>
        <svg viewBox="0 0 100 100" style={{ width:150, height:150, display:"block", overflow:"visible" }}>
          <defs>
            <radialGradient id={`${uid}_g`} cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor={light} />
              <stop offset="50%" stopColor={color} />
              <stop offset="100%" stopColor={dark} />
            </radialGradient>
            <clipPath id={`${uid}_c`}><path d={blobPath} /></clipPath>
          </defs>
          <path d={blobPath} fill={`url(#${uid}_g)`} />
          {item.logo && !item.photo && <path d={blobPath} fill="white" opacity="0.92" />}
          {item.photo && <image href={item.photo} x="8" y="8" width="84" height="84" clipPath={`url(#${uid}_c)`} preserveAspectRatio="xMidYMid slice" opacity="0.9" />}
          {item.logo && !item.photo && <image href={item.logo} x="12" y="12" width="76" height="76" clipPath={`url(#${uid}_c)`} preserveAspectRatio="xMidYMid meet" />}
          {!item.photo && !item.logo && <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="38" style={{ userSelect:"none", pointerEvents:"none" }}>{item.emoji}</text>}
          <ellipse cx="36" cy="26" rx="14" ry="9" fill="white" opacity="0.28" transform="rotate(-20,36,26)" />
          <ellipse cx="30" cy="22" rx="6" ry="3.5" fill="white" opacity="0.38" transform="rotate(-20,30,22)" />
        </svg>
      </button>
      <span style={{ fontSize:13, fontWeight:800, color:"#1e1e1e", fontFamily:"'Nunito',sans-serif", textAlign:"center", lineHeight:1.2, maxWidth:150, display:"block", marginTop:4 }}>{item.name}</span>
      {item.appLink && !parentMode && <span style={{ fontSize:10, fontWeight:700, color:color, fontFamily:"'Nunito',sans-serif", marginTop:2, background:light, borderRadius:8, padding:"2px 8px" }}>Opens App ↗</span>}
      {hasCustomMenu && !parentMode && <span style={{ fontSize:10, fontWeight:700, color:color, fontFamily:"'Nunito',sans-serif", marginTop:2, background:light, borderRadius:8, padding:"2px 8px" }}>📋 {item.customMenu.connector}</span>}
      {hasMenu && !parentMode && <span style={{ fontSize:10, fontWeight:700, color:color, fontFamily:"'Nunito',sans-serif", marginTop:2, background:light, borderRadius:8, padding:"2px 8px" }}>🍽️ Menu</span>}
      {parentMode && (
        <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap", justifyContent:"center" }}>
          {!isAvailable(item) && <span style={{ fontSize:10, background:"#FEF3C7", color:"#92400E", borderRadius:6, padding:"2px 6px", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>{item.disabled ? "🚫 Off" : item.timeStart ? "⏰ Time" : "📅 Season"}</span>}
          <button onClick={()=>onEdit(item)} style={{ background:color,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
          <button onClick={()=>onSchedule(item)} style={{ background:"#F59E0B",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>⏰</button>
          <button onClick={()=>onManageMenu(item)} style={{ background:"#10B981",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>🍽️</button>
          <button onClick={()=>onManageCustomMenu(item)} style={{ background:"#6366F1",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>📋</button>
          <button onClick={()=>onDelete(item.id)} style={{ background:"#EF4444",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
        </div>
      )}
    </div>
  );
}

// ─── Camera Blob Card ─────────────────────────────────────────────────────────
function CameraBlobCard({ color, dark, light, onPress, index }) {
  const [squish, setSquish] = useState(false);
  const blobPath = BLOB_PATHS[(index + 2) % BLOB_PATHS.length];
  function handlePress() { setSquish(true); setTimeout(() => setSquish(false), 300); onPress(); }
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <button onClick={handlePress} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center", transform: squish ? "scale(1.08) scaleY(0.88)" : "scale(1)", transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 4px 8px ${dark}44)`, width:"100%", opacity:0.82 }}>
        <svg viewBox="0 0 100 100" style={{ width:150, height:150, display:"block", overflow:"visible" }}>
          <defs>
            <radialGradient id="cam_g" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor={light} stopOpacity="0.45" />
              <stop offset="55%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={dark} stopOpacity="0.45" />
            </radialGradient>
          </defs>
          <path d={BLOB_PATHS[(index + 2) % BLOB_PATHS.length]} fill="url(#cam_g)" stroke={color} strokeWidth="2" strokeDasharray="5,4" />
          <ellipse cx="36" cy="26" rx="12" ry="8" fill="white" opacity="0.2" transform="rotate(-20,36,26)" />
          <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fontSize="28" style={{ userSelect:"none" }}>📷</text>
          <text x="50" y="72" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="800" fontFamily="'Nunito',sans-serif" fill={dark} style={{ userSelect:"none" }}>Add Photo</text>
        </svg>
      </button>
      <span style={{ fontSize:13, fontWeight:800, color:color, fontFamily:"'Nunito',sans-serif", textAlign:"center", marginTop:4 }}>Take Photo</span>
    </div>
  );
}

// ─── Home Blob Card ───────────────────────────────────────────────────────────
function HomeBlobCard({ cat, onClick, parentMode, index }) {
  const [squish, setSquish] = useState(false);
  const blobPath = BLOB_PATHS[index % BLOB_PATHS.length];
  const uid = `hbc_${cat.id}`;
  function handleClick() { setSquish(true); setTimeout(() => setSquish(false), 300); onClick(); }
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      <button onClick={handleClick} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center", transform: squish ? "scale(1.09) scaleY(0.87)" : "scale(1)", transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)", filter: squish ? `drop-shadow(0 0 16px ${cat.color}99)` : `drop-shadow(0 6px 12px ${cat.dark}77)`, width:"100%" }}>
        <svg viewBox="0 0 100 100" style={{ width:"100%", maxWidth:180, height:"auto", display:"block", overflow:"visible" }}>
          <defs>
            <radialGradient id={`${uid}_g`} cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor={cat.light} />
              <stop offset="48%" stopColor={cat.color} />
              <stop offset="100%" stopColor={cat.dark} />
            </radialGradient>
            <clipPath id={`${uid}_c`}><path d={blobPath} /></clipPath>
          </defs>
          <path d={blobPath} fill={`url(#${uid}_g)`} />
          {cat.photo ? (
            <image href={cat.photo} x="8" y="8" width="84" height="84" clipPath={`url(#${uid}_c)`} preserveAspectRatio="xMidYMid slice" opacity="0.88" />
          ) : (
            <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="40" style={{ userSelect:"none" }}>{cat.emoji}</text>
          )}
          <ellipse cx="36" cy="26" rx="15" ry="10" fill="white" opacity="0.3" transform="rotate(-20,36,26)" />
          <ellipse cx="30" cy="21" rx="7" ry="4" fill="white" opacity="0.4" transform="rotate(-20,30,21)" />
          {parentMode && <path d={blobPath} fill="none" stroke="#667eea" strokeWidth="3" strokeDasharray="8,6" />}
        </svg>
      </button>
      <span style={{ fontSize:15, fontWeight:800, color:"#1a1a2e", fontFamily:"'Nunito',sans-serif", textAlign:"center", lineHeight:1.2, maxWidth:160, marginTop:6 }}>{cat.label}</span>
      <span style={{ fontSize:11, color:"#aaa", fontFamily:"'Nunito',sans-serif", marginTop:2 }}>{cat.items.length} items</span>
      {parentMode && !isAvailable(cat) && (
        <span style={{ fontSize:10, background:"#FEF3C7", color:"#92400E", borderRadius:6, padding:"2px 8px", fontFamily:"'Nunito',sans-serif", fontWeight:700, marginTop:2 }}>
          {cat.disabled ? "🚫 Off" : cat.timeStart ? "⏰ Time" : "📅 Season"}
        </span>
      )}
    </div>
  );
}

// ─── Edit Category Modal ──────────────────────────────────────────────────────
function EditCategoryModal({ cat, onSave, onClose }) {
  const [name, setName] = useState(cat.label);
  const [phrase, setPhrase] = useState(cat.phrase);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePhotoSave({ photo }) {
    setSaving(true);
    let photoUrl = null;
    if (photo && photo.startsWith("data:")) {
      photoUrl = await handlePhotoUpload(photo, `categories/${cat.id}/cover_${Date.now()}`);
    } else if (photo && photo.startsWith("http")) {
      photoUrl = photo;
    }
    onSave({ ...cat, label: name.trim(), phrase: phrase.trim(), photo: photoUrl });
    setSaving(false);
    setShowPhotoPicker(false);
    onClose();
  }

  function handleSaveNameOnly() {
    if (!name.trim()) return;
    onSave({ ...cat, label: name.trim(), phrase: phrase.trim() });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:150,background:"rgba(0,0,0,0.62)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      {showPhotoPicker ? (
        <PhotoPickerModal title={saving ? "Saving..." : "Change Category Image"} color={cat.color} onSave={handlePhotoSave} onClose={()=>setShowPhotoPicker(false)} showNameField={false} />
      ) : (
        <div style={{ background:"#fff",borderRadius:24,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ background:cat.color,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"24px 24px 0 0" }}>
            <span style={{ color:"#fff",fontSize:18,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>Edit Category</span>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.3)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ padding:20 }}>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:6 }}>Button Label</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. I Want to Eat" style={{ width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:14 }} />
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:6 }}>Spoken Phrase</div>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:11,color:"#aaa",marginBottom:6 }}>What it says before the item name</div>
            <input value={phrase} onChange={e=>setPhrase(e.target.value)} placeholder="e.g. I want to eat" style={{ width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:16 }} />
            <button onClick={()=>setShowPhotoPicker(true)} style={{ width:"100%",padding:12,borderRadius:14,border:`2px solid ${cat.color}`,background:"transparent",color:cat.color,fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginBottom:12 }}>📷 Change Image</button>
            <button onClick={handleSaveNameOnly} disabled={!name.trim()} style={{ width:"100%",padding:14,borderRadius:14,border:"none",background:name.trim()?cat.color:"#ccc",color:"#fff",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:name.trim()?"pointer":"not-allowed" }}>✅ Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Camera Hook ──────────────────────────────────────────────────────────────
function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(false);
  const start = useCallback(async () => {
    setError(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch { setError(true); }
  }, []);
  const stop = useCallback(() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; }, []);
  const capture = useCallback(() => {
    const v=videoRef.current, c=canvasRef.current;
    if (!v||!c) return null;
    c.width=v.videoWidth; c.height=v.videoHeight;
    c.getContext("2d").drawImage(v,0,0);
    return c.toDataURL("image/jpeg",0.82);
  }, []);
  return { videoRef, canvasRef, error, start, stop, capture };
}

// ─── Photo Picker Modal ───────────────────────────────────────────────────────
const EMOJIS = ["🍕","🍔","🌮","🍦","🍎","🧃","🏠","🌳","🚗","🛒","🏫","🏖️","📺","🎮","⚽","📚","🎨","🎵","😊","😢","😋","😴","🤒","🤩","🐶","🐱","🌈","⭐","❤️","🎉","🌟","✅","❌","🙏","✋","➕","🤷","🤔","🔑","🧸","🎁","🍗","🧀","🥪","🥦","🍟","🧁","🍩","🥤","☀️","🌙","⚡","🔥","💧","🌊"];

function PhotoPickerModal({ title, color, onSave, onClose, showNameField=true, initialName="", nameOptional=false, showLinkField=false, initialLink="", showTypeField=false, initialType="" }) {
  const cam = useCamera();
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState("⭐");
  const [tab, setTab] = useState("camera");
  const [appLink, setAppLink] = useState(initialLink);
  const [itemType, setItemType] = useState(initialType || "");

  useEffect(() => {
    if (tab==="camera" && !photo) cam.start();
    else cam.stop();
    return () => cam.stop();
  }, [tab, photo]);

  function handleCapture() { const d = cam.capture(); if (d) { setPhoto(d); cam.stop(); } }
  function handleFile(e) {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{ setPhoto(ev.target.result); cam.stop(); };
    r.onerror=()=>console.error("FileReader error");
    r.readAsDataURL(f);
  }
  function handleSave() {
    if (showNameField && !nameOptional && !name.trim()) return;
    const photoToSave = tab === "emoji" ? null : photo;
    onSave({ name:name.trim(), emoji, photo:photoToSave, appLink:appLink.trim(), itemType });
  }
  const canSave = (showNameField && !nameOptional) ? !!name.trim() : true;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:150,background:"rgba(0,0,0,0.62)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:24,width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background:color,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"24px 24px 0 0" }}>
          <span style={{ color:"#fff",fontSize:18,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>{title}</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.3)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ display:"flex",gap:8,marginBottom:16 }}>
            {[["camera","📷 Photo"],["emoji","😊 Emoji"]].map(([t,l])=>(
              <button key={t} onClick={()=>{ setTab(t); setPhoto(null); }} style={{ flex:1,padding:"10px 0",borderRadius:12,border:"none",fontWeight:700,fontFamily:"'Nunito',sans-serif",fontSize:14,cursor:"pointer",background:tab===t?color:"#f0f0f0",color:tab===t?"#fff":"#666" }}>{l}</button>
            ))}
          </div>
          {tab==="camera" && (
            <div style={{ marginBottom:16 }}>
              {!photo ? (
                cam.error ? (
                  <div style={{ textAlign:"center",padding:20 }}>
                    <p style={{ color:"#888",marginBottom:12,fontFamily:"'Nunito',sans-serif" }}>Camera not available — upload a photo instead</p>
                    <label style={{ display:"inline-block",padding:"10px 20px",borderRadius:12,background:color,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}>
                      Upload a Photo<input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
                    </label>
                  </div>
                ) : (
                  <div style={{ position:"relative",borderRadius:16,overflow:"hidden",background:"#000",minHeight:200 }}>
                    <video ref={cam.videoRef} autoPlay playsInline style={{ width:"100%",display:"block",borderRadius:16 }} />
                    <button onClick={handleCapture} style={{ position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",width:64,height:64,borderRadius:"50%",border:"4px solid #fff",background:"#fff",cursor:"pointer",fontSize:28,boxShadow:"0 4px 16px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>📷</button>
                    <label style={{ position:"absolute",bottom:20,right:14,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700 }}>
                      Upload<input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
                    </label>
                  </div>
                )
              ) : (
                <div style={{ position:"relative" }}>
                  <img src={photo} alt="captured" style={{ width:"100%",borderRadius:16,display:"block",maxHeight:260,objectFit:"cover" }} />
                  <button onClick={()=>{ setPhoto(null); cam.start(); }} style={{ position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13 }}>Retake</button>
                </div>
              )}
              <canvas ref={cam.canvasRef} style={{ display:"none" }} />
            </div>
          )}
          {tab==="emoji" && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,maxHeight:200,overflowY:"auto",padding:8,background:"#f8f8f8",borderRadius:16 }}>
                {EMOJIS.map(e=>(
                  <button key={e} onClick={()=>setEmoji(e)} style={{ fontSize:24,border:"none",borderRadius:8,background:emoji===e?color+"33":"transparent",cursor:"pointer",padding:4,outline:emoji===e?`2px solid ${color}`:"none" }}>{e}</button>
                ))}
              </div>
              <div style={{ textAlign:"center",marginTop:12,fontSize:56 }}>{emoji}</div>
            </div>
          )}
          {showNameField && (
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={nameOptional ? "Optional: name this" : "Name this item (e.g. McDonald's)"} style={{ width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:14 }} />
          )}
          {showTypeField && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:8 }}>Is this a food or drink?</div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setItemType("food")} style={{ flex:1,padding:"12px 0",borderRadius:14,border:`2px solid ${itemType==="food"?color:"#e0e0e0"}`,background:itemType==="food"?color:"#fff",color:itemType==="food"?"#fff":"#666",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:15,cursor:"pointer" }}>🍔 Food</button>
                <button onClick={()=>setItemType("drink")} style={{ flex:1,padding:"12px 0",borderRadius:14,border:`2px solid ${itemType==="drink"?color:"#e0e0e0"}`,background:itemType==="drink"?color:"#fff",color:itemType==="drink"?"#fff":"#666",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:15,cursor:"pointer" }}>🥤 Drink</button>
              </div>
            </div>
          )}
          {showLinkField && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:6 }}>🔗 App Link (optional)</div>
              <input value={appLink} onChange={e=>setAppLink(e.target.value)} placeholder="e.g. music://albums/B097XPVXCW" style={{ width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box" }} />
            </div>
          )}
          <button onClick={handleSave} disabled={!canSave} style={{ width:"100%",padding:14,borderRadius:14,border:"none",background:canSave?color:"#ccc",color:"#fff",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:canSave?"pointer":"not-allowed" }}>✅ Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ title, onSuccess, onClose, correctPin }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  function handleDigit(d) {
    const next = pin + d;
    if (next.length < 4) { setPin(next); return; }
    setPin(next);
    setTimeout(() => {
      if (next === correctPin) onSuccess();
      else { setShake(true); setPin(""); setTimeout(()=>setShake(false),500); }
    }, 100);
  }
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:24,padding:32,width:"100%",maxWidth:320,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize:36,marginBottom:8 }}>🔐</div>
        <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:18,fontWeight:800,color:"#1a1a2e",marginBottom:6 }}>{title}</div>
        <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:13,color:"#888",marginBottom:24 }}>Enter 4-digit PIN</div>
        <div style={{ display:"flex",justifyContent:"center",gap:12,marginBottom:28,animation:shake?"shake 0.4s ease":"none" }}>
          {[0,1,2,3].map(i=>(<div key={i} style={{ width:16,height:16,borderRadius:"50%",background:pin.length>i?"#667eea":"#e0e0e0",transition:"background 0.1s" }} />))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} onClick={()=>d==="⌫"?setPin(p=>p.slice(0,-1)):d!==""?handleDigit(String(d)):null} disabled={d===""} style={{ padding:"16px 0",borderRadius:14,border:"none",fontSize:20,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:d===""?"default":"pointer",background:d===""?"transparent":d==="⌫"?"#f0f0f0":"#f5f5f5",color:"#1a1a2e" }}>{d}</button>
          ))}
        </div>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"#aaa",fontFamily:"'Nunito',sans-serif",fontSize:14,cursor:"pointer" }}>Cancel</button>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
      </div>
    </div>
  );
}

// ─── Availability checker ─────────────────────────────────────────────────────
function isAvailable(item) {
  if (!item) return true;
  if (item.disabled) return false;
  const now = new Date();
  const month = now.getMonth() + 1;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMins = hours * 60 + minutes;
  if (item.timeStart !== undefined && item.timeEnd !== undefined) {
    const [sh, sm] = item.timeStart.split(":").map(Number);
    const [eh, em] = item.timeEnd.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (startMins <= endMins) { if (currentMins < startMins || currentMins > endMins) return false; }
    else { if (currentMins < startMins && currentMins > endMins) return false; }
  }
  if (item.monthStart !== undefined && item.monthEnd !== undefined) {
    const s = item.monthStart, e = item.monthEnd;
    if (s <= e) { if (month < s || month > e) return false; }
    else { if (month < s && month > e) return false; }
  }
  return true;
}

// ─── Body Silhouette SVG paths (reusable) ────────────────────────────────────
function BodySilhouette({ opacity = 1, strokeOnly = false }) {
  const fill = strokeOnly ? "none" : "#c8d8f0";
  const stroke = "#3B82F6";
  return (
    <>
      <ellipse cx="100" cy="42" rx="30" ry="36" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="88" y="74" width="24" height="18" rx="6" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="60" y="90" width="80" height="110" rx="16" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="28" y="95" width="32" height="90" rx="14" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <ellipse cx="44" cy="196" rx="14" ry="16" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="140" y="95" width="32" height="90" rx="14" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <ellipse cx="156" cy="196" rx="14" ry="16" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="63" y="198" width="34" height="140" rx="14" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <rect x="103" y="198" width="34" height="140" rx="14" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <ellipse cx="80" cy="348" rx="20" ry="12" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      <ellipse cx="120" cy="348" rx="20" ry="12" fill={fill} stroke={stroke} strokeWidth={strokeOnly?3:2} opacity={opacity} />
      {!strokeOnly && <>
        <ellipse cx="88" cy="38" rx="4" ry="5" fill="#93C5FD" />
        <ellipse cx="112" cy="38" rx="4" ry="5" fill="#93C5FD" />
        <path d="M88 54 Q100 62 112 54" stroke="#93C5FD" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>}
    </>
  );
}

// ─── Body Zone Setup Tool ─────────────────────────────────────────────────────
// Steps through each body part and lets you draw/move/resize a box over Logan's photo

function BodyZoneSetup({ photo, bodyParts, existingZones, onSave, onClose }) {
  const COLOR = "#3B82F6";
  const [step, setStep] = useState(0); // index into bodyParts
  // zones: { [bp.id]: { x, y, w, h } } all as % of container
  const [zones, setZones] = useState(existingZones || {});
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { mode: 'move'|'resize', startX, startY, startZone }

  const currentPart = bodyParts[step];

  // Default box for each part if not yet set — sensible starting positions as %
  const DEFAULTS = {
    bp_head:    { x:35, y:2,  w:30, h:18 },
    bp_arm_l:   { x:2,  y:25, w:20, h:28 },
    bp_arm_r:   { x:78, y:25, w:20, h:28 },
    bp_hand_l:  { x:2,  y:52, w:16, h:14 },
    bp_hand_r:  { x:82, y:52, w:16, h:14 },
    bp_stomach: { x:28, y:35, w:44, h:22 },
    bp_leg_l:   { x:22, y:57, w:24, h:30 },
    bp_leg_r:   { x:54, y:57, w:24, h:30 },
    bp_feet_l:  { x:20, y:86, w:22, h:12 },
    bp_feet_r:  { x:58, y:86, w:22, h:12 },
  };

  // Get current zone or default
  const currentZone = zones[currentPart?.id] || DEFAULTS[currentPart?.id] || { x:30, y:30, w:40, h:20 };

  function getRelativePos(clientX, clientY) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { px:0, py:0 };
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  function onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const { px, py } = getRelativePos(touch.clientX, touch.clientY);
    const z = currentZone;
    // Check if near resize handle (bottom-right corner ±8%)
    const nearRight = Math.abs(px - (z.x + z.w)) < 10;
    const nearBottom = Math.abs(py - (z.y + z.h)) < 10;
    const mode = (nearRight && nearBottom) ? "resize" : "move";
    dragRef.current = { mode, startPx: px, startPy: py, startZone: { ...z } };
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const { px, py } = getRelativePos(touch.clientX, touch.clientY);
    const { mode, startPx, startPy, startZone } = dragRef.current;
    const dx = px - startPx;
    const dy = py - startPy;
    if (mode === "move") {
      setZones(z => ({
        ...z,
        [currentPart.id]: {
          ...startZone,
          x: Math.max(0, Math.min(100 - startZone.w, startZone.x + dx)),
          y: Math.max(0, Math.min(100 - startZone.h, startZone.y + dy)),
        }
      }));
    } else {
      setZones(z => ({
        ...z,
        [currentPart.id]: {
          ...startZone,
          w: Math.max(10, Math.min(100 - startZone.x, startZone.w + dx)),
          h: Math.max(8,  Math.min(100 - startZone.y, startZone.h + dy)),
        }
      }));
    }
  }

  function onTouchEnd() { dragRef.current = null; }

  // Same for mouse
  function onMouseDown(e) {
    const { px, py } = getRelativePos(e.clientX, e.clientY);
    const z = currentZone;
    const nearRight = Math.abs(px - (z.x + z.w)) < 6;
    const nearBottom = Math.abs(py - (z.y + z.h)) < 6;
    const mode = (nearRight && nearBottom) ? "resize" : "move";
    dragRef.current = { mode, startPx: px, startPy: py, startZone: { ...z } };
  }
  function onMouseMove(e) {
    if (!dragRef.current) return;
    const { px, py } = getRelativePos(e.clientX, e.clientY);
    const { mode, startPx, startPy, startZone } = dragRef.current;
    const dx = px - startPx, dy = py - startPy;
    if (mode === "move") {
      setZones(z => ({ ...z, [currentPart.id]: { ...startZone, x: Math.max(0, Math.min(100 - startZone.w, startZone.x + dx)), y: Math.max(0, Math.min(100 - startZone.h, startZone.y + dy)) } }));
    } else {
      setZones(z => ({ ...z, [currentPart.id]: { ...startZone, w: Math.max(10, Math.min(100 - startZone.x, startZone.w + dx)), h: Math.max(8, Math.min(100 - startZone.y, startZone.h + dy)) } }));
    }
  }
  function onMouseUp() { dragRef.current = null; }

  function handleNext() {
    // Make sure current zone is saved (use default if untouched)
    if (!zones[currentPart.id]) {
      setZones(z => ({ ...z, [currentPart.id]: DEFAULTS[currentPart.id] }));
    }
    if (step < bodyParts.length - 1) {
      setStep(s => s + 1);
    } else {
      // All done — save
      const finalZones = { ...zones };
      bodyParts.forEach(bp => { if (!finalZones[bp.id]) finalZones[bp.id] = DEFAULTS[bp.id]; });
      onSave(finalZones);
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
    else onClose();
  }

  if (!currentPart) return null;

  const isLast = step === bodyParts.length - 1;
  const z = currentZone;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:COLOR, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={handleBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:40,height:40,cursor:"pointer",fontSize:20,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ color:"#fff", fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>
            {currentPart.emoji} Draw box around {currentPart.name}
          </div>
          <div style={{ color:"rgba(255,255,255,0.75)", fontSize:12, fontFamily:"'Nunito',sans-serif" }}>
            {step + 1} of {bodyParts.length}
          </div>
        </div>
        <button onClick={handleNext} style={{ background:"#10B981",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
          {isLast ? "✅ Done" : "Next →"}
        </button>
      </div>

      {/* Instruction bar */}
      <div style={{ background:"rgba(59,130,246,0.2)", padding:"7px 16px", textAlign:"center", flexShrink:0 }}>
        <span style={{ color:"#93C5FD", fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:700 }}>
          Drag box to move · Drag bottom-right corner to resize
        </span>
      </div>

      {/* Progress dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, padding:"8px 0", flexShrink:0 }}>
        {bodyParts.map((bp, i) => (
          <div key={bp.id} style={{ width:10, height:10, borderRadius:"50%", background: i < step ? "#10B981" : i === step ? "#fff" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>

      {/* Photo + draggable box */}
      <div
        ref={containerRef}
        style={{ flex:1, position:"relative", overflow:"hidden", touchAction:"none", userSelect:"none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Photo — same display as body map: full width, natural height */}
        <img src={photo} alt="Logan" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none" }} />

        {/* Already-placed zones (greyed out) */}
        {bodyParts.slice(0, step).map(bp => {
          const pz = zones[bp.id];
          if (!pz) return null;
          return (
            <div key={bp.id} style={{
              position:"absolute",
              left:`${pz.x}%`, top:`${pz.y}%`,
              width:`${pz.w}%`, height:`${pz.h}%`,
              border:"2px solid rgba(16,185,129,0.6)",
              borderRadius:8,
              background:"rgba(16,185,129,0.1)",
              pointerEvents:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ fontSize:16, opacity:0.8 }}>{bp.emoji}</span>
            </div>
          );
        })}

        {/* Active box for current part */}
        <div style={{
          position:"absolute",
          left:`${z.x}%`, top:`${z.y}%`,
          width:`${z.w}%`, height:`${z.h}%`,
          border:`3px solid ${COLOR}`,
          borderRadius:10,
          background:"rgba(59,130,246,0.18)",
          boxShadow:`0 0 0 2px rgba(59,130,246,0.4)`,
          cursor:"move",
          touchAction:"none",
        }}>
          {/* Label */}
          <div style={{
            position:"absolute", top:-28, left:0, right:0,
            display:"flex", justifyContent:"center",
          }}>
            <span style={{ background:COLOR, color:"#fff", borderRadius:8, padding:"2px 10px", fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
              {currentPart.emoji} {currentPart.name}
            </span>
          </div>

          {/* Resize handle — bottom right */}
          <div style={{
            position:"absolute", bottom:-6, right:-6,
            width:22, height:22, borderRadius:"50%",
            background:COLOR, border:"3px solid #fff",
            cursor:"se-resize",
            boxShadow:"0 2px 8px rgba(0,0,0,0.4)",
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── My Body Screen ───────────────────────────────────────────────────────────
function MyBodyScreen({ bodyParts, bodyPhoto, bodyZones, onBack, onUpdateBodyParts, onUpdateBodyPhoto, onUpdateBodyZones, onResetBodyParts, parentMode, onSpoken, notificationsEnabled }) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [lastSpoken, setLastSpoken] = useState("");
  const [addingSymptom, setAddingSymptom] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const COLOR = "#3B82F6";
  const DARK  = "#1D4ED8";
  const LIGHT = "#93C5FD";

  function handleSpeak(text) {
    setLastSpoken(text);
    speak(text);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1600);
    sendMessage(text);
    if (notificationsEnabled) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }).catch(e => console.error("Notify error:", e));
    }
    if (onSpoken) onSpoken(text);
    setSelectedPart(null);
    setTimeout(() => onBack(), 2000);
  }

  function handleAddSymptom({ name, emoji }) {
    if (!name.trim() || !selectedPart) return;
    const newSymptom = { id:`sym_${Date.now()}`, name: name.trim(), emoji };
    const updated = bodyParts.map(bp =>
      bp.id === selectedPart.id ? { ...bp, symptoms: [...bp.symptoms, newSymptom] } : bp
    );
    onUpdateBodyParts(updated);
    setAddingSymptom(false);
    setSelectedPart(updated.find(bp => bp.id === selectedPart.id));
  }

  function handleDeleteSymptom(symptomId) {
    if (!window.confirm("Remove this symptom?")) return;
    const updated = bodyParts.map(bp =>
      bp.id === selectedPart.id ? { ...bp, symptoms: bp.symptoms.filter(s => s.id !== symptomId) } : bp
    );
    onUpdateBodyParts(updated);
    setSelectedPart(updated.find(bp => bp.id === selectedPart.id));
  }

  // ── Symptom screen ────────────────────────────────────────────────────────
  if (selectedPart) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eff6ff 0%,#fafbff 100%)", display:"flex", flexDirection:"column" }}>
        <Confetti active={confetti} />
        {addingSymptom && (
          <PhotoPickerModal title="Add Symptom" color={COLOR} onSave={handleAddSymptom} onClose={()=>setAddingSymptom(false)} showNameField={true} nameOptional={false} />
        )}
        <div style={{ background:COLOR, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
          <button onClick={()=>setSelectedPart(null)} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
          <span style={{ fontSize:28 }}>{selectedPart.emoji}</span>
          <div style={{ color:"#fff", fontSize:19, fontWeight:800, fontFamily:"'Nunito',sans-serif", flex:1 }}>My {selectedPart.name}</div>
          {parentMode && <button onClick={()=>setAddingSymptom(true)} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>+ Add</button>}
        </div>
        {lastSpoken && <div onClick={()=>speak(lastSpoken)} style={{ background:"#1a1a2e",color:"#fff",padding:"13px 20px",textAlign:"center",fontSize:17,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer" }}>🔊 "{lastSpoken}" — tap to repeat</div>}
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:15, color:"#666", textAlign:"center", padding:"20px 20px 8px" }}>
          What's happening with your {selectedPart.name.toLowerCase()}?
        </div>
        <div style={{ flex:1, padding:"8px 20px 40px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignContent:"start" }}>
          {selectedPart.symptoms.map((sym, i) => {
            const blobPath = BLOB_PATHS[i % BLOB_PATHS.length];
            const uid = `sym_${sym.id}`;
            return (
              <div key={sym.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <button onClick={()=>!parentMode && handleSpeak(`My ${selectedPart.name.toLowerCase()} ${sym.name.toLowerCase()}`)} style={{ background:"none",border:"none",cursor:parentMode?"default":"pointer",padding:0,display:"flex",flexDirection:"column",alignItems:"center",filter:`drop-shadow(0 5px 10px ${DARK}55)`,width:"100%" }}>
                  <svg viewBox="0 0 100 100" style={{ width:140,height:140,display:"block",overflow:"visible" }}>
                    <defs>
                      <radialGradient id={`${uid}_g`} cx="38%" cy="30%" r="65%">
                        <stop offset="0%" stopColor={LIGHT}/><stop offset="50%" stopColor={COLOR}/><stop offset="100%" stopColor={DARK}/>
                      </radialGradient>
                      <clipPath id={`${uid}_c`}><path d={blobPath}/></clipPath>
                    </defs>
                    <path d={blobPath} fill={`url(#${uid}_g)`}/>
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="36" style={{ userSelect:"none" }}>{sym.emoji}</text>
                    <ellipse cx="36" cy="26" rx="14" ry="9" fill="white" opacity="0.28" transform="rotate(-20,36,26)"/>
                  </svg>
                </button>
                <span style={{ fontSize:16, fontWeight:800, color:"#1e1e1e", fontFamily:"'Nunito',sans-serif", textAlign:"center", marginTop:4 }}>{sym.name}</span>
                {parentMode && <button onClick={()=>handleDeleteSymptom(sym.id)} style={{ marginTop:6,background:"#fee2e2",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:12,color:"#EF4444",fontWeight:700,fontFamily:"'Nunito',sans-serif" }}>🗑️ Remove</button>}
              </div>
            );
          })}
          {selectedPart.symptoms.length === 0 && <div style={{ gridColumn:"1/-1",textAlign:"center",padding:40,color:"#aaa",fontFamily:"'Nunito',sans-serif",fontSize:15 }}>No symptoms yet — add some in Edit Mode!</div>}
        </div>
      </div>
    );
  }

  // ── Main body map ─────────────────────────────────────────────────────────
  // Default zone positions if none saved yet
  const DEFAULT_ZONES = {
    bp_head:    { x:35, y:2,  w:30, h:18 },
    bp_arm_l:   { x:2,  y:25, w:20, h:28 },
    bp_arm_r:   { x:78, y:25, w:20, h:28 },
    bp_hand_l:  { x:2,  y:52, w:16, h:14 },
    bp_hand_r:  { x:82, y:52, w:16, h:14 },
    bp_stomach: { x:28, y:35, w:44, h:22 },
    bp_leg_l:   { x:22, y:57, w:24, h:30 },
    bp_leg_r:   { x:54, y:57, w:24, h:30 },
    bp_feet_l:  { x:20, y:86, w:22, h:12 },
    bp_feet_r:  { x:58, y:86, w:22, h:12 },
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eff6ff 0%,#fafbff 100%)", display:"flex", flexDirection:"column" }}>
      <Confetti active={confetti} />

      {/* Zone setup tool */}
      {showSetup && bodyPhoto && (
        <BodyZoneSetup
          photo={bodyPhoto}
          bodyParts={bodyParts}
          existingZones={bodyZones}
          onSave={(zones) => { onUpdateBodyZones(zones); setShowSetup(false); }}
          onClose={()=>setShowSetup(false)}
        />
      )}

      {/* Header */}
      <div style={{ background:COLOR, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff", fontSize:19, fontWeight:800, fontFamily:"'Nunito',sans-serif", flex:1 }}>🫀 My Body</div>
        {parentMode && (
          <div style={{ display:"flex", gap:8 }}>
            <label style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
              📷 {bodyPhoto ? "Change" : "Add Photo"}
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files[0]; if (!f) return;
                const r = new FileReader();
                r.onload = async (ev) => {
                  const url = await handlePhotoUpload(ev.target.result, `body/logan_${Date.now()}`);
                  onUpdateBodyPhoto(url);
                };
                r.readAsDataURL(f);
              }} style={{ display:"none" }} />
            </label>
            {bodyPhoto && (
              <button onClick={()=>setShowSetup(true)} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
                🎯 Set Zones
              </button>
            )}
            <button onClick={()=>{
              if (window.confirm("This will reset body parts to the full 10-part list and clear saved zones. Continue?")) {
                onResetBodyParts();
              }
            }} style={{ background:"rgba(239,68,68,0.7)",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {!bodyPhoto && (
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:15, color:"#555", textAlign:"center", padding:"16px 20px 8px" }}>
          Tap where it bothers you
        </div>
      )}

      {/* Body map — fills remaining screen, same layout as setup tool */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>

        {bodyPhoto ? (
          <>
            {/* Photo fills exactly like setup tool */}
            <img src={bodyPhoto} alt="Logan" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none" }} />

            {/* Tap zones */}
            {bodyParts.map(bp => {
              const z = (bodyZones && bodyZones[bp.id]) ? bodyZones[bp.id] : DEFAULT_ZONES[bp.id];
              if (!z) return null;
              return (
                <button key={bp.id} onClick={()=>setSelectedPart(bp)} style={{
                  position:"absolute",
                  left:`${z.x}%`, top:`${z.y}%`,
                  width:`${z.w}%`, height:`${z.h}%`,
                  background:"rgba(59,130,246,0.6)",
                  border:"2px solid rgba(147,197,253,0.9)",
                  borderRadius:14,
                  cursor:"pointer",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:2,
                  zIndex:10,
                  boxShadow:"0 3px 12px rgba(29,78,216,0.35)",
                }}>
                  <span style={{ fontSize:20 }}>{bp.emoji}</span>
                  <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:12, color:"#fff", textShadow:"0 1px 3px rgba(0,0,0,0.6)" }}>{bp.name}</span>
                </button>
              );
            })}

            {parentMode && !bodyZones && (
              <div style={{ position:"absolute", bottom:20, left:0, right:0, textAlign:"center" }}>
                <span style={{ background:"rgba(59,130,246,0.9)", color:"#fff", borderRadius:12, padding:"10px 18px", fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700 }}>
                  📍 Tap "Set Zones" to position the tap areas
                </span>
              </div>
            )}
          </>
        ) : (
          /* No photo — show silhouette */
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 20px 40px" }}>
            <div style={{ position:"relative", width:"100%", maxWidth:340 }}>
              <svg viewBox="0 0 200 480" style={{ width:"100%", display:"block" }}>
                <BodySilhouette strokeOnly={false} opacity={1} />
              </svg>
              {bodyParts.map(bp => {
                const z = DEFAULT_ZONES[bp.id];
                if (!z) return null;
                return (
                  <button key={bp.id} onClick={()=>setSelectedPart(bp)} style={{
                    position:"absolute",
                    left:`${z.x}%`, top:`${z.y}%`,
                    width:`${z.w}%`, height:`${z.h}%`,
                    background:"rgba(59,130,246,0.75)",
                    border:"2px solid rgba(147,197,253,0.8)",
                    borderRadius:14, cursor:"pointer",
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", gap:2,
                    zIndex:10,
                  }}>
                    <span style={{ fontSize:18 }}>{bp.emoji}</span>
                    <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:11, color:"#fff" }}>{bp.name}</span>
                  </button>
                );
              })}
            </div>
            {parentMode && (
              <div style={{ marginTop:16, fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#999", textAlign:"center" }}>
                Tap "Add Photo" to use Logan's real photo
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Restaurant Order Screen ──────────────────────────────────────────────────
function RestaurantOrderScreen({ item, color, dark, light, onBack, onComplete }) {
  const [step, setStep] = useState("food");
  const [selectedFood, setSelectedFood] = useState(null);
  const foodOptions = item.subMenu?.food || [];
  const drinkOptions = item.subMenu?.drink || [];
  function finish(food, drink) { onComplete(`I want ${item.name} ${food.name}${drink ? ` and ${drink.name}` : ""}`); }
  function handleSelect(opt) {
    if (step === "food") { if (drinkOptions.length > 0) { setSelectedFood(opt); setStep("drink"); } else { finish(opt, null); } }
    else { finish(selectedFood, opt); }
  }
  const options = step === "food" ? foodOptions : drinkOptions;
  const title = step === "food" ? `What from ${item.name}?` : `What drink?`;
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)", display:"flex", flexDirection:"column" }}>
      <div style={{ background:color, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff",fontSize:19,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>{title}</div>
      </div>
      {step === "drink" && selectedFood && <div style={{ padding:"12px 20px 0", fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:14, color:"#999" }}>✅ {selectedFood.name}</div>}
      <div style={{ flex:1, padding:"16px 20px 40px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16, alignContent:"start" }}>
        {options.map((opt, i) => {
          const blobPath = BLOB_PATHS[i % BLOB_PATHS.length];
          const uid = `ro_${opt.id}`;
          return (
            <button key={opt.id} onClick={()=>handleSelect(opt)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center", filter:`drop-shadow(0 5px 10px ${dark}55)` }}>
              <svg viewBox="0 0 100 100" style={{ width:140, height:140, display:"block", overflow:"visible" }}>
                <defs>
                  <radialGradient id={`${uid}_g`} cx="38%" cy="30%" r="65%">
                    <stop offset="0%" stopColor={light} /><stop offset="50%" stopColor={color} /><stop offset="100%" stopColor={dark} />
                  </radialGradient>
                  <clipPath id={`${uid}_c`}><path d={blobPath} /></clipPath>
                </defs>
                <path d={blobPath} fill={`url(#${uid}_g)`} />
                {opt.photo ? <image href={opt.photo} x="8" y="8" width="84" height="84" clipPath={`url(#${uid}_c)`} preserveAspectRatio="xMidYMid slice" opacity="0.9" /> : <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="38">{opt.emoji}</text>}
                <ellipse cx="36" cy="26" rx="14" ry="9" fill="white" opacity="0.28" transform="rotate(-20,36,26)" />
              </svg>
              <span style={{ fontSize:14, fontWeight:800, color:"#1e1e1e", fontFamily:"'Nunito',sans-serif", marginTop:4, textAlign:"center" }}>{opt.name}</span>
            </button>
          );
        })}
        {options.length === 0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:30, color:"#aaa", fontFamily:"'Nunito',sans-serif" }}>No options yet — add some in Edit Mode!</div>}
      </div>
    </div>
  );
}

// ─── Custom Sub-Menu Screen (Logan picks from custom list) ───────────────────
function CustomSubMenuScreen({ item, categoryPhrase, color, dark, light, onBack, onComplete }) {
  const options = item.customMenu?.items || [];
  const connector = item.customMenu?.connector || "and";
  const title = item.customMenu?.title || `${item.name}`;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)", display:"flex", flexDirection:"column" }}>
      <div style={{ background:color, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff", fontSize:19, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>{title}</div>
      </div>
      <div style={{ flex:1, padding:"16px 20px 40px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16, alignContent:"start" }}>
        {options.map((opt, i) => {
          const blobPath = BLOB_PATHS[i % BLOB_PATHS.length];
          const uid = `csm_${opt.id}`;
          return (
            <button key={opt.id} onClick={()=>onComplete(`${categoryPhrase} ${item.name} ${connector} ${opt.name}`)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center", filter:`drop-shadow(0 5px 10px ${dark}55)` }}>
              <svg viewBox="0 0 100 100" style={{ width:140, height:140, display:"block", overflow:"visible" }}>
                <defs>
                  <radialGradient id={`${uid}_g`} cx="38%" cy="30%" r="65%">
                    <stop offset="0%" stopColor={light}/><stop offset="50%" stopColor={color}/><stop offset="100%" stopColor={dark}/>
                  </radialGradient>
                  <clipPath id={`${uid}_c`}><path d={blobPath}/></clipPath>
                </defs>
                <path d={blobPath} fill={`url(#${uid}_g)`}/>
                {opt.photo
                  ? <image href={opt.photo} x="8" y="8" width="84" height="84" clipPath={`url(#${uid}_c)`} preserveAspectRatio="xMidYMid slice" opacity="0.9"/>
                  : <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="38">{opt.emoji}</text>}
                <ellipse cx="36" cy="26" rx="14" ry="9" fill="white" opacity="0.28" transform="rotate(-20,36,26)"/>
              </svg>
              <span style={{ fontSize:14, fontWeight:800, color:"#1e1e1e", fontFamily:"'Nunito',sans-serif", marginTop:4, textAlign:"center" }}>{opt.name}</span>
            </button>
          );
        })}
        {options.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:30, color:"#aaa", fontFamily:"'Nunito',sans-serif" }}>
            No options yet — add some in Edit Mode!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Sub-Menu Edit Screen ──────────────────────────────────────────────
function CustomSubMenuEditScreen({ item, color, onBack, onSave }) {
  const [menuTitle, setMenuTitle] = useState(item.customMenu?.title || `Choose from ${item.name}`);
  const [connector, setConnector] = useState(item.customMenu?.connector || "and");
  const [items, setItems] = useState(item.customMenu?.items || []);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAddSave({ name, emoji, photo }) {
    if (!name.trim()) return;
    setSaving(true);
    let photoUrl = null;
    if (photo && photo.startsWith("data:")) photoUrl = await handlePhotoUpload(photo, `custommenu/${item.id}/${Date.now()}`);
    else if (photo) photoUrl = photo;
    setItems(prev => [...prev, { id:`cm_${Date.now()}`, name:name.trim(), emoji, photo:photoUrl }]);
    setSaving(false);
    setAdding(false);
  }

  function handleDelete(id) { setItems(prev => prev.filter(i => i.id !== id)); }

  function handleDone() {
    onSave({ ...item, customMenu: { title: menuTitle.trim(), connector: connector.trim(), items } });
  }

  // Preview of what the full phrase will sound like
  const previewPhrase = items.length > 0
    ? `"[category phrase] ${item.name} ${connector} ${items[0].name}"`
    : `"[category phrase] ${item.name} ${connector} [selection]"`;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)" }}>
      {adding && (
        <PhotoPickerModal
          title={saving ? "Saving..." : "Add Option"}
          color={color}
          onSave={handleAddSave}
          onClose={()=>!saving && setAdding(false)}
          showNameField={true}
        />
      )}

      {/* Header */}
      <div style={{ background:color, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={handleDone} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff", fontSize:18, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>📋 Sub-Menu: {item.name}</div>
      </div>

      <div style={{ padding:20 }}>
        {/* Menu screen title */}
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13, color:"#666", marginBottom:6 }}>
          Screen Title
        </div>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"#aaa", marginBottom:6 }}>
          What shows at the top when Logan taps this item
        </div>
        <input value={menuTitle} onChange={e=>setMenuTitle(e.target.value)}
          placeholder={`e.g. "Choose from ${item.name}"`}
          style={{ width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:15,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:16 }} />

        {/* Connector word */}
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13, color:"#666", marginBottom:6 }}>
          Connector Word
        </div>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"#aaa", marginBottom:8 }}>
          The word between the item and the selection
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
          {["and watch","and eat","and drink","and play","and see","and do","and get"].map(c => (
            <button key={c} onClick={()=>setConnector(c)} style={{
              padding:"8px 14px", borderRadius:20, border:`2px solid ${connector===c?color:"#e0e0e0"}`,
              background:connector===c?color:"#fff", color:connector===c?"#fff":"#666",
              fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
            }}>{c}</button>
          ))}
        </div>
        <input value={connector} onChange={e=>setConnector(e.target.value)}
          placeholder="or type your own..."
          style={{ width:"100%",padding:"10px 16px",borderRadius:14,border:"2px solid #e0e0e0",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:8 }} />

        {/* Preview */}
        <div style={{ background:"#f0f9ff", borderRadius:12, padding:"10px 14px", marginBottom:20 }}>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:"#666", marginBottom:4, fontWeight:700 }}>PREVIEW</div>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, color:"#1a1a2e", fontWeight:700 }}>{previewPhrase}</div>
        </div>

        {/* Options list */}
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, color:"#1a1a2e", marginBottom:12 }}>
          Options ({items.length})
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
          {items.map(opt => (
            <div key={opt.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:90 }}>
              <div style={{ width:80, height:80, borderRadius:16, overflow:"hidden", background:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 3px 10px rgba(0,0,0,0.1)" }}>
                {opt.photo ? <img src={opt.photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:36 }}>{opt.emoji}</span>}
              </div>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:12, color:"#1a1a2e", marginTop:4, textAlign:"center" }}>{opt.name}</div>
              <button onClick={()=>handleDelete(opt.id)} style={{ marginTop:4, background:"#fee2e2", border:"none", borderRadius:8, padding:"3px 10px", cursor:"pointer", fontSize:11, color:"#EF4444", fontWeight:700 }}>🗑️</button>
            </div>
          ))}
          {/* Add button */}
          <button onClick={()=>setAdding(true)} style={{ width:80, height:80, borderRadius:16, border:`2px dashed ${color}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:color, flexShrink:0 }}>+</button>
        </div>

        <button onClick={handleDone} style={{ width:"100%", padding:14, borderRadius:14, border:"none", background:color, color:"#fff", fontSize:17, fontWeight:800, fontFamily:"'Nunito',sans-serif", cursor:"pointer" }}>✅ Done</button>
      </div>
    </div>
  );
}
function SubMenuEditScreen({ item, color, onBack, onSave }) {
  const [food, setFood] = useState(item.subMenu?.food || []);
  const [drink, setDrink] = useState(item.subMenu?.drink || []);
  const [adding, setAdding] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleAddSave({ name, emoji, photo }) {
    if (!name.trim()) return;
    setSaving(true);
    let photoUrl = null;
    if (photo && photo.startsWith("data:")) photoUrl = await handlePhotoUpload(photo, `submenu/${item.id}/${adding}/${Date.now()}`);
    else if (photo) photoUrl = photo;
    const newOption = { id:`sm_${Date.now()}`, name:name.trim(), emoji, photo:photoUrl };
    if (adding === "food") setFood(f=>[...f, newOption]);
    else setDrink(d=>[...d, newOption]);
    setSaving(false); setAdding(null);
  }

  function handleDelete(type, id) {
    if (type==="food") setFood(food.filter(f=>f.id!==id));
    else setDrink(drink.filter(d=>d.id!==id));
  }

  function handleDone() { onSave({ ...item, subMenu: { food, drink } }); }

  function renderList(list, type) {
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        {list.map(opt => (
          <div key={opt.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:90 }}>
            <div style={{ width:80, height:80, borderRadius:16, overflow:"hidden", background:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {opt.photo ? <img src={opt.photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:36 }}>{opt.emoji}</span>}
            </div>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:12, color:"#1a1a2e", marginTop:4, textAlign:"center" }}>{opt.name}</div>
            <button onClick={()=>handleDelete(type, opt.id)} style={{ marginTop:4, background:"#fee2e2", border:"none", borderRadius:8, padding:"3px 10px", cursor:"pointer", fontSize:11, color:"#EF4444", fontWeight:700 }}>🗑️ Remove</button>
          </div>
        ))}
        <button onClick={()=>setAdding(type)} style={{ width:80, height:80, borderRadius:16, border:`2px dashed ${color}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:color, flexShrink:0 }}>+</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)" }}>
      {adding && <PhotoPickerModal title={saving ? "Saving..." : `Add ${adding==="food"?"Food":"Drink"} Option`} color={color} onSave={handleAddSave} onClose={()=>!saving && setAdding(null)} showNameField={true} />}
      <div style={{ background:color, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={handleDone} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff",fontSize:18,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>🍽️ Menu: {item.name}</div>
      </div>
      <div style={{ padding:20 }}>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, color:"#1a1a2e", marginBottom:8 }}>🍔 Food Options</div>
        {renderList(food, "food")}
        <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, color:"#1a1a2e", marginBottom:8, marginTop:16 }}>🥤 Drink Options (optional)</div>
        {renderList(drink, "drink")}
        <button onClick={handleDone} style={{ width:"100%", padding:14, borderRadius:14, border:"none", background:color, color:"#fff", fontSize:17, fontWeight:800, fontFamily:"'Nunito',sans-serif", cursor:"pointer", marginTop:16 }}>✅ Done</button>
      </div>
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ScheduleModal({ item, color, onSave, onClose }) {
  const [disabled, setDisabled] = useState(item.disabled || false);
  const [useTime, setUseTime] = useState(item.timeStart !== undefined);
  const [timeStart, setTimeStart] = useState(item.timeStart || "08:00");
  const [timeEnd, setTimeEnd] = useState(item.timeEnd || "20:00");
  const [useMonth, setUseMonth] = useState(item.monthStart !== undefined);
  const [monthStart, setMonthStart] = useState(item.monthStart || 5);
  const [monthEnd, setMonthEnd] = useState(item.monthEnd || 9);

  function handleSave() {
    const updated = { ...item, disabled };
    if (useTime) { updated.timeStart = timeStart; updated.timeEnd = timeEnd; }
    else { delete updated.timeStart; delete updated.timeEnd; }
    if (useMonth) { updated.monthStart = monthStart; updated.monthEnd = monthEnd; }
    else { delete updated.monthStart; delete updated.monthEnd; }
    onSave(updated); onClose();
  }

  const available = isAvailable({ disabled, timeStart: useTime?timeStart:undefined, timeEnd: useTime?timeEnd:undefined, monthStart: useMonth?monthStart:undefined, monthEnd: useMonth?monthEnd:undefined });

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.62)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:24,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.35)",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ background:color,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"24px 24px 0 0",position:"sticky",top:0 }}>
          <span style={{ color:"#fff",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>⏰ Availability: {item.name}</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.3)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,color:"#fff" }}>✕</button>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ background:available?"#f0fdf4":"#fef2f2",borderRadius:14,padding:"10px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>{available?"✅":"🚫"}</span>
            <span style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:available?"#15803d":"#dc2626" }}>Currently {available ? "visible to Logan" : "hidden from Logan"}</span>
          </div>
          <div style={{ background:"#f9fafb",borderRadius:14,padding:"14px 16px",marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div><div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:14,color:"#1a1a2e" }}>🚫 Quick Disable</div><div style={{ fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#999",marginTop:2 }}>Hide immediately, re-enable anytime</div></div>
              <button onClick={()=>setDisabled(!disabled)} style={{ width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:disabled?"#EF4444":"#e0e0e0",transition:"background 0.2s",position:"relative" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left 0.2s",left:disabled?26:4 }} />
              </button>
            </div>
          </div>
          <button onClick={handleSave} style={{ width:"100%",padding:14,borderRadius:14,border:"none",background:color,color:"#fff",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer" }}>✅ Save Schedule</button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Screen ──────────────────────────────────────────────────────────
function CategoryScreen({ category, onBack, onUpdateCategory, parentMode, onSpoken, notificationsEnabled=true }) {
  const [items, setItems] = useState(category.items);
  const [search, setSearch] = useState("");
  const [lastSpoken, setLastSpoken] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [manageMenuItem, setManageMenuItem] = useState(null);
  const [customMenuItem, setCustomMenuItem] = useState(null);
  const [scheduleItem, setScheduleItem] = useState(null);

  function handleSaveSubMenu(updatedItem) { persist(items.map(i => i.id===updatedItem.id ? updatedItem : i)); setManageMenuItem(null); }
  function handleSaveCustomMenu(updatedItem) { persist(items.map(i => i.id===updatedItem.id ? updatedItem : i)); setCustomMenuItem(null); }
  function handleOrderComplete(phrase) { setOrderItem(null); handleSpeak(phrase); }
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).filter(i => parentMode || isAvailable(i));

  function persist(updated) { setItems(updated); onUpdateCategory({ ...category, items: updated }); }

  async function handleSaveItem({ name, emoji, photo, appLink, itemType }) {
    const id = `c_${Date.now()}`;
    let photoUrl = null;
    if (photo && photo.startsWith("data:")) photoUrl = await handlePhotoUpload(photo, `items/${category.id}/${id}`);
    else if (photo && photo.startsWith("http")) photoUrl = photo;
    const newItem = { id, name, emoji, photo: photoUrl };
    if (appLink) newItem.appLink = appLink;
    if (itemType) newItem.itemType = itemType;
    persist([...items, newItem]);
  }

  async function handleEditItem({ name, emoji, photo, appLink, itemType }) {
    let photoUrl = photo;
    if (photo && photo.startsWith("data:")) photoUrl = await handlePhotoUpload(photo, `items/${category.id}/${editItem.id}`);
    else if (!photo) photoUrl = editItem.photo;
    const updated = { ...editItem, name, emoji, photo:photoUrl };
    if (appLink !== undefined) updated.appLink = appLink || null;
    if (itemType) updated.itemType = itemType;
    persist(items.map(i => i.id===editItem.id ? updated : i));
    setEditItem(null);
  }

  function handleDelete(id) { if (!window.confirm("Remove this item?")) return; persist(items.filter(i=>i.id!==id)); }

  function handleSpeak(text, isAppItem = false) {
    setLastSpoken(text);
    setConfetti(true);
    setTimeout(()=>setConfetti(false), 1600);
    speak(text);
    sendMessage(text);
    if (notificationsEnabled) {
      fetch("/api/notify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:text }) }).catch(e=>console.error("Notify error:",e));
    }
    if (!isAppItem && onSpoken) onSpoken(text);
    setTimeout(() => onBack(), 2000);
  }

  if (customMenuItem && !parentMode) {
    return <CustomSubMenuScreen item={customMenuItem} categoryPhrase={category.phrase} color={category.color} dark={category.dark} light={category.light} onBack={()=>setCustomMenuItem(null)} onComplete={(phrase)=>{ setCustomMenuItem(null); handleSpeak(phrase); }} />;
  }
  if (orderItem) return <RestaurantOrderScreen item={orderItem} color={category.color} dark={category.dark} light={category.light} onBack={()=>setOrderItem(null)} onComplete={handleOrderComplete} />;
  if (manageMenuItem) return <SubMenuEditScreen item={manageMenuItem} color={category.color} onBack={()=>setManageMenuItem(null)} onSave={handleSaveSubMenu} />;
  if (customMenuItem && parentMode) return <CustomSubMenuEditScreen item={customMenuItem} color={category.color} onBack={()=>setCustomMenuItem(null)} onSave={handleSaveCustomMenu} />;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)", display:"flex", flexDirection:"column" }}>
      <Confetti active={confetti} />
      {showAdd && <PhotoPickerModal title="Add New Item" color={category.color} onSave={d=>{ handleSaveItem(d); setShowAdd(false); }} onClose={()=>setShowAdd(false)} showLinkField={true} showTypeField={category.label?.toLowerCase().includes("food") || category.label?.toLowerCase().includes("drink")} />}
      {scheduleItem && <ScheduleModal item={scheduleItem} color={category.color} onSave={updated=>{ persist(items.map(i=>i.id===updated.id?updated:i)); }} onClose={()=>setScheduleItem(null)} />}
      {editItem && <PhotoPickerModal title={`Edit: ${editItem.name}`} color={category.color} initialName={editItem.name} onSave={handleEditItem} onClose={()=>setEditItem(null)} showLinkField={true} initialLink={editItem.appLink || ""} showTypeField={category.label?.toLowerCase().includes("food") || category.label?.toLowerCase().includes("drink")} initialType={editItem.itemType || "food"} />}
      <div style={{ background:category.color,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ width:44,height:44,borderRadius:12,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          {category.photo ? <img src={category.photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:26 }}>{category.emoji}</span>}
        </div>
        <div style={{ color:"#fff",fontSize:19,fontWeight:800,fontFamily:"'Nunito',sans-serif",flex:1 }}>{category.label}</div>
        {parentMode && <button onClick={()=>setShowAdd(true)} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>+ Add</button>}
      </div>
      {lastSpoken && <div onClick={()=>speak(lastSpoken)} style={{ background:"#1a1a2e",color:"#fff",padding:"13px 20px",textAlign:"center",fontSize:17,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer",letterSpacing:0.3 }}>🔊 "{lastSpoken}" — tap to repeat</div>}
      <div style={{ padding:"14px 20px 6px" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ width:"100%",padding:"12px 16px",borderRadius:18,border:"2px solid #e0e0e0",fontSize:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",background:"#fff",boxSizing:"border-box" }} />
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"6px 20px 40px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16,alignContent:"start" }}>
        {filtered.length===0 && <div style={{ gridColumn:"1/-1",textAlign:"center",padding:30,color:"#aaa",fontFamily:"'Nunito',sans-serif",fontSize:15 }}>{search ? "Nothing found!" : "No items yet!"}</div>}
        {filtered.map((item,i) => (
          <BlobCard key={item.id} item={item} phrase={category.phrase} color={category.color} dark={category.dark} light={category.light} index={i} onSpeak={handleSpeak} onEdit={setEditItem} onDelete={handleDelete} parentMode={parentMode}
            onOpenMenu={(item, type) => { if (type === "custom") setCustomMenuItem(item); else setOrderItem(item); }}
            onManageMenu={setManageMenuItem}
            onManageCustomMenu={(item) => setCustomMenuItem(item)}
            onSchedule={setScheduleItem} />
        ))}
        <CameraBlobCard color={category.color} dark={category.dark} light={category.light} onPress={()=>setShowAdd(true)} index={filtered.length} />
      </div>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ categories, onUpdateCategories, onBack, onChangePin, currentPin, onSave, onExport, onImport }) {
  const [showCatPhoto, setShowCatPhoto] = useState(null);
  const [showEditCat, setShowEditCat] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [scheduleCat, setScheduleCat] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPhrase, setNewCatPhrase] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📌");
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const CAT_COLORS = [
    {color:"#FF6B35",dark:"#C94A1A",light:"#FFAA85"},{color:"#4ECDC4",dark:"#2A9990",light:"#9EEEE8"},
    {color:"#A855F7",dark:"#7B22D4",light:"#D4A0FF"},{color:"#F59E0B",dark:"#B86E00",light:"#FCD34D"},
    {color:"#10B981",dark:"#047857",light:"#6EE7B7"},{color:"#EF4444",dark:"#B91C1C",light:"#FCA5A5"},
    {color:"#3B82F6",dark:"#1D4ED8",light:"#93C5FD"},{color:"#EC4899",dark:"#BE185D",light:"#F9A8D4"},
  ];
  const CAT_EMOJIS = ["📌","🏠","🎯","🌟","💡","🎨","🎵","🏆","🍀","🔔","🎒","🌍","🧠","💪","🛡️","🔑"];
  const [selColor, setSelColor] = useState(CAT_COLORS[0]);

  function handleCatEdit(updatedCat) { onUpdateCategories(categories.map(c => c.id===updatedCat.id ? updatedCat : c)); setShowEditCat(null); }

  async function handleCatPhotoSave({ photo }) {
    setSavingPhoto(true);
    try {
      let photoUrl = null;
      if (photo && photo.startsWith("data:")) photoUrl = await handlePhotoUpload(photo, `categories/${showCatPhoto}/cover_${Date.now()}`);
      else if (photo && photo.startsWith("http")) photoUrl = photo;
      onUpdateCategories(categories.map(c=>c.id===showCatPhoto ? { ...c, photo: photoUrl } : c));
      setShowCatPhoto(null);
    } catch(e) { console.error(e); alert("Photo save failed."); }
    finally { setSavingPhoto(false); }
  }

  function handleDeleteCat(id) { if (!window.confirm("Delete this whole category?")) return; onUpdateCategories(categories.filter(c=>c.id!==id)); }

  function handleAddCat() {
    if (!newCatName.trim()) return;
    onUpdateCategories([...categories,{ id:`cat_${Date.now()}`,label:newCatName.trim(),emoji:newCatEmoji,photo:null,...selColor,phrase:newCatPhrase.trim(),items:[] }]);
    setNewCatName(""); setNewCatPhrase(""); setShowAddCat(false);
  }

  function handlePinChange() {
    if (newPin.length!==4||isNaN(Number(newPin))) { setPinMsg("PIN must be 4 digits"); return; }
    onChangePin(newPin); setNewPin(""); setPinMsg("✅ PIN updated!");
    setTimeout(()=>setPinMsg(""),2000);
  }

  return (
    <div style={{ minHeight:"100vh",background:"#f5f7ff" }}>
      {showCatPhoto && <PhotoPickerModal title={savingPhoto?"Saving...":"Set Category Photo"} color="#667eea" onSave={handleCatPhotoSave} onClose={()=>!savingPhoto&&setShowCatPhoto(null)} showNameField={false} />}
      {showEditCat && <EditCategoryModal cat={showEditCat} onSave={handleCatEdit} onClose={()=>setShowEditCat(null)} />}
      {scheduleCat && <ScheduleModal item={scheduleCat} color={scheduleCat.color||"#667eea"} onSave={updated=>{ onUpdateCategories(categories.map(c=>c.id===updated.id?updated:c)); setScheduleCat(null); }} onClose={()=>setScheduleCat(null)} />}
      <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff",fontSize:20,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>⚙️ Parent Settings</div>
      </div>
      <div style={{ padding:"20px 20px 40px" }}>
        <button onClick={onSave} style={{ width:"100%",padding:16,borderRadius:14,border:"none",background:"#10B981",color:"#fff",fontSize:17,fontWeight:900,fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginBottom:12,boxShadow:"0 4px 14px rgba(16,185,129,0.4)" }}>💾 Save All Data to Firebase</button>
        <button onClick={onExport} style={{ width:"100%",padding:16,borderRadius:14,border:"none",background:"#667eea",color:"#fff",fontSize:17,fontWeight:900,fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginBottom:12,boxShadow:"0 4px 14px rgba(102,126,234,0.4)" }}>📥 Export Backup to Device</button>
        <label style={{ display:"block",width:"100%",padding:16,borderRadius:14,background:"#F59E0B",color:"#fff",fontSize:17,fontWeight:900,fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginBottom:20,boxShadow:"0 4px 14px rgba(245,158,11,0.4)",textAlign:"center",boxSizing:"border-box" }}>
          📤 Import Backup from Device<input type="file" accept=".json" onChange={onImport} style={{ display:"none" }} />
        </label>
        <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:16,color:"#1a1a2e",marginBottom:12 }}>Categories</div>
        <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:20 }}>
          {categories.map(cat=>(
            <div key={cat.id} style={{ background:"#fff",borderRadius:18,padding:"14px 16px",boxShadow:"0 3px 12px rgba(0,0,0,0.07)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:52,height:52,borderRadius:12,overflow:"hidden",background:cat.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {cat.photo ? <img src={cat.photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:28 }}>{cat.emoji}</span>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:15,color:"#1a1a2e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{cat.label}</div>
                  <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#999" }}>{cat.items.length} items</div>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowEditCat(cat)} style={{ background:"#667eea",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:700 }}>✏️</button>
                  <button onClick={()=>setScheduleCat(cat)} style={{ background:"#F59E0B",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:700 }}>⏰</button>
                  <button onClick={()=>setShowCatPhoto(cat.id)} style={{ background:cat.color,border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:700 }}>📷</button>
                  <button onClick={()=>handleDeleteCat(cat.id)} style={{ background:"#fee2e2",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:14,color:"#EF4444",fontWeight:700 }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!showAddCat ? (
          <button onClick={()=>setShowAddCat(true)} style={{ width:"100%",padding:14,borderRadius:16,border:"2px dashed #c0c0c0",background:"transparent",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:15,color:"#888",cursor:"pointer" }}>+ Add New Category</button>
        ) : (
          <div style={{ background:"#fff",borderRadius:18,padding:18,boxShadow:"0 3px 12px rgba(0,0,0,0.07)",marginBottom:20 }}>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:15,marginBottom:14,color:"#1a1a2e" }}>New Category</div>
            <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Category name" style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"2px solid #e0e0e0",fontSize:15,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:10 }} />
            <input value={newCatPhrase} onChange={e=>setNewCatPhrase(e.target.value)} placeholder='Spoken phrase (e.g. "I want to drink")' style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"2px solid #e0e0e0",fontSize:15,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",boxSizing:"border-box",marginBottom:12 }} />
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:8 }}>Icon</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:12 }}>
              {CAT_EMOJIS.map(e=>(<button key={e} onClick={()=>setNewCatEmoji(e)} style={{ fontSize:22,border:"none",borderRadius:8,background:newCatEmoji===e?"#667eea22":"#f0f0f0",padding:"4px 6px",cursor:"pointer",outline:newCatEmoji===e?"2px solid #667eea":"none" }}>{e}</button>))}
            </div>
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:"#666",marginBottom:8 }}>Color</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:14 }}>
              {CAT_COLORS.map(c=>(<button key={c.color} onClick={()=>setSelColor(c)} style={{ width:32,height:32,borderRadius:"50%",background:c.color,border:selColor.color===c.color?"3px solid #1a1a2e":"3px solid transparent",cursor:"pointer" }} />))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowAddCat(false)} style={{ flex:1,padding:12,borderRadius:12,border:"none",background:"#f0f0f0",fontFamily:"'Nunito',sans-serif",fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleAddCat} disabled={!newCatName.trim()} style={{ flex:1,padding:12,borderRadius:12,border:"none",background:newCatName.trim()?"#667eea":"#ccc",color:"#fff",fontFamily:"'Nunito',sans-serif",fontWeight:800,cursor:newCatName.trim()?"pointer":"not-allowed" }}>Add</button>
            </div>
          </div>
        )}
        <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:16,color:"#1a1a2e",margin:"24px 0 12px" }}>Change Parent PIN</div>
        <div style={{ background:"#fff",borderRadius:18,padding:18,boxShadow:"0 3px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontFamily:"'Nunito',sans-serif",fontSize:13,color:"#999",marginBottom:10 }}>Current PIN: {currentPin}</div>
          <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="New 4-digit PIN" maxLength={4} inputMode="numeric" style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"2px solid #e0e0e0",fontSize:18,fontFamily:"'Nunito',sans-serif",fontWeight:800,outline:"none",boxSizing:"border-box",letterSpacing:8,marginBottom:10 }} />
          <button onClick={handlePinChange} style={{ width:"100%",padding:12,borderRadius:12,border:"none",background:"#667eea",color:"#fff",fontFamily:"'Nunito',sans-serif",fontWeight:800,cursor:"pointer",fontSize:15 }}>Update PIN</button>
          {pinMsg && <div style={{ textAlign:"center",marginTop:8,fontFamily:"'Nunito',sans-serif",color:pinMsg.startsWith("✅")?"#10B981":"#EF4444",fontWeight:700 }}>{pinMsg}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── On My Way Banner ─────────────────────────────────────────────────────────
function OnMyWayBanner({ show }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,zIndex:300,background:"linear-gradient(135deg,#10B981,#047857)",padding:"20px 24px",textAlign:"center",boxShadow:"0 4px 24px rgba(16,185,129,0.5)",animation:"slideDown 0.4s ease" }}>
      <div style={{ fontSize:48 }}>👍</div>
      <div style={{ color:"#fff",fontSize:24,fontWeight:900,fontFamily:"'Nunito',sans-serif" }}>On my way!</div>
      <style>{`@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── Parent Companion Screen ──────────────────────────────────────────────────
function ParentCompanionScreen({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages().then(msgs => { setMessages(msgs); setLoading(false); });
    const sub = subscribeToMessages(msg => { setMessages(prev => [msg, ...prev]); });
    return () => sub.unsubscribe();
  }, []);

  function formatTime(ts) { const d = new Date(ts); return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }

  async function handleReply(id) {
    await markRead(id); await sendReply();
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read:true } : m));
  }

  const unread = messages.filter(m => !m.read && m.message !== "👍 On my way!");

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7ff", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)", padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:19, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>📱 Parent View</div>
          <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontFamily:"'Nunito',sans-serif" }}>{unread.length > 0 ? `${unread.length} new request${unread.length > 1 ? "s" : ""}` : "All caught up!"}</div>
        </div>
        {unread.length > 0 && <div style={{ background:"#EF4444",color:"#fff",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:"'Nunito',sans-serif",fontSize:14 }}>{unread.length}</div>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 40px" }}>
        {loading && <div style={{ textAlign:"center", padding:40, color:"#aaa", fontFamily:"'Nunito',sans-serif" }}>Loading...</div>}
        {!loading && messages.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#aaa", fontFamily:"'Nunito',sans-serif", fontSize:15 }}>No messages yet — waiting for him to make a request!</div>}
        {messages.map(msg => {
          const isReply = msg.message === "👍 On my way!";
          const isUnread = !msg.read && !isReply;
          return (
            <div key={msg.id} style={{ background:isReply?"#f0fdf4":isUnread?"#fff7ed":"#fff", borderRadius:18, padding:"14px 16px", marginBottom:12, boxShadow:"0 3px 12px rgba(0,0,0,0.07)", borderLeft:isUnread?"4px solid #F59E0B":isReply?"4px solid #10B981":"4px solid #e0e0e0" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:isUnread?10:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>{isReply ? "👍" : "🗣️"}</span>
                  <div>
                    <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:15, color:"#1a1a2e" }}>{msg.message}</div>
                    <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:"#999", marginTop:2 }}>{formatTime(msg.created_at)}</div>
                  </div>
                </div>
                {isUnread && <span style={{ background:"#F59E0B",color:"#fff",borderRadius:8,padding:"2px 10px",fontSize:11,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>NEW</span>}
              </div>
              {isUnread && (
                <button onClick={() => handleReply(msg.id)} style={{ width:"100%",padding:"10px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#10B981,#047857)",color:"#fff",fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>👍 On my way!</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Choice Board ─────────────────────────────────────────────────────────────
function ChoiceBoardScreen({ onBack }) {
  const [phase, setPhase] = useState("count");
  const [count, setCount] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confetti, setConfetti] = useState(false);

  function handleCountSelect(n) { setCount(n); setPhotos([]); setCurrent(0); setPhase("capture"); }
  function handlePhotoSave({ photo, emoji, name }) {
    const newPhotos = [...photos, { photo, emoji, name: name?.trim() || "" }];
    setPhotos(newPhotos);
    if (newPhotos.length >= count) setPhase("choose");
    else setCurrent(current + 1);
  }
  function handleChoose(idx) { setSelected(idx); setConfetti(true); setPhase("result"); setTimeout(()=>setConfetti(false),2000); if (photos[idx].name) speak(photos[idx].name); }
  function handleReset() { setPhase("count"); setCount(0); setPhotos([]); setCurrent(0); setSelected(null); }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#fef3ff 0%,#fafbff 100%)" }}>
      <Confetti active={confetti} />
      <div style={{ background:"linear-gradient(135deg,#A855F7,#7C3AED)", padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.25)",border:"none",borderRadius:12,width:44,height:44,cursor:"pointer",fontSize:22,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <div style={{ color:"#fff", fontSize:19, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>🎯 Choice Board</div>
      </div>
      <div style={{ padding:24 }}>
        {phase === "count" && (
          <div>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:18, color:"#1a1a2e", marginBottom:16, textAlign:"center" }}>How many options?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              {[2,3,4,5,6].map(n => (
                <button key={n} onClick={()=>handleCountSelect(n)} style={{ padding:"24px 0",borderRadius:18,border:"none",background:"linear-gradient(135deg,#A855F7,#7C3AED)",color:"#fff",fontSize:28,fontWeight:900,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 4px 14px rgba(124,58,237,0.3)" }}>{n}</button>
              ))}
            </div>
          </div>
        )}
        {phase === "capture" && <PhotoPickerModal key={current} title={`Option ${current+1} of ${count}`} color="#A855F7" onSave={handlePhotoSave} onClose={onBack} showNameField={true} nameOptional={true} />}
        {phase === "choose" && (
          <div>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:18, color:"#1a1a2e", marginBottom:16, textAlign:"center" }}>Tap your choice!</div>
            <div style={{ display:"grid", gridTemplateColumns: count<=4 ? "1fr 1fr" : "1fr 1fr 1fr", gap:14 }}>
              {photos.map((p, idx) => (
                <div key={idx} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  {p.name && <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:14, color:"#7C3AED", marginBottom:6, textAlign:"center" }}>{p.name}</div>}
                  <button onClick={()=>handleChoose(idx)} style={{ border:"none",borderRadius:20,padding:0,cursor:"pointer",background:"#fff",boxShadow:"0 6px 18px rgba(0,0,0,0.12)",overflow:"hidden",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",width:"100%" }}>
                    {p.photo ? <img src={p.photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:60 }}>{p.emoji}</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {phase === "result" && selected !== null && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:20 }}>
            <div style={{ borderRadius:28,overflow:"hidden",boxShadow:"0 12px 36px rgba(124,58,237,0.35)",border:"6px solid #A855F7",width:"100%",maxWidth:300,aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff" }}>
              {photos[selected].photo ? <img src={photos[selected].photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : <span style={{ fontSize:120 }}>{photos[selected].emoji}</span>}
            </div>
            {photos[selected].name && <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:22,color:"#1a1a2e",marginTop:14 }}>{photos[selected].name}</div>}
            <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:24,color:"#7C3AED",marginTop:10 }}>Great choice! 🎉</div>
            <button onClick={handleReset} style={{ marginTop:24,padding:"14px 32px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#A855F7,#7C3AED)",color:"#fff",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer" }}>🔄 New Choice</button>
            <button onClick={onBack} style={{ marginTop:12,padding:"14px 32px",borderRadius:16,border:"2px solid #A855F7",background:"transparent",color:"#7C3AED",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer" }}>🏠 Home</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Voice Activated Screen ───────────────────────────────────────────────────
function VoiceActivatedScreen({ categories, parentPin, onSpeak, onExit }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matched, setMatched] = useState([]);
  const [status, setStatus] = useState("Tap the mic to start!");
  const [showPinModal, setShowPinModal] = useState(false);
  const [debug, setDebug] = useState([]);
  const recogRef = useRef(null);

  const allItems = [];
  categories.forEach(cat => { cat.items?.forEach(item => allItems.push({ item, category: cat })); });

  function levenshtein(a, b) {
    const m=a.length,n=b.length;
    const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
    for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
  }

  const PHONETIC_ALIASES = { "you too":"youtube","you tube":"youtube","disney":"disney+","disney plus":"disney+","amazon":"amazon music","mcdonald":"mcdonald's","nugget":"chicken nuggets","nuggets":"chicken nuggets","mac cheese":"mac & cheese","macaroni":"mac & cheese" };

  function applyAliases(text) {
    let t=text.toLowerCase().trim();
    for(const [alias,replacement] of Object.entries(PHONETIC_ALIASES)) { if(t.includes(alias)) t=t.replace(alias,replacement); }
    return t;
  }

  function findMatches(text) {
    const normalized=applyAliases(text.toLowerCase().trim());
    const matches=[]; const seen=new Set();
    for(const {item,category} of allItems) {
      const targets=[item.name.toLowerCase(),category.label.toLowerCase()];
      let score=0;
      for(const t of targets) { if(normalized.includes(t)||t.includes(normalized)){score=t.length+100;break;} }
      if(!score){
        const words=normalized.split(/\s+/);
        const targetWords=[...item.name.toLowerCase().split(/\s+/),...category.label.toLowerCase().split(/\s+/)];
        for(const tw of targetWords){ if(tw.length<4) continue; for(const sw of words){ if(sw.length<4) continue; if(levenshtein(sw,tw)<=Math.floor(Math.max(sw.length,tw.length)/5)) score=Math.max(score,tw.length); }}
      }
      if(score>0&&!seen.has(item.id)){seen.add(item.id);matches.push({item,category,score});}
    }
    return matches.sort((a,b)=>b.score-a.score).slice(0,4);
  }

  function startListening() {
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setStatus("Voice recognition not supported.");return;}
    const recog=new SpeechRecognition();
    recog.lang="en-US"; recog.continuous=false; recog.interimResults=true; recog.maxAlternatives=5;
    recog.onstart=()=>{setListening(true);setStatus("Listening...");setTranscript("");setMatched([]);};
    recog.onresult=(e)=>{
      const texts=Array.from(e.results).flatMap(r=>Array.from(r)).map(r=>r.transcript);
      setTranscript(texts.join(" ")); setDebug(texts);
      let allMatches=[];
      for(const t of texts){ findMatches(t).forEach(m=>{if(!allMatches.find(x=>x.item.id===m.item.id)) allMatches.push(m);}); }
      if(allMatches.length>0) setMatched(allMatches.slice(0,4));
    };
    recog.onend=()=>{setListening(false);if(matched.length===0) setStatus("Didn't catch that — try again!");else setStatus("Is this what you want?");};
    recog.onerror=(e)=>{setListening(false);setStatus(e.error==="not-allowed"?"Microphone permission denied.":"Try again!");};
    recogRef.current=recog; recog.start();
  }

  function handleSelect(item, category) {
    const full=category.phrase?`${category.phrase} ${item.name}`:item.name;
    onSpeak(full); setMatched([]); setTranscript([]); setDebug([]); setStatus("Tap the mic to start!");
  }

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
      {showPinModal && <PinModal title="Exit Voice Mode" correctPin={parentPin} onSuccess={onExit} onClose={()=>setShowPinModal(false)} />}
      <div style={{ position:"absolute",top:20,right:20 }}>
        <button onClick={()=>setShowPinModal(true)} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",color:"#fff",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13 }}>🔐 Edit</button>
      </div>
      <div style={{ fontSize:40,marginBottom:8 }}>🎤</div>
      <div style={{ color:"#fff",fontSize:26,fontWeight:900,fontFamily:"'Nunito',sans-serif",marginBottom:4 }}>Voice Mode</div>
      <div style={{ color:"rgba(255,255,255,0.8)",fontSize:14,fontFamily:"'Nunito',sans-serif",marginBottom:32,textAlign:"center" }}>Say what you want and it will appear!</div>
      <div style={{ color:"rgba(255,255,255,0.9)",fontSize:16,fontWeight:700,fontFamily:"'Nunito',sans-serif",marginBottom:20,textAlign:"center" }}>{status}</div>
      {matched.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:"100%" }}>
          <div style={{ color:"rgba(255,255,255,0.8)",fontSize:14,fontFamily:"'Nunito',sans-serif",marginBottom:16,textAlign:"center" }}>{matched.length===1?"Is this what you want?":"Which one did you mean?"}</div>
          <div style={{ display:"grid",gridTemplateColumns:matched.length===1?"1fr":"1fr 1fr",gap:12,width:"100%",maxWidth:360 }}>
            {matched.map(({item,category},idx)=>{
              const bp=BLOB_PATHS[idx%BLOB_PATHS.length]; const uid2=`vm_${item.id}`;
              return (
                <button key={item.id} onClick={()=>handleSelect(item,category)} style={{ background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",flexDirection:"column",alignItems:"center",filter:`drop-shadow(0 6px 16px ${category.dark}88)` }}>
                  <svg viewBox="0 0 100 100" style={{ width:matched.length===1?180:140,height:matched.length===1?180:140,display:"block",overflow:"visible" }}>
                    <defs>
                      <radialGradient id={`${uid2}_g`} cx="38%" cy="28%" r="65%"><stop offset="0%" stopColor={category.light}/><stop offset="48%" stopColor={category.color}/><stop offset="100%" stopColor={category.dark}/></radialGradient>
                      <clipPath id={`${uid2}_c`}><path d={bp}/></clipPath>
                    </defs>
                    <path d={bp} fill={`url(#${uid2}_g)`}/>
                    {item.photo?<image href={item.photo} x="8" y="8" width="84" height="84" clipPath={`url(#${uid2}_c)`} preserveAspectRatio="xMidYMid slice" opacity="0.9"/>:<text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="38">{item.emoji}</text>}
                    <ellipse cx="36" cy="26" rx="15" ry="10" fill="white" opacity="0.3" transform="rotate(-20,36,26)"/>
                  </svg>
                  <span style={{ color:"#fff",fontSize:14,fontWeight:900,fontFamily:"'Nunito',sans-serif",marginTop:4,textAlign:"center" }}>{item.name}</span>
                </button>
              );
            })}
          </div>
          <button onClick={()=>{setMatched([]);setTranscript("");setDebug([]);setStatus("Tap the mic to start!");}} style={{ marginTop:20,padding:"12px 32px",borderRadius:14,border:"2px solid rgba(255,255,255,0.4)",background:"transparent",color:"#fff",fontSize:15,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer" }}>🔄 Try Again</button>
        </div>
      )}
      {matched.length===0 && (
        <button onClick={startListening} disabled={listening} style={{ width:120,height:120,borderRadius:"50%",border:"none",background:listening?"#EF4444":"rgba(255,255,255,0.95)",cursor:listening?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,boxShadow:listening?"0 0 0 20px rgba(239,68,68,0.3)":"0 8px 28px rgba(0,0,0,0.25)",transition:"all 0.3s ease",animation:listening?"pulse 1.2s infinite":"none" }}>
          {listening?"⏹️":"🎤"}
        </button>
      )}
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 20px rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 35px rgba(239,68,68,0.05)}}`}</style>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function MyVoiceApp() {
  const [data, setData] = useState(SEED_DATA);
  const [schoolData, setSchoolData] = useState(SCHOOL_SEED_DATA);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home"); // home | category | body | choice | settings | companion
  const [activeCategory, setActiveCategory] = useState(null);
  const [parentMode, setParentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState(null);
  const [showOnMyWay, setShowOnMyWay] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try { return localStorage.getItem("myvoice_notifications") !== "false"; } catch { return true; }
  });
  const [schoolMode, setSchoolMode] = useState(getSchoolMode);
  const [lastRequest, setLastRequest] = useState(() => {
    try { return localStorage.getItem("myvoice_last_request") || ""; } catch { return ""; }
  });

  const activeData = schoolMode ? schoolData : data;

  function updateLastRequest(text) { setLastRequest(text); try { localStorage.setItem("myvoice_last_request", text); } catch {} }
  function clearLastRequest() { setLastRequest(""); try { localStorage.removeItem("myvoice_last_request"); } catch {} }

  useEffect(() => {
    const link = document.createElement("link");
    link.rel="stylesheet"; link.href=FONT_LINK;
    document.head.appendChild(link);

    loadFromFirestore(SEED_DATA).then(d => {
      const fixed = {
        ...d,
        bodyParts: DEFAULT_BODY_PARTS,
        bodyZones: d.bodyZones || null,
        categories: d.categories.map(cat => ({
          ...cat,
          items: (cat.items || []).map(item => {
            if (item.name?.toLowerCase() === "youtube") return { ...item, appLink:"https://www.youtube.com", webLink:"https://www.youtube.com", itemType:null };
            if (item.name?.toLowerCase() === "disney+") return { ...item, appLink:"https://www.disneyplus.com", webLink:"https://www.disneyplus.com", itemType:null };
            return item;
          })
        }))
      };
      setData(fixed);
      if (fixed.voiceMode) setVoiceMode(true);
      setLoaded(true);
    });

    setSchoolData(SCHOOL_SEED_DATA);

    const sub = subscribeToMessages(msg => {
      if (msg.message === "👍 On my way!") {
        setShowOnMyWay(true); speak("On my way!");
        setTimeout(() => setShowOnMyWay(false), 4000);
      }
    });
    return () => sub?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!globalSearch.trim()) { setSearchResults([]); return; }
    const q = globalSearch.toLowerCase();
    const results = [];
    activeData.categories.forEach(cat => {
      cat.items?.forEach(item => { if (item.name.toLowerCase().includes(q)) results.push({ item, category:cat }); });
    });
    setSearchResults(results);
  }, [globalSearch, activeData.categories]);

  function persist(updated) {
    if (schoolMode) {
      setSchoolData(updated);
      try { localStorage.setItem("myvoice_school_data", JSON.stringify(updated)); } catch {}
    } else {
      setData(updated);
      saveData(updated);
    }
  }

  function updateCategory(c) { persist({ ...activeData, categories:activeData.categories.map(x=>x.id===c.id?c:x) }); }
  function updateAllCategories(cats) { persist({ ...activeData, categories:cats }); }
  function updateBodyParts(parts) { persist({ ...activeData, bodyParts: parts }); }
  function updateBodyPhoto(url) { persist({ ...activeData, bodyPhoto: url }); }
  function updateBodyZones(zones) { persist({ ...activeData, bodyZones: zones }); }
  function resetBodyParts() {
    persist({ ...activeData, bodyParts: DEFAULT_BODY_PARTS, bodyZones: null });
  }

  function toggleSchoolMode() { const v=!schoolMode; setSchoolMode(v); setSchoolModeLocal(v); setScreen("home"); setGlobalSearch(""); }

  function handleToggleParent() {
    if (parentMode) { setParentMode(false); }
    else { setPinAction("unlock"); setShowPinModal(true); }
  }

  function handlePinSuccess() { setShowPinModal(false); if (pinAction==="unlock") setParentMode(true); }

  const bodyParts = data.bodyParts || DEFAULT_BODY_PARTS;

  return (
    <div style={{ maxWidth:"100%", width:"100%", fontFamily:"'Nunito',sans-serif" }}>
      <OnMyWayBanner show={showOnMyWay} />
      {!loaded && (
        <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"linear-gradient(135deg,#667eea,#764ba2)" }}>
          <div style={{ fontSize:52 }}>🗣️</div>
          <div style={{ color:"#fff",fontSize:22,fontWeight:800,fontFamily:"'Nunito',sans-serif" }}>My Voice</div>
          <div style={{ color:"rgba(255,255,255,0.8)",fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Loading...</div>
        </div>
      )}
      {showPinModal && <PinModal title="Parent Mode" correctPin={activeData.parentPin} onSuccess={handlePinSuccess} onClose={()=>setShowPinModal(false)} />}

      {/* Voice Mode */}
      {loaded && screen==="home" && voiceMode && !parentMode && (
        <VoiceActivatedScreen categories={activeData.categories} parentPin={activeData.parentPin}
          onSpeak={(text)=>{ speak(text); sendMessage(text); if(notificationsEnabled){fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})}).catch(()=>{});} updateLastRequest(text); }}
          onExit={()=>{ setVoiceMode(false); saveData({...data,voiceMode:false}); }} />
      )}

      {/* Home Screen */}
      {loaded && screen==="home" && (!voiceMode || parentMode) && (
        <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#eef2ff 0%,#fafbff 100%)" }}>
          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",padding:"24px 24px 16px",boxShadow:"0 4px 24px rgba(102,126,234,0.3)" }}>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:32,marginBottom:2 }}>🗣️</div>
                <div style={{ color:"#fff",fontSize:26,fontWeight:900,fontFamily:"'Nunito',sans-serif",lineHeight:1.1 }}>My Voice</div>
                <div style={{ color:"rgba(255,255,255,0.8)",fontSize:13,fontFamily:"'Nunito',sans-serif",marginTop:3 }}>
                  {parentMode ? "✏️ Edit Mode" : schoolMode ? "🎒 School Mode" : "Tap a button to speak!"}
                </div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end" }}>
                <button onClick={handleToggleParent} style={{ background:parentMode?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:parentMode?"#667eea":"#fff" }}>
                  {parentMode ? "🔓 Exit Edit" : "🔐 Edit"}
                </button>
                {parentMode && <button onClick={()=>setScreen("settings")} style={{ background:"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:"#fff" }}>⚙️ Settings</button>}
                {parentMode && (
                  <button onClick={()=>{ const v=!notificationsEnabled; setNotificationsEnabled(v); try{localStorage.setItem("myvoice_notifications",v?"true":"false");}catch{} }} style={{ background:notificationsEnabled?"rgba(255,255,255,0.22)":"#EF4444",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:"#fff" }}>
                    {notificationsEnabled ? "🔔 Notifs ON" : "🔕 Notifs OFF"}
                  </button>
                )}
                {parentMode && (
                  <button onClick={()=>{ const v=!voiceMode; setVoiceMode(v); persist({...activeData,voiceMode:v}); }} style={{ background:voiceMode?"#10B981":"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:"#fff" }}>
                    {voiceMode ? "🎤 Voice Mode ON" : "🎤 Voice Mode"}
                  </button>
                )}
                <button onClick={()=>setScreen("choice")} style={{ background:"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:"#fff" }}>🎯 Choice Board</button>
              </div>
            </div>

            {/* Search */}
            <div style={{ marginTop:14, position:"relative" }}>
              <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="🔍 Search everything..."
                style={{ width:"100%",padding:"12px 16px",borderRadius:18,border:"none",fontSize:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,outline:"none",background:"rgba(255,255,255,0.95)",boxSizing:"border-box",boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }} />
              {globalSearch && <button onClick={()=>{setGlobalSearch("");setSearchResults([]);}} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#999" }}>✕</button>}
            </div>
          </div>

          {/* Last Request Bar */}
          {lastRequest && (
            <div style={{ background:"#1a1a2e",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,borderBottom:"3px solid #667eea" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0 }}>
                <span style={{ fontSize:26,flexShrink:0 }}>🗣️</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2 }}>LAST REQUEST</div>
                  <div style={{ fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:18,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>"{lastRequest}"</div>
                </div>
              </div>
              <button onClick={clearLastRequest} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:10,padding:"6px 14px",cursor:"pointer",color:"#fff",fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:800,flexShrink:0 }}>✕ Clear</button>
            </div>
          )}

          {/* Grid */}
          <div style={{ padding:"16px 20px 40px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16, alignItems:"start" }}>
            {globalSearch ? (
              searchResults.length > 0 ? searchResults.map(({item,category}) => (
                <div key={item.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <BlobCard item={item} phrase={category.phrase} color={category.color} dark={category.dark} light={category.light} index={0}
                    onSpeak={(text)=>{ sendMessage(text); if(notificationsEnabled){fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})}).catch(e=>console.error(e));} setGlobalSearch(""); setSearchResults([]); }}
                    onEdit={()=>{}} onDelete={()=>{}} onOpenMenu={()=>{}} onManageMenu={()=>{}} onManageCustomMenu={()=>{}} onSchedule={()=>{}} parentMode={false} />
                  <div style={{ fontSize:10,color:"#aaa",fontFamily:"'Nunito',sans-serif",marginTop:2 }}>{category.label}</div>
                </div>
              )) : (
                <div style={{ gridColumn:"1/-1",textAlign:"center",padding:40,color:"#aaa",fontFamily:"'Nunito',sans-serif",fontSize:15 }}>No results for "{globalSearch}"</div>
              )
            ) : (
              <>
                {activeData.categories
                  .filter(cat => parentMode || isAvailable(cat))
                  .map((cat,i) => (
                    <div key={cat.id} style={{ position:"relative" }}>
                      <HomeBlobCard cat={cat} index={i} parentMode={parentMode} onClick={()=>{ setActiveCategory(cat); setScreen("category"); }} />
                      {parentMode && (
                        <div style={{ position:"absolute",top:0,right:0,display:"flex",flexDirection:"column",gap:4,padding:4 }}>
                          <button onClick={()=>{ const cats=[...activeData.categories]; if(i===0)return; [cats[i-1],cats[i]]=[cats[i],cats[i-1]]; updateAllCategories(cats); }} style={{ background:"rgba(0,0,0,0.5)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>▲</button>
                          <button onClick={()=>{ const cats=[...activeData.categories]; if(i===cats.length-1)return; [cats[i],cats[i+1]]=[cats[i+1],cats[i]]; updateAllCategories(cats); }} style={{ background:"rgba(0,0,0,0.5)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>▼</button>
                        </div>
                      )}
                    </div>
                  ))
                }

                {/* My Body Button — uses HomeBlobCard to match other categories */}
                <div style={{ position:"relative" }}>
                  <HomeBlobCard
                    cat={{
                      id:"body",
                      label:"My Body",
                      emoji:"🫀",
                      photo: data.bodyPhoto || null,
                      color:"#3B82F6",
                      dark:"#1D4ED8",
                      light:"#93C5FD",
                      items: DEFAULT_BODY_PARTS,
                    }}
                    index={activeData.categories.filter(cat => parentMode || isAvailable(cat)).length}
                    parentMode={false}
                    onClick={()=>setScreen("body")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Category Screen */}
      {screen==="category" && activeCategory && (
        <CategoryScreen
          category={activeData.categories.find(c=>c.id===activeCategory.id)||activeCategory}
          parentMode={parentMode}
          onBack={()=>setScreen("home")}
          onUpdateCategory={updateCategory}
          onSpoken={updateLastRequest}
          notificationsEnabled={notificationsEnabled} />
      )}

      {/* My Body Screen */}
      {loaded && screen==="body" && (
        <MyBodyScreen
          bodyParts={bodyParts}
          bodyPhoto={data.bodyPhoto || null}
          bodyZones={data.bodyZones || null}
          onBack={()=>setScreen("home")}
          onUpdateBodyParts={updateBodyParts}
          onUpdateBodyPhoto={updateBodyPhoto}
          onUpdateBodyZones={updateBodyZones}
          onResetBodyParts={resetBodyParts}
          parentMode={parentMode}
          onSpoken={updateLastRequest}
          notificationsEnabled={notificationsEnabled} />
      )}

      {/* Choice Board */}
      {loaded && screen==="choice" && <ChoiceBoardScreen onBack={()=>setScreen("home")} />}

      {/* Settings */}
      {loaded && screen==="settings" && (
        <SettingsScreen categories={activeData.categories} currentPin={activeData.parentPin}
          onUpdateCategories={updateAllCategories}
          onChangePin={pin=>persist({...activeData,parentPin:pin})}
          onBack={()=>setScreen("home")}
          onSave={()=>{ saveData(activeData); alert("✅ Saved to Firebase successfully!"); }}
          onImport={(e)=>{
            const file=e.target.files[0]; if(!file) return;
            const reader=new FileReader();
            reader.onload=(ev)=>{
              try {
                const imported=JSON.parse(ev.target.result);
                if(!imported.categories){alert("❌ Invalid backup file!");return;}
                if(window.confirm(`Restore from ${file.name}? This will replace all current data.`)){
                  persist(imported); alert("✅ Restored successfully!");
                }
              } catch(err){ alert("❌ Could not read backup file."); }
            };
            reader.readAsText(file);
          }}
          onExport={()=>{
            const date=new Date().toISOString().slice(0,10);
            const json=JSON.stringify(activeData,null,2);
            const blob=new Blob([json],{type:"application/json"});
            const url=URL.createObjectURL(blob);
            const a=document.createElement("a"); a.href=url; a.download=`MyVoice_${date}.json`;
            document.body.appendChild(a); a.click();
            setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},500);
          }} />
      )}
    </div>
  );
}
