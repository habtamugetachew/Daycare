import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';
import {
  Lock,
  ShieldCheck,
  Users,
  User,
  Sun,
  Video,
  Mic,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  Minimize2,
  Settings,
  Wifi,
  Heart,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Grid,
  Square
} from 'lucide-react';

const LiveStreamMonitoring = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Data state
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Interactive video controls
  const [volume, setVolume] = useState(65);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streamQuality, setStreamQuality] = useState('1080p');
  const [nightVision, setNightVision] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Admin view toggle (single vs matrix)
  const [viewMode, setViewMode] = useState('single');

  const playerContainerRef = useRef(null);

  // Live real-time clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timestamp: "Sep 21, 2026  12:31:24 PM" exactly like reference image
  const formatLiveTimestamp = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year}  ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Fetch permitted rooms from backend
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/live-stream/rooms');
      if (res.data.success) {
        const roomList = res.data.data || [];
        setRooms(roomList);
        if (roomList.length > 0 && !selectedRoomId) {
          setSelectedRoomId(roomList[0].roomId);
        }
      }
    } catch (err) {
      console.error('Failed to load live stream rooms:', err);
      setError(err.response?.data?.message || 'Failed to connect to daycare live monitoring server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const selectedRoom = rooms.find(r => r.roomId === selectedRoomId) || rooms[0] || null;

  // Derive display values matching the screenshot
  const roomName = selectedRoom?.name || 'Sunshine Room';
  const childrenCount = selectedRoom ? (selectedRoom.enrolledCount || selectedRoom.visibleChildren?.length || 8) : 8;
  const nannyName = selectedRoom?.teacher?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Sarah';

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Volume Change
  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  // Toggle Mic
  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    setActionSuccess(isMicActive ? 'Classroom audio muted' : 'Classroom audio active');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Take Snapshot Download
  const handleTakeSnapshot = () => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/assets/images/daycare-sunshine-room.jpg';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1920;
        canvas.height = img.naturalHeight || 1080;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(30, canvas.height - 80, 520, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${roomName} - Camera 01  |  ${formatLiveTimestamp(currentTime)}`, 45, canvas.height - 48);

        const dataUrl = canvas.toDataURL('image/png');
        const filename = `Mint-Daycare-${roomName.replace(/\s+/g, '-')}-${Date.now()}.png`;
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();

        setActionSuccess('Snapshot saved to downloads!');
        setTimeout(() => setActionSuccess(''), 3000);
      };
    } catch (err) {
      console.error('Snapshot failed:', err);
    }
  };

  // Privacy Toggle
  const handleTogglePrivacy = async (roomId, currentPrivacy) => {
    try {
      const res = await api.put(`/live-stream/rooms/${roomId}/settings`, {
        privacyMode: !currentPrivacy
      });
      if (res.data.success) {
        setRooms(prev => prev.map(r => r.roomId === roomId ? { ...r, privacyMode: !currentPrivacy } : r));
        setActionSuccess(!currentPrivacy ? 'Privacy mode enabled (Camera masked)' : 'Privacy mode disabled (Feed restored)');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update camera privacy.');
    }
  };

  const isAdminOrReception = user?.role === 'admin' || user?.role === 'reception';
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-5 animate-fade-in text-slate-100 font-sans select-none">
      {/* ── 1. Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Glowing Green Lock + Title + Live Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/15 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-[26px] font-bold text-white tracking-tight leading-none">
                {t('liveStream') || 'Live Stream'}
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-Time Live Video Streaming & Room Monitoring
            </p>
          </div>
        </div>

        {/* Right Side: Role Scope Banner / Admin Switcher */}
        <div className="flex items-center gap-3">
          {isAdminOrReception && rooms.length > 1 && (
            <div className="flex items-center bg-[#0b2438] p-1 rounded-xl border border-teal-500/30">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'single' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Square className="w-3.5 h-3.5" />
                Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'matrix' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Grid className="w-3.5 h-3.5" />
                Multi-Cam
              </button>
            </div>
          )}

          <div className="bg-[#0b2438]/90 border border-teal-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-3.5 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                {isTeacher && 'Your Assigned Classroom Only'}
                {isParent && 'Your Child’s Classroom Only'}
                {isAdminOrReception && 'Full Campus Access'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isTeacher && 'Access limited to your assigned classroom'}
                {isParent && 'Access limited to your enrolled child’s room'}
                {isAdminOrReception && 'Monitoring all active classrooms'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full border border-emerald-500/40 text-emerald-400 flex items-center justify-center ml-1 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Multi-Room Selector Tabs for Admin ── */}
      {isAdminOrReception && rooms.length > 1 && viewMode === 'single' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {rooms.map(room => (
            <button
              key={room.roomId}
              type="button"
              onClick={() => setSelectedRoomId(room.roomId)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${room.roomId === selectedRoom?.roomId ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/20' : 'bg-[#081827] text-slate-300 border-teal-900/40 hover:border-teal-500/40'}`}
            >
              <span className={`w-2 h-2 rounded-full ${room.privacyMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{room.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── 2. Main Content Grid (65% Left / 35% Right) ── */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ──── LEFT COLUMN: THE LIVE STREAM VIDEO (8 Cols) ──── */}
          <div className="lg:col-span-8">
            <div className="bg-[#081827] border border-teal-900/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
              {/* Inner Card Top Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Left: Icon, Sun, Room Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <Sun className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium leading-none">
                      My Assigned Classroom
                    </p>
                    <p className="text-lg font-bold text-white mt-1 leading-tight tracking-wide">
                      {roomName}
                    </p>
                  </div>
                </div>

                {/* Right: Live Pill, Real-time badge, Dynamic Timestamp */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[11px] shadow-sm shadow-red-600/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE
                  </span>
                  <span className="flex items-center gap-1 text-teal-400 font-medium text-xs">
                    <Wifi className="w-3.5 h-3.5" />
                    Real-time
                  </span>
                  <span className="text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {formatLiveTimestamp(currentTime)}
                  </span>
                </div>
              </div>

              {/* Video Player Display */}
              <div
                ref={playerContainerRef}
                className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-inner border border-slate-800/80 group select-none"
              >
                {/* Privacy Mode Overlay */}
                {selectedRoom?.privacyMode ? (
                  <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
                      <EyeOff className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Privacy Shield Active</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Camera feed is temporarily shielded for children's privacy.
                    </p>
                    {isAdminOrReception && (
                      <button
                        type="button"
                        onClick={() => handleTogglePrivacy(selectedRoom.roomId, true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md"
                      >
                        Disable Privacy Mode
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* The Crisp Classroom Feed Image */}
                    <img
                      src="/assets/images/daycare-sunshine-room.jpg"
                      alt="Daycare Live Stream"
                      className="w-full h-full object-cover transition-all duration-300"
                      style={{
                        filter: nightVision ? 'invert(10%) contrast(150%) hue-rotate(90deg)' : 'none'
                      }}
                    />

                    {/* Subtle CCTV Ambient Scanlines Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

                    {/* Top-Left: "● LIVE" Badge */}
                    <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/10 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        LIVE
                      </span>
                    </div>

                    {/* Security Watermark for Parent Feed */}
                    {isParent && (
                      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-20">
                        <p className="text-white text-xs sm:text-sm font-mono tracking-widest transform -rotate-12 select-none text-center">
                          MINT DAYCARE SECURE FEED • {user?.fullName?.toUpperCase()} • {currentTime.toISOString().split('T')[0]}
                        </p>
                      </div>
                    )}

                    {/* Bottom-Left: Room & Camera Tag */}
                    <div className="absolute bottom-3.5 left-3.5 z-10 pointer-events-none">
                      <span className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md text-white font-medium text-xs border border-white/10 shadow-md">
                        {roomName} – Camera 01
                      </span>
                    </div>

                    {/* Bottom Floating Control Dock */}
                    <div className="absolute bottom-3.5 right-3.5 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-10 bg-black/75 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl flex items-center gap-3.5 shadow-2xl">
                      {/* Volume Icon + Range Slider */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="text-white hover:text-teal-400 transition-colors cursor-pointer"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-teal-400" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 sm:w-20 accent-teal-400 h-1 bg-white/20 rounded-lg cursor-pointer"
                          title={`Volume: ${isMuted ? 0 : volume}%`}
                        />
                      </div>

                      {/* Mic Button */}
                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isMicActive ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                        title={isMicActive ? 'Mute Classroom Microphone' : 'Enable Classroom Microphone'}
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Snapshot Camera Button */}
                      <button
                        type="button"
                        onClick={handleTakeSnapshot}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Capture Instant Snapshot"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>

                      {/* Settings Gear */}
                      <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${showSettings ? 'bg-teal-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        title="Stream Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Settings Dropdown Overlay */}
                    {showSettings && (
                      <div className="absolute bottom-16 right-3.5 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 bg-[#081827]/95 backdrop-blur-md border border-teal-500/30 rounded-2xl p-4 w-64 shadow-2xl text-xs space-y-3">
                        <p className="font-bold text-white border-b border-white/10 pb-2">Stream Configuration</p>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Resolution</span>
                          <select
                            value={streamQuality}
                            onChange={(e) => setStreamQuality(e.target.value)}
                            className="bg-slate-900 border border-teal-500/40 text-teal-300 text-xs rounded-lg px-2 py-1 outline-none"
                          >
                            <option value="1080p">1080p Full HD</option>
                            <option value="720p">720p HD</option>
                            <option value="480p">480p SD</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Night Vision (IR)</span>
                          <button
                            type="button"
                            onClick={() => setNightVision(!nightVision)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${nightVision ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}
                          >
                            {nightVision ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        {(isAdminOrReception || isTeacher) && (
                          <div className="pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() => handleTogglePrivacy(selectedRoom?.roomId, selectedRoom?.privacyMode)}
                              className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold"
                            >
                              {selectedRoom?.privacyMode ? 'Turn Off Privacy Shield' : 'Turn On Privacy Shield'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN: ROOM INFO & STATUS CARDS (4 Cols) ──── */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Room Information Card */}
            <div className="bg-[#081827] border border-teal-900/50 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Room Information</h3>

              {/* Assigned Room Highlight Box */}
              <div className="bg-[#0b2438] border border-teal-500/20 rounded-xl p-3.5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium leading-none">Assigned Room</p>
                  <p className="text-base font-bold text-white mt-1 leading-tight tracking-wide">
                    {roomName}
                  </p>
                </div>
              </div>

              {/* Information Rows matching mockup */}
              <div className="space-y-3 pt-1">
                {/* Row 1: Children Present */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>Children Present</span>
                  </div>
                  <span className="text-base font-bold text-white">{childrenCount}</span>
                </div>

                {/* Row 2: Nanny */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>Nanny</span>
                  </div>
                  <span className="text-sm font-bold text-white">{nannyName}</span>
                </div>

                {/* Row 3: Camera */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <span>Camera</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>

                {/* Row 4: Secure Encrypted Stream */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Secure Encrypted Stream</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Yes
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Room Monitoring Status Card */}
            <div className="bg-[#081827] border border-teal-900/50 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Room Monitoring Status</h3>

              {/* 3 Status Mini Cards Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Status 1: Camera Online */}
                <div className="bg-[#071f30] border border-teal-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-teal-400/50 transition-all shadow-sm">
                  <Video className="w-5 h-5 text-teal-400" />
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    Camera<br />Online
                  </p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                </div>

                {/* Status 2: Audio Active */}
                <div className="bg-[#071f30] border border-teal-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-teal-400/50 transition-all shadow-sm">
                  <Mic className="w-5 h-5 text-teal-400" />
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    Audio<br />Active
                  </p>
                  <span className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'}`}></span>
                </div>

                {/* Status 3: Secure Connection */}
                <div className="bg-[#071f30] border border-teal-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-teal-400/50 transition-all shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    Secure<br />Connection
                  </p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Cam Matrix Grid (Admin Only) ── */}
      {viewMode === 'matrix' && isAdminOrReception && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rooms.map(room => (
            <div
              key={room.roomId}
              className="bg-[#081827] rounded-2xl overflow-hidden border border-teal-900/50 shadow-xl relative group transition-all hover:border-teal-500/50"
            >
              <div className="p-3 bg-black/60 flex items-center justify-between text-white text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-bold">{room.name}</span>
                </div>
                <span className="text-slate-400">{room.roomNumber}</span>
              </div>
              <div className="aspect-video relative bg-slate-900 overflow-hidden">
                <img
                  src="/assets/images/daycare-sunshine-room.jpg"
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">
                  Camera 01
                </span>
              </div>
              <div className="p-3 bg-[#0b2438] flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Present: {room.enrolledCount || 8} Children</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomId(room.roomId);
                    setViewMode('single');
                  }}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-all cursor-pointer"
                >
                  Focus Feed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Bottom Footer Banner matching reference mockup ── */}
      <div className="bg-[#081d2e]/90 border border-teal-900/50 rounded-2xl px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-xl">
        {/* Left: Glowing Cyan Lock + Message */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-slate-300 font-medium text-xs leading-relaxed">
            Your assigned classroom is being monitored in real-time. &nbsp;|&nbsp; Keep children safe &nbsp;•&nbsp; Ensure a positive learning environment
          </p>
        </div>

        {/* Right: MinT ♡ brand typography */}
        <div className="text-right flex flex-col items-center md:items-end shrink-0">
          <div className="flex items-center gap-1 text-teal-400 font-serif text-lg font-bold tracking-wider leading-none">
            <span>MinT</span>
            <Heart className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20 stroke-teal-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-light">
            Together for a brighter tomorrow
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamMonitoring;
