import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';
import {
  Video,
  VideoOff,
  ShieldCheck,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  RefreshCw,
  Grid,
  Square,
  Users,
  Baby,
  Clock,
  Activity,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ZoomIn,
  ZoomOut,
  Lock,
  Moon,
  Sun,
  ShieldAlert,
  ChevronRight,
  Download,
  Check
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

  // UI & View modes
  // Admin & Reception can toggle between 'single' and 'matrix' (grid)
  const [viewMode, setViewMode] = useState('single'); 
  const [nightVision, setNightVision] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAngle, setActiveAngle] = useState('Main Play Area');
  const [streamHealth, setStreamHealth] = useState('Excellent (30 FPS • 4.5 Mbps)');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshots, setSnapshots] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [activeCustomUrl, setActiveCustomUrl] = useState('');

  // Refs
  const playerContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Live real-time clock ticker (every second)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch permitted rooms based on role
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/live-stream/rooms');
      if (res.data.success) {
        const roomList = res.data.data || [];
        setRooms(roomList);
        if (roomList.length > 0) {
          // If current selected room is not in list, select the first available
          if (!selectedRoomId || !roomList.find(r => r.roomId === selectedRoomId)) {
            setSelectedRoomId(roomList[0].roomId);
            if (roomList[0].activeAngle) setActiveAngle(roomList[0].activeAngle);
          }
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

  // Toggle Camera Privacy Mode (Admin, Reception, or assigned Nanny)
  const handleTogglePrivacy = async (roomId, currentPrivacy) => {
    try {
      const res = await api.put(`/live-stream/rooms/${roomId}/settings`, {
        privacyMode: !currentPrivacy
      });
      if (res.data.success) {
        setRooms(prev => prev.map(r => r.roomId === roomId ? { ...r, privacyMode: !currentPrivacy } : r));
        setActionSuccess(!currentPrivacy ? 'Privacy mode enabled (Camera feed masked)' : 'Privacy mode disabled (Live stream restored)');
        setTimeout(() => setActionSuccess(''), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update camera privacy settings.');
    }
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

  // Realistic Interactive CCTV Daycare Simulation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRoom || selectedRoom.privacyMode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let kids = [
      { x: 140, y: 220, dx: 0.4, dy: 0.2, color: '#38bdf8', label: 'Liam', toy: 'blocks' },
      { x: 380, y: 250, dx: -0.3, dy: 0.3, color: '#f43f5e', label: 'Emma', toy: 'crayons' },
      { x: 260, y: 190, dx: 0.2, dy: -0.3, color: '#10b981', label: 'Noah', toy: 'puzzle' },
      { x: 480, y: 210, dx: -0.2, dy: -0.2, color: '#fbbf24', label: 'Sophia', toy: 'teddy' },
    ];

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Background Classroom Environment
      const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
      if (nightVision) {
        bgGradient.addColorStop(0, '#02180c');
        bgGradient.addColorStop(1, '#052b14');
      } else {
        bgGradient.addColorStop(0, '#1a2233');
        bgGradient.addColorStop(0.6, '#111827');
        bgGradient.addColorStop(1, '#0b0f19');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // Floor perspective
      ctx.fillStyle = nightVision ? 'rgba(0, 50, 20, 0.4)' : 'rgba(30, 41, 59, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Play Rug (round circular mat)
      ctx.save();
      ctx.translate(w / 2, h * 0.7);
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.fillStyle = nightVision ? 'rgba(20, 90, 40, 0.3)' : 'rgba(14, 165, 233, 0.15)';
      ctx.fill();
      ctx.strokeStyle = nightVision ? 'rgba(40, 160, 60, 0.4)' : 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Window / Daycare wall decor
      ctx.fillStyle = nightVision ? 'rgba(40, 140, 60, 0.2)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(w * 0.08, h * 0.12, 100, 70);
      ctx.strokeStyle = nightVision ? '#15803d' : '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.08, h * 0.12, 100, 70);

      // Chalkboard on wall
      ctx.fillStyle = nightVision ? '#042f1a' : '#064e3b';
      ctx.fillRect(w * 0.35, h * 0.08, 160, 60);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(w * 0.35, h * 0.08, 160, 60);
      ctx.fillStyle = nightVision ? '#4ade80' : '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`WELCOME TO ${selectedRoom.name.toUpperCase()}`, w * 0.37, h * 0.14);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = nightVision ? '#86efac' : '#94a3b8';
      ctx.fillText(`Theme: Creativity & Play • Circle Time`, w * 0.37, h * 0.20);

      // Bookshelf / Toy Cubbies
      ctx.fillStyle = nightVision ? 'rgba(10, 60, 25, 0.6)' : 'rgba(71, 85, 105, 0.4)';
      ctx.fillRect(w * 0.78, h * 0.15, 90, 130);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          ctx.fillStyle = nightVision ? 'rgba(34, 197, 94, 0.3)' : ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7', '#10b981', '#f97316'][(row * 2 + col) % 6];
          ctx.fillRect(w * 0.79 + col * 40, h * 0.18 + row * 40, 32, 28);
        }
      }

      // Teacher / Nanny Avatar Figure (standing near the center)
      const teacherX = w * 0.68;
      const teacherY = h * 0.52;
      // Shadow
      ctx.beginPath();
      ctx.ellipse(teacherX, teacherY + 52, 22, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      // Body
      ctx.fillStyle = nightVision ? '#15803d' : '#00ADB5';
      ctx.beginPath();
      ctx.arc(teacherX, teacherY + 25, 16, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = nightVision ? '#86efac' : '#fde047';
      ctx.beginPath();
      ctx.arc(teacherX, teacherY, 11, 0, Math.PI * 2);
      ctx.fill();
      // Teacher tag
      ctx.fillStyle = nightVision ? '#22c55e' : '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`Nanny: ${selectedRoom.teacher?.fullName?.split(' ')[0] || 'Teacher'}`, teacherX - 25, teacherY - 16);

      // Render Children moving smoothly
      kids.forEach((child, idx) => {
        // Move with bounce
        child.x += child.dx;
        child.y += child.dy;
        if (child.x < 100 || child.x > w - 160) child.dx *= -1;
        if (child.y < h * 0.48 || child.y > h * 0.85) child.dy *= -1;

        const bob = Math.sin((frameCount + idx * 25) * 0.08) * 2;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(child.x, child.y + 26, 12, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();

        // Kid body
        ctx.fillStyle = nightVision ? '#22c55e' : child.color;
        ctx.beginPath();
        ctx.arc(child.x, child.y + 12 + bob, 10, 0, Math.PI * 2);
        ctx.fill();

        // Kid head
        ctx.fillStyle = nightVision ? '#86efac' : '#fed7aa';
        ctx.beginPath();
        ctx.arc(child.x, child.y + bob, 7, 0, Math.PI * 2);
        ctx.fill();

        // Motion bounding box (CCTV AI recognition box)
        ctx.strokeStyle = nightVision ? 'rgba(74, 222, 128, 0.4)' : 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(child.x - 14, child.y - 12 + bob, 28, 42);
        ctx.setLineDash([]);

        // Kid name tag
        ctx.fillStyle = nightVision ? '#bbf7d0' : '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText(child.label, child.x - 10, child.y - 16 + bob);
      });

      // Subtle CCTV scanlines effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let i = 0; i < h; i += 4) {
        ctx.fillRect(0, i, w, 1);
      }

      // Authentic Crosshair Grid in center
      ctx.strokeStyle = nightVision ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Center cross
      ctx.moveTo(w / 2 - 12, h / 2);
      ctx.lineTo(w / 2 + 12, h / 2);
      ctx.moveTo(w / 2, h / 2 - 12);
      ctx.lineTo(w / 2, h / 2 + 12);
      // Corner brackets
      const bSize = 16;
      // Top left
      ctx.moveTo(20, 20 + bSize); ctx.lineTo(20, 20); ctx.lineTo(20 + bSize, 20);
      // Top right
      ctx.moveTo(w - 20 - bSize, 20); ctx.lineTo(w - 20, 20); ctx.lineTo(w - 20, 20 + bSize);
      // Bottom left
      ctx.moveTo(20, h - 20 - bSize); ctx.lineTo(20, h - 20); ctx.lineTo(20 + bSize, h - 20);
      // Bottom right
      ctx.moveTo(w - 20 - bSize, h - 20); ctx.lineTo(w - 20, h - 20); ctx.lineTo(w - 20, h - 20 - bSize);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [selectedRoom, nightVision]);

  // Take Snapshot from Canvas and Download
  const handleTakeSnapshot = () => {
    if (!canvasRef.current || !selectedRoom) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const filename = `Mint-Daycare-${selectedRoom.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setSnapshots(prev => [{ id: Date.now(), url: dataUrl, room: selectedRoom.name, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 5)]);
      setActionSuccess('Snapshot captured and downloaded successfully!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Snapshot failed:', err);
    }
  };

  // Check role authorizations
  const isAdminOrReception = user?.role === 'admin' || user?.role === 'reception';
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* ── Top Header & Status Bar ── */}
      <div className="bg-white dark:bg-[#111c2d] rounded-2xl p-5 border border-slate-200 dark:border-teal-900/30 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                  {t('liveStream') || 'Real-time Live Video Streaming'}
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdminOrReception && 'Full Daycare Campus Monitoring (All Classrooms Authorized)'}
                {isTeacher && `Assigned Classroom Feed: ${selectedRoom?.name || 'Your Assigned Room'}`}
                {isParent && 'Secure Child Protection Feed (Only Enrolled Child Classroom Accessible)'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Status Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Real-time Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Admin / Reception Matrix Grid Toggle */}
          {isAdminOrReception && rooms.length > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'single' ? 'bg-white dark:bg-teal-600 text-teal-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                title="Single Camera Focus View"
              >
                <Square className="w-3.5 h-3.5" />
                Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'matrix' ? 'bg-white dark:bg-teal-600 text-teal-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                title="Multi-Cam Matrix Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                Multi-Cam ({rooms.length})
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchRooms}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Refresh Camera Streams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Empty State Handling for Roles without assigned rooms ── */}
      {!loading && rooms.length === 0 && (
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            {isTeacher && 'No Classroom Assigned to Your Profile'}
            {isParent && 'Your Child Is Not Yet Assigned to a Classroom'}
            {isAdminOrReception && 'No Active Classrooms Found'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {isTeacher && 'You only have permission to view your assigned classroom feed. Please contact the Daycare Administrator or Reception to assign you to a classroom.'}
            {isParent && 'Parents can only view live camera streams of the specific room where their enrolled child is placed. Once your child is approved and assigned to a classroom, the live video stream will automatically appear here.'}
            {isAdminOrReception && 'Please create and activate classrooms in the Admin Portal to enable live video streams.'}
          </p>
          <button
            onClick={fetchRooms}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            Check Again
          </button>
        </div>
      )}

      {/* ── Main Streaming Interface (When Rooms Exist) ── */}
      {!loading && rooms.length > 0 && (
        <>
          {/* Room Selector Pills (For Admin/Reception or Parents with multiple children in multiple rooms) */}
          {rooms.length > 1 && viewMode === 'single' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {rooms.map(room => {
                const isSelected = room.roomId === selectedRoom?.roomId;
                return (
                  <button
                    key={room.roomId}
                    type="button"
                    onClick={() => {
                      setSelectedRoomId(room.roomId);
                      if (room.activeAngle) setActiveAngle(room.activeAngle);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${isSelected ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/20' : 'bg-white dark:bg-[#111c2d] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-teal-500/50'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${room.privacyMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    <span>{room.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                      {room.roomNumber}
                    </span>
                    {isParent && room.myChildren?.length > 0 && (
                      <span className="text-[10px] font-normal opacity-90">
                        ({room.myChildren.map(c => c.firstName).join(', ')})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ════ VIEW MODE 1: SINGLE FOCUS MONITOR ════ */}
          {viewMode === 'single' && selectedRoom && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: The Live Video Player & Controls */}
              <div className="lg:col-span-2 space-y-4">
                <div
                  ref={playerContainerRef}
                  className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none aspect-video flex items-center justify-center"
                >
                  {/* Privacy Mode Overlay */}
                  {selectedRoom.privacyMode ? (
                    <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
                        <EyeOff className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold">Privacy Shield Active</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        Live camera stream for <strong>{selectedRoom.name}</strong> is temporarily hidden for children's privacy (nap time or diaper changing).
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
                  ) : activeCustomUrl ? (
                    /* Optional External RTSP / HLS stream if configured */
                    <video
                      src={activeCustomUrl}
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Premium Canvas-Rendered Live CCTV Feed */
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        filter: nightVision ? 'invert(10%) contrast(150%) hue-rotate(90deg)' : 'none'
                      }}
                    />
                  )}

                  {/* Top CCTV HUD Overlay */}
                  <div className="absolute top-0 left-0 right-0 p-3 lg:p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none text-white text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        REC
                      </span>
                      <span className="font-bold tracking-wider">{selectedRoom.cameraId}</span>
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="text-slate-300 hidden sm:inline">{selectedRoom.name.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                      {nightVision && (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Moon className="w-3 h-3" /> IR NIGHT
                        </span>
                      )}
                      <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {currentTime.toTimeString().split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Security Watermark for Parents (Standard Daycare Security Practice) */}
                  {isParent && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-25">
                      <p className="text-white text-xs md:text-sm font-mono tracking-widest transform -rotate-12 select-none text-center">
                        MINT DAYCARE SECURE FEED • {user.fullName?.toUpperCase()} • {currentTime.toISOString().split('T')[0]}
                      </p>
                    </div>
                  )}

                  {/* Bottom CCTV HUD Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 flex items-center justify-between z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-xs">
                    <div className="flex items-center gap-3">
                      {/* Audio Monitor Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center gap-1.5 cursor-pointer"
                        title={isMuted ? 'Unmute Audio Monitor' : 'Mute Audio'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />}
                        <span className="hidden sm:inline text-[11px] font-mono">{isMuted ? 'MUTED' : 'AUDIO 34dB'}</span>
                      </button>

                      {/* Night Vision IR Toggle */}
                      <button
                        type="button"
                        onClick={() => setNightVision(!nightVision)}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${nightVision ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        title="Toggle Infrared Night Vision"
                      >
                        {nightVision ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        <span className="hidden sm:inline text-[11px]">Night Vision</span>
                      </button>

                      {/* Zoom Controls */}
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
                          disabled={zoomLevel <= 1}
                          className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-40 cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono px-1">{zoomLevel.toFixed(1)}x</span>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                          disabled={zoomLevel >= 2}
                          className="p-1 rounded hover:bg-white/20 text-white disabled:opacity-40 cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Take Snapshot Button */}
                      <button
                        type="button"
                        onClick={handleTakeSnapshot}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 font-medium transition-all shadow-sm cursor-pointer"
                        title="Capture Instant High-Res Snapshot"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-sans">{isParent ? 'Save Memory' : 'Snapshot'}</span>
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                        title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stream Sub-Controls: Angles & Privacy Toggle */}
                <div className="bg-white dark:bg-[#111c2d] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Camera Angle:</span>
                    {['Main Play Area', 'Activity Corner', 'Reading Circle', 'Nap & Rest Zone'].map(angle => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() => setActiveAngle(angle)}
                        className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${activeAngle === angle ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-700/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                      >
                        {angle}
                      </button>
                    ))}
                  </div>

                  {(isAdminOrReception || isTeacher) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePrivacy(selectedRoom.roomId, selectedRoom.privacyMode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all border cursor-pointer ${selectedRoom.privacyMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50'}`}
                      >
                        {selectedRoom.privacyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{selectedRoom.privacyMode ? 'Disable Privacy Mask' : 'Activate Privacy Mask'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Room Telemetry & Role Insights */}
              <div className="space-y-4">
                {/* 1. Room Information Card */}
                <div className="bg-white dark:bg-[#111c2d] rounded-2xl p-5 border border-slate-200 dark:border-teal-900/30 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedRoom.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
                          {selectedRoom.roomNumber}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedRoom.ageGroup} Group</p>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-emerald-500 font-bold">● ONLINE</span>
                      <p className="text-[10px] text-slate-400">1080p • 30fps</p>
                    </div>
                  </div>

                  {/* Nanny on Duty */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {selectedRoom.teacher?.fullName?.slice(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-medium">Nanny on Duty</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {selectedRoom.teacher?.fullName || 'Assigned Caregiver'}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  {/* Room Environment & IoT Sensors */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <p className="text-slate-400 text-[11px]">Room Temp</p>
                      <p className="font-bold text-sm mt-0.5 text-slate-800 dark:text-white">
                        {selectedRoom.telemetry?.temperature || '22.0°C'}
                      </p>
                      <span className="text-[10px] text-emerald-500 font-medium">Optimal Comfort</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <p className="text-slate-400 text-[11px]">Humidity</p>
                      <p className="font-bold text-sm mt-0.5 text-slate-800 dark:text-white">
                        {selectedRoom.telemetry?.humidity || '45%'}
                      </p>
                      <span className="text-[10px] text-teal-500 font-medium">Healthy Air</span>
                    </div>
                  </div>

                  {/* Capacity & Attendance Count */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-400">Classroom Occupancy</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">
                        {selectedRoom.enrolledCount} / {selectedRoom.capacity} Children
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-500 flex items-center justify-center font-bold text-xs text-teal-600 dark:text-teal-400">
                      {Math.round((selectedRoom.enrolledCount / (selectedRoom.capacity || 15)) * 100)}%
                    </div>
                  </div>
                </div>

                {/* 2. Parent-Specific Card: "My Child in this Classroom" */}
                {isParent && (
                  <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent dark:bg-[#111c2d] rounded-2xl p-5 border border-teal-500/30 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                      <Baby className="w-4 h-4" />
                      <span>Your Enrolled Child</span>
                    </div>

                    {selectedRoom.myChildren && selectedRoom.myChildren.length > 0 ? (
                      selectedRoom.myChildren.map(child => (
                        <div key={child._id} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-teal-500/20 shadow-xs flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold text-sm">
                            {child.firstName[0]}{child.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Present • Circle & Sensory Play
                            </p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Present in room" />
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">
                        Your registered child is assigned to this classroom.
                      </p>
                    )}

                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Encrypted 256-bit parent-only stream
                      </p>
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                        Watermarked with your identity for child safety
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Nanny-Specific Card: Roster in Room */}
                {isTeacher && (
                  <div className="bg-white dark:bg-[#111c2d] rounded-2xl p-5 border border-slate-200 dark:border-teal-900/30 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-500" />
                        <span>Room Attendance Roster</span>
                      </h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                        {selectedRoom.visibleChildren?.length || 0} Present
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedRoom.visibleChildren && selectedRoom.visibleChildren.length > 0 ? (
                        selectedRoom.visibleChildren.map(c => (
                          <div key={c._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {c.firstName} {c.lastName}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Checked In
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 py-2 text-center">No children currently checked into this room.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ VIEW MODE 2: MULTI-CAM MATRIX GRID (Admin & Reception Only) ════ */}
          {viewMode === 'matrix' && isAdminOrReception && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Monitoring {rooms.length} Active Classroom Cameras Simultaneously</span>
                <span className="font-mono text-emerald-500 font-bold">ALL FEEDS SYNCHRONIZED (30 FPS)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {rooms.map(room => (
                  <div
                    key={room.roomId}
                    className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative group transition-all hover:border-teal-500/50"
                  >
                    {/* Camera Header */}
                    <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white text-xs z-10 relative font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-bold">{room.cameraId}</span>
                        <span className="text-slate-400">• {room.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{room.roomNumber}</span>
                    </div>

                    {/* Camera Body */}
                    <div className="aspect-video relative bg-slate-900 flex items-center justify-center">
                      {room.privacyMode ? (
                        <div className="text-center p-4 text-slate-400">
                          <EyeOff className="w-8 h-8 mx-auto mb-1 text-amber-500" />
                          <p className="text-xs font-bold text-white">Privacy Active</p>
                          <p className="text-[10px]">Camera masked</p>
                        </div>
                      ) : (
                        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center">
                          {/* Crosshair */}
                          <div className="w-6 h-6 border border-white/20 rounded-full flex items-center justify-center">
                            <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                          </div>
                          <p className="text-xs text-slate-300 font-bold mt-2">{room.name}</p>
                          <p className="text-[10px] text-slate-500">{room.enrolledCount} Children • Nanny: {room.teacher?.fullName?.split(' ')[0] || 'Unassigned'}</p>
                          <span className="text-[9px] font-mono text-emerald-400 mt-1">● 1080p HD • LIVE</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Footer */}
                    <div className="p-2.5 bg-slate-900/90 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Temp: {room.telemetry?.temperature || '22°C'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePrivacy(room.roomId, room.privacyMode)}
                          className={`p-1.5 rounded-lg text-xs transition-all ${room.privacyMode ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                          title="Toggle Privacy Mode"
                        >
                          {room.privacyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoomId(room.roomId);
                            setViewMode('single');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-all"
                        >
                          Focus Stream
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveStreamMonitoring;
