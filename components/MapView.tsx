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
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for our simulated local coordinate space
  // We'll treat our map as a 2000x2000 unit area
  const MAP_SIZE = 2000;

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newK = Math.min(Math.max(transform.k * (1 + delta * zoomSpeed), 0.5), 5);

    // Zoom relative to mouse position
    const ratio = newK / transform.k;
    const newX = mouseX - (mouseX - transform.x) * ratio;
    const newY = mouseY - (mouseY - transform.y) * ratio;

    setTransform({ x: newX, y: newY, k: newK });
  };

  // Handle Pan
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert "GPS" coords to our local map space
  // Bluff Park is roughly centered at 33.4005, -86.8486
  const getMapPosition = (lat: number, lng: number) => {
    const latDiff = (lat - BLUFF_PARK_CENTER.lat) * 20000; // Scaled for visibility
    const lngDiff = (lng - BLUFF_PARK_CENTER.lng) * 20000;
    
    // Y is inverted in screen space
    return {
      x: MAP_SIZE / 2 + lngDiff,
      y: MAP_SIZE / 2 - latDiff
    };
  };

  const submissionsWithPos = useMemo(() => {
    return submissions.map(s => ({
      ...s,
      pos: getMapPosition(s.lat, s.lng)
    }));
  }, [submissions]);

  useEffect(() => {
    if (!containerRef.current || submissionsWithPos.length === 0) return;

    const container = containerRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container;

    // 1. Calculate bounding box of all submissions
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    submissionsWithPos.forEach(({ pos }) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });
    
    // 2. Calculate scale and position to fit the box
    const PADDING = 150; // Add padding around the pins in map units
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    // Handle single point case
    if (boxWidth < 1 && boxHeight < 1) {
        const initialK = 1;
        const initialX = containerWidth / 2 - minX * initialK;
        const initialY = containerHeight / 2 - minY * initialK;
        setTransform({ x: initialX, y: initialY, k: initialK });
        setIsInitialViewCalculated(true);
        return;
    }

    const scaleX = containerWidth / (boxWidth + PADDING * 2);
    const scaleY = containerHeight / (boxHeight + PADDING * 2);
    const initialK = Math.min(scaleX, scaleY, 2); // Cap max initial zoom to 2

    const boxCenterX = minX + boxWidth / 2;
    const boxCenterY = minY + boxHeight / 2;

    const initialX = containerWidth / 2 - boxCenterX * initialK;
    const initialY = containerHeight / 2 - boxCenterY * initialK;

    setTransform({ x: initialX, y: initialY, k: initialK });
    setIsInitialViewCalculated(true);
  }, [submissionsWithPos]);

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
      {/* Map Layer */}
      <div 
        className={`absolute inset-0 origin-top-left ${isInitialViewCalculated ? 'transition-transform duration-75 ease-out' : ''}`}
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
      >
        {/* SVG Drawing of the "City" */}
        <svg 
          width={MAP_SIZE} 
          height={MAP_SIZE} 
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          className="absolute top-0 left-0"
        >
          {/* Base Land */}
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="#f1f3f4" />
          
          {/* Water Areas (Rivers/Lakes) */}
          <path d="M0,400 Q400,350 800,450 T1600,400 T2000,500 L2000,0 L0,0 Z" fill="#abdcfb" />
          <circle cx="1500" cy="1500" r="150" fill="#abdcfb" />

          {/* Parks / Greenery */}
          <rect x="200" y="800" width="400" height="300" rx="20" fill="#e8f5e9" />
          <path d="M1200,1000 Q1400,900 1600,1100 L1700,1400 Q1500,1500 1200,1400 Z" fill="#e8f5e9" />

          {/* City Blocks Background Grid */}
          <defs>
            <pattern id="cityGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="90" height="90" x="5" y="5" fill="#ffffff" rx="4" />
            </pattern>
          </defs>
          <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#cityGrid)" opacity="0.5" />

          {/* Main Roads */}
          <g stroke="#ffffff" strokeWidth="12" fill="none" strokeLinecap="round">
            <path d="M0,1000 L2000,1000" stroke="#dee2e6" strokeWidth="16" />
            <path d="M0,1000 L2000,1000" />
            
            <path d="M1000,0 L1000,2000" stroke="#dee2e6" strokeWidth="16" />
            <path d="M1000,0 L1000,2000" />
            
            <path d="M400,0 L400,2000" stroke="#dee2e6" strokeWidth="14" />
            <path d="M400,0 L400,2000" strokeWidth="10" />

            <path d="M0,1500 L2000,1500" stroke="#dee2e6" strokeWidth="14" />
            <path d="M0,1500 L2000,1500" strokeWidth="10" />
          </g>
        </svg>

        {/* Interactive Pins Layer */}
        {submissionsWithPos.map((display) => (
          <div
            key={display.id}
            className="absolute"
            style={{ 
              left: display.pos.x, 
              top: display.pos.y,
              transform: `translate(-50%, -100%) scale(${1 / transform.k})`, // Counter-scale pins so they don't get huge
              transformOrigin: 'bottom center'
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectDisplay(display);
              }}
              className="relative group focus:outline-none"
            >
              <div className="relative">
                {/* Pin Shape */}
                <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                  <img 
                    src={display.photos.find(p => p.isFeatured)?.url || display.photos[0].url} 
                    alt="Light display"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Pin Tip */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-red-600"></div>
                
                {/* Label (always visible or on hover) */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-white text-slate-900 rounded-lg shadow-2xl px-3 py-1.5 text-[10px] font-bold whitespace-nowrap border border-slate-100 opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="leading-tight">{display.address}</div>
                  <div className="text-red-500 font-black mt-0.5 flex items-center gap-1">
                    <span className="text-[8px]">✨</span> {display.totalVotes}
                  </div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Map Controls (Overlay) */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-30">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setTransform(t => ({ ...t, k: Math.min(t.k + 0.5, 5) }));
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 border border-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setTransform(t => ({ ...t, k: Math.max(t.k - 0.5, 0.5) }));
          }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 border border-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
        </button>
      </div>
    </div>
  );
};

export default MapView;