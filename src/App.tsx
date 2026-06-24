/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { HOSTELS_DATA, MEMBERS } from "./data";
import { db, signIn, auth } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Users, Hotel, ArrowDown10, Flame, 
  RotateCcw, AlertCircle, MapPin, 
  Check, Info, Plane, Heart, HeartOff,
  Wifi, Car, Utensils, CalendarX2
} from "lucide-react";

type VotesState = {
  [key: string]: string[];
};

export default function App() {
  const [votesState, setVotesState] = useState<VotesState>({});
  const [currentActiveVoter, setCurrentActiveVoter] = useState("傑");
  const [currentSort, setCurrentSort] = useState<"default" | "priceAsc" | "votesDesc">("default");
  const [syncStatus, setSyncStatus] = useState({ connected: false, message: "正在連線雲端資料庫..." });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, msg: string, icon: string }>({ show: false, msg: "", icon: "" });

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setSyncStatus({ connected: true, message: "雲端已同步連線" });
        const docRef = doc(db, "votesState", "group6");
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.votes) {
              setVotesState(data.votes);
            }
          } else {
            const initial: VotesState = {};
            MEMBERS.forEach(m => initial[m] = []);
            setDoc(docRef, { votes: initial }, { merge: true });
          }
        }, (error) => {
          console.error("雲端同步異常:", error);
          setSyncStatus({ connected: false, message: "同步中斷，嘗試重新連線..." });
        });
        
        return () => unsubscribe();
      } else {
        setSyncStatus({ connected: false, message: "未認證 (連線中...)" });
        signIn();
      }
    });
  }, []);

  const showToast = (msg: string, icon: string) => {
    setToast({ show: true, msg, icon });
    setTimeout(() => setToast({ show: false, msg: "", icon: "" }), 2500);
  };

  const updateVotesInFirestore = async (newVotesState: VotesState) => {
    try {
      const docRef = doc(db, "votesState", "group6");
      await setDoc(docRef, { votes: newVotesState }, { merge: true });
    } catch (error) {
      console.error("儲存到雲端失敗:", error);
      showToast("雲端同步失敗，請檢查網路連線", "❌");
    }
  };

  const toggleVote = (hostelId: string) => {
    const newState = { ...votesState };
    if (!newState[currentActiveVoter]) newState[currentActiveVoter] = [];
    
    const currentVotes = newState[currentActiveVoter];
    const index = currentVotes.indexOf(hostelId);
    const hostel = HOSTELS_DATA.find(h => h.id === hostelId);
    
    if (index > -1) {
      currentVotes.splice(index, 1);
      showToast(`已為 [${currentActiveVoter}] 取消投給 「${hostel?.name}」`, "🚫");
    } else {
      currentVotes.push(hostelId);
      showToast(`[${currentActiveVoter}] 成功投給 「${hostel?.name}」！`, "💖");
    }
    
    setVotesState(newState);
    updateVotesInFirestore(newState);
  };

  const confirmResetAllVotes = () => {
    const newState: VotesState = {};
    MEMBERS.forEach(m => newState[m] = []);
    setCurrentActiveVoter("傑");
    setVotesState(newState);
    updateVotesInFirestore(newState);
    showToast("已成功重設雲端所有投票數據！", "🔄");
    setShowConfirmReset(false);
  };

  const activeVotersCount = MEMBERS.filter(m => votesState[m] && votesState[m].length > 0).length;

  const voteCounts: Record<string, string[]> = {};
  HOSTELS_DATA.forEach(h => voteCounts[h.id] = []);
  MEMBERS.forEach(member => {
    const mvotes = votesState[member] || [];
    mvotes.forEach(hid => {
      if (voteCounts[hid]) voteCounts[hid].push(member);
    });
  });

  const sortedData = [...HOSTELS_DATA];
  if (currentSort === "priceAsc") {
    sortedData.sort((a, b) => a.totalPrice - b.totalPrice);
  } else if (currentSort === "votesDesc") {
    sortedData.sort((a, b) => voteCounts[b.id].length - voteCounts[a.id].length);
  }

  const getFeatureIcon = (f: string) => {
    if (f.includes('游泳')) return <Wifi className="w-3 h-3 text-slate-400" />;
    if (f.includes('停車')) return <Car className="w-3 h-3 text-slate-400" />;
    if (f.includes('早餐')) return <Utensils className="w-3 h-3 text-slate-400" />;
    if (f.includes('取消')) return <CalendarX2 className="w-3 h-3 text-slate-400" />;
    return <Check className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-16">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-4 shadow-lg text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">Group of 6 Members • Cloud Sync</span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-wide">🏖️ 我們的民宿大決選！</h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
            大家久等了！這裡收集了我們挑選的 8 間優質民宿，請點選最想去的款式（可多選），系統會自動計算出每人的分攤費用與即時票數！
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> 請選擇您的名字投票：
            </h2>
            <p className="text-xs text-slate-400">（點選切換身分，每個人都可以自由進行多選投票喔！）</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {MEMBERS.map(member => {
                const isSelected = member === currentActiveVoter;
                const votedCount = votesState[member] ? votesState[member].length : 0;
                return (
                  <button
                    key={member}
                    onClick={() => {
                      setCurrentActiveVoter(member);
                      showToast(`已切換操作者為：${member}`, "👤");
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 border ${
                      isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{member}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      已投 {votedCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
            <div className="text-sm text-slate-500">總投票進度</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{activeVotersCount} / 6 人已投</div>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center md:justify-end mt-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${syncStatus.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className={syncStatus.connected ? 'text-emerald-600 font-semibold' : 'text-amber-500 font-semibold'}>{syncStatus.message}</span>
            </div>

            <button onClick={() => setShowConfirmReset(true)} className="mt-4 text-xs text-rose-500 hover:text-rose-700 transition font-medium flex items-center justify-center md:justify-end gap-1 mx-auto md:mr-0">
              <RotateCcw className="w-3.5 h-3.5" /> 重設所有投票資料
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-indigo-500" /> 民宿候選清單 ({sortedData.length} 間)
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => { setCurrentSort("priceAsc"); showToast("已將民宿依總價格由低到高排序", "💰"); }} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 transition ${currentSort === 'priceAsc' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <ArrowDown10 className="w-3.5 h-3.5" /> 價格由低到高
            </button>
            <button 
              onClick={() => { setCurrentSort("votesDesc"); showToast("已將民宿依目前得票數由多到少排序", "🔥"); }} 
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 transition ${currentSort === 'votesDesc' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" /> 熱門度排序
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedData.map(hostel => {
            const votersWhoChoseThis = voteCounts[hostel.id] || [];
            const voteCount = votersWhoChoseThis.length;
            const hasVotedThis = (votesState[currentActiveVoter] || []).includes(hostel.id);
            const perPersonPrice = Math.round(hostel.totalPrice / 6);
            const hasDiscount = hostel.originalPrice > hostel.totalPrice;
            const discountPercent = hasDiscount ? Math.round((1 - (hostel.totalPrice / hostel.originalPrice)) * 100) : 0;

            return (
              <div key={hostel.id} className={`bg-white rounded-2xl border transition duration-300 overflow-hidden flex flex-col ${hasVotedThis ? 'border-blue-500 bg-blue-50/30 transform -translate-y-1 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500 ring-offset-2' : 'border-slate-200 hover:shadow-md'}`}>
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden group">
                  <img src={hostel.img} alt={hostel.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    🏆 ⭐ {hostel.rating} <span className="opacity-75 text-[10px]">({hostel.reviews.split(' ')[0]}則)</span>
                  </div>
                  {hostel.discountTag && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded-lg font-black tracking-wider shadow-sm animate-pulse">
                      {hostel.discountTag}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/60 to-transparent p-3 pt-10">
                    <span className="text-white font-bold text-sm drop-shadow-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> {hostel.location.split('•')[0]}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition mb-2">
                      <a href={hostel.link} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                        {hostel.name}
                      </a>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-1">{hostel.location}</p>
                    <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-600 border border-slate-100">
                      <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400" /> 房型/規格：
                      </div>
                      <p className="leading-relaxed line-clamp-3">{hostel.specs}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hostel.features.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                          {getFeatureIcon(f)} {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-xs text-slate-400 block">1 晚 • 6位成人</span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-slate-400 line-through mr-1">TWD {hostel.originalPrice.toLocaleString()}</span>
                            <span className="text-xs text-emerald-600 font-bold">(-{discountPercent}%)</span>
                          </>
                        )}
                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                          <span className="text-sm font-semibold">TWD</span> {hostel.totalPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-blue-500 font-bold uppercase block tracking-wider">一人平均 (除以 6)</span>
                        <div className="text-lg font-black text-blue-700">
                          <span className="text-xs">TWD</span> {perPersonPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
                        <span>目前票數：{voteCount} 票</span>
                        <span className="text-blue-600">{Math.round((voteCount / 6) * 100)}% 支持率</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(voteCount / 6) * 100}%` }}></div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {voteCount > 0 ? votersWhoChoseThis.map(v => (
                          <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">{v}</span>
                        )) : <span className="text-slate-400 text-[11px] italic">尚未有人投給這間</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <a href={hostel.link} target="_blank" rel="noreferrer" className="bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold py-2.5 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1 border border-sky-100">
                        <Plane className="w-3.5 h-3.5" /> Booking 連結
                      </a>
                      <button 
                        onClick={() => toggleVote(hostel.id)} 
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          hasVotedThis 
                          ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                        }`}
                      >
                        {hasVotedThis ? <HeartOff className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                        <span>{hasVotedThis ? '取消投票' : '投它一票'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-rose-500 bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">確定重設所有投票嗎？</h3>
            <p className="text-slate-500 text-sm mb-6">這將會清除「傑、茶、伶、羚、雅、亭」所有人目前儲存在雲端上的投票記錄，且無法還原喔！</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirmReset(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
                取消
              </button>
              <button onClick={confirmResetAllVotes} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-100 transition">
                確定清除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-5 right-5 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
