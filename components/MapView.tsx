import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DisplaySubmission, VotingCategory } from '../types';
import { CATEGORY_COLORS, BLUFF_PARK_CENTER } from '../constants';

interface MapViewProps {
  submissions: DisplaySubmission[];
  onSelectDisplay: (display: DisplaySubmission) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

const MapView: React.FC<MapViewProps> = ({ submissions, onSelectDisplay }) => {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialViewCalculated, setIsInitialViewCalculated] = useState(false);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAP_SIZE = 2000;

  // Track user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn("Geolocation denied or unavailable"),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomSpeed = 0.0015;
    const delta = -e.deltaY;
    const newK = Math.min(Math.max(transform.k * (1 + delta * zoomSpeed), 0.3), 5);

    const ratio = newK / transform.k;
    const newX = mouseX - (mouseX - transform.x) * ratio;
    const newY = mouseY - (mouseY - transform.y) * ratio;

    setTransform({ x: newX, y: newY, k: newK });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const getMapPosition = (lat: number, lng: number) => {
    const latDiff = (lat - BLUFF_PARK_CENTER.lat) * 20000;
    const lngDiff = (lng - BLUFF_PARK_CENTER.lng) * 20000;
    return {
      x: MAP_SIZE / 2 + lngDiff,
      y: MAP_SIZE / 2 - latDiff
    };
  };

  const userMapPos = useMemo(() => userPos ? getMapPosition(userPos.lat, userPos.lng) : null, [userPos]);

  const submissionsWithPos = useMemo(() => {
    return submissions.map(s => ({
      ...s,
      pos: getMapPosition(s.lat, s.lng)
    }));
  }, [submissions]);

  const centerOnUser = () => {
    if (!userMapPos || !containerRef.current) return;
    const container = containerRef.current;
    const k = 2; // Zoom in
    const x = container.clientWidth / 2 - userMapPos.x * k;
    const y = container.clientHeight / 2 - userMapPos.y * k;
    setTransform({ x, y, k });
  };

  useEffect(() => {
    if (!containerRef.current || submissionsWithPos.length === 0 || isInitialViewCalculated) return;

    const container = containerRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    submissionsWithPos.forEach(({ pos }) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });
    
    const PADDING = 100;
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    if (boxWidth < 1 && boxHeight < 1) {
        setTransform({ x: containerWidth / 2 - minX * 1, y: containerHeight / 2 - minY * 1, k: 1 });
    } else {
        const scaleX = containerWidth / (boxWidth + PADDING * 2);
        const scaleY = containerHeight / (boxHeight + PADDING * 2);
        const initialK = Math.min(scaleX, scaleY, 2);
        const initialX = containerWidth / 2 - (minX + boxWidth / 2) * initialK;
        const initialY = containerHeight / 2 - (minY + boxHeight / 2) * initialK;
        setTransform({ x: initialX, y: initialY, k: initialK });
    }
    setIsInitialViewCalculated(true);
  }, [submissionsWithPos, isInitialViewCalculated]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#f8f9fa] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`absolute inset-0 origin-top-left ${isInitialViewCalculated ? 'transition-transform duration-75 ease-out' : ''}`}
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
      >
        <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} className="absolute top-0 left-0">
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#f1f3f4" />
          <path d="M0,400 Q400,350 800,450 T1600,400 T2000,500 L2000,0 L0,0 Z" fill="#abdcfb" />
          <circle cx="1500" cy="1500" r="150" fill="#abdcfb" />
          <rect x="200" y="800" width="400" height="300" rx="20" fill="#e8f5e9" />
          <defs>
            <pattern id="cityGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="90" height="90" x="5" y="5" fill="#ffffff" rx="4" />
            </pattern>
          </defs>
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#cityGrid)" opacity="0.5" />
          <g stroke="#ffffff" strokeWidth="12" fill="none" strokeLinecap="round">
            <path d="M0,1000 L2000,1000" stroke="#dee2e6" strokeWidth="16" />
            <path d="M1000,0 L1000,2000" stroke="#dee2e6" strokeWidth="16" />
          </g>
        </svg>

        {/* User Location Indicator */}
        {userMapPos && (
          <div 
            className="absolute z-20"
            style={{ 
              left: userMapPos.x, 
              top: userMapPos.y,
              transform: `translate(-50%, -50%) scale(${1 / transform.k})`,
            }}
          >
            <div className="relative">
              <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
        )}

        {submissionsWithPos.map((display) => (
          <div
            key={display.id}
            className="absolute z-10"
            style={{ 
              left: display.pos.x, 
              top: display.pos.y,
              transform: `translate(-50%, -100%) scale(${1 / transform.k})`,
              transformOrigin: 'bottom center'
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onSelectDisplay(display); }}
              className="relative group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                <img src={display.photos[0].url} alt="Display" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-red-600"></div>
            </button>
          </div>
        ))}
      </div>

      <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); centerOnUser(); }}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-all ${userPos ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-200'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setTransform(t => ({ ...t, k: Math.min(t.k + 0.5, 5) })); }}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 border border-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setTransform(t => ({ ...t, k: Math.max(t.k - 0.5, 0.5) })); }}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 border border-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
        </button>
      </div>
    </div>
  );
};

export default MapView;