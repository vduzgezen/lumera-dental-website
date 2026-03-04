// features/case-dashboard/components/ImageAnnotator.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ImageAnnotatorProps {
  file: File;
  onSave: (annotatedFile: File) => void;
  onCancel: () => void;
}

// Helper types to store drawing paths for Undo/Clear logic
type Point = { x: number; y: number };
type Stroke = Point[];

export default function ImageAnnotator({ file, onSave, onCancel }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Tool & Image State
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<'draw' | 'pan'>('draw');
  const [baseSize, setBaseSize] = useState({ w: 0, h: 0 });
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Stroke History State for Undo/Erase
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);

  // Redraw Function: Clears canvas, repaints the image, and replays all saved strokes
  const redrawCanvas = useCallback((overrideStrokes?: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Redraw all saved strokes
    const strokesToDraw = overrideStrokes || strokes;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ef4444"; // Tailwind red-500

    strokesToDraw.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  }, [baseImage, strokes]);

  // Load image onto canvas on initial mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      // Fit canvas to image aspect ratio within a max container
      const maxWidth = Math.min(1000, window.innerWidth - 64);
      const scale = maxWidth / img.width;
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      setBaseSize({ w: canvas.width, h: canvas.height });
      setBaseImage(img);
      
      // Draw initial image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
    };
  }, [file]);

  // Unified Interaction Handlers
  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'draw') {
      setIsDrawing(true);
      setCurrentStroke([]); // Start a fresh stroke path
      draw(e, true); // Pass true to force drawing an initial dot on click
    } else if (tool === 'pan') {
      const container = containerRef.current;
      if (!container) return;
      setIsPanning(true);
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      setPanStart({ 
        x: clientX, 
        y: clientY, 
        scrollLeft: container.scrollLeft, 
        scrollTop: container.scrollTop 
      });
    }
  };

  const stopInteraction = () => {
    if (tool === 'draw') {
      setIsDrawing(false);
      
      // Save the completed stroke to history if it has points
      if (currentStroke.length > 0) {
        setStrokes(prev => [...prev, currentStroke]);
        setCurrentStroke([]);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.beginPath(); // Reset path so lines don't connect
      }
    } else if (tool === 'pan') {
      setIsPanning(false);
    }
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'draw') {
      draw(e);
    } else if (tool === 'pan' && isPanning) {
      const container = containerRef.current;
      if (!container) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      // Calculate how far we dragged
      const dx = clientX - panStart.x;
      const dy = clientY - panStart.y;
      
      // Shift the container's scroll position inversely
      container.scrollLeft = panStart.scrollLeft - dx;
      container.scrollTop = panStart.scrollTop - dy;
    }
  };

  // The Drawing Logic
  const draw = (e: React.MouseEvent | React.TouchEvent, forceDrawing = false) => {
    if ((!isDrawing && !forceDrawing) || tool !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate coordinates based on the scaled CSS display size vs the actual Canvas resolution
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Add point to current stroke history
    setCurrentStroke(prev => [...prev, { x, y }]);

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ef4444"; // Tailwind red-500

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Undo Logic
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawCanvas(newStrokes);
  };

  // Erase/Clear Logic
  const handleEraseAll = () => {
    setStrokes([]);
    redrawCanvas([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], `annotated-${file.name}`, { type: "image/png" });
        onSave(newFile);
      }
    }, "image/png");
  };

  // Zoom Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setTool('draw'); // Reset to draw when zoomed out
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4">
      {/* Top Toolbar */}
      <div className="w-full max-w-5xl flex flex-wrap justify-between items-center mb-4 text-foreground gap-4">
        
        {/* Left Side: Title & Drawing/Pan Controls */}
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium hidden sm:block">Annotate Image</h3>
          
          {/* Tool Toggle */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 shadow-sm">
             <button 
               onClick={() => setTool('draw')} 
               className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-all duration-200 ${tool === 'draw' ? 'bg-[var(--accent-dim)] text-accent shadow-sm' : 'text-muted hover:bg-surface-highlight hover:text-foreground'}`}
             >
               Draw
             </button>
             <button 
               onClick={() => setTool('pan')} 
               className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-all duration-200 ${tool === 'pan' ? 'bg-[var(--accent-dim)] text-accent shadow-sm' : 'text-muted hover:bg-surface-highlight hover:text-foreground'}`}
             >
               Pan
             </button>
          </div>

          {/* Undo & Erase Controls */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 shadow-sm">
            <button 
              onClick={handleUndo} 
              disabled={strokes.length === 0}
              className="p-1.5 rounded text-muted hover:bg-[var(--accent-dim)] hover:text-foreground cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              title="Undo Last Stroke"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button 
              onClick={handleEraseAll} 
              disabled={strokes.length === 0}
              className="p-1.5 rounded text-muted hover:bg-red-500/10 hover:text-red-500 cursor-pointer border-l border-border ml-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              title="Clear All Annotations"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 shadow-sm">
            <button onClick={handleZoomOut} className="p-1.5 rounded hover:bg-[var(--accent-dim)] cursor-pointer transition-colors" title="Zoom Out">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
            </button>
            <span className="text-xs font-medium px-2 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 rounded hover:bg-[var(--accent-dim)] cursor-pointer transition-colors" title="Zoom In">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
            <button onClick={handleResetZoom} className="p-1.5 rounded hover:bg-[var(--accent-dim)] cursor-pointer text-xs font-medium px-3 border-l border-border ml-1 transition-colors" title="Reset Zoom">
              Reset
            </button>
          </div>
        </div>

        {/* Right Side: Save & Cancel */}
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border bg-surface hover:bg-[var(--accent-dim)] transition-colors shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!imageLoaded}
            className="px-6 py-2 rounded-lg font-bold transition-all shadow-sm bg-foreground text-background border-2 border-foreground hover:opacity-80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Annotation
          </button>
        </div>
      </div>

      {/* Canvas Container (Scrollable when zoomed) */}
      <div 
        ref={containerRef}
        className={`relative bg-surface rounded-lg shadow-2xl border border-border w-full max-w-5xl max-h-[75vh] overflow-auto custom-scrollbar ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {/* INNER WRAPPER: Forces expansion for proportional zooming */}
        <div className="flex items-center justify-center min-h-full min-w-full p-2">
          <div 
            className="relative transition-all duration-200"
            style={{ 
              width: baseSize.w ? `${baseSize.w * zoom}px` : 'auto', 
              height: baseSize.h ? `${baseSize.h * zoom}px` : 'auto',
              minWidth: baseSize.w ? `${baseSize.w * zoom}px` : 'auto',
              minHeight: baseSize.h ? `${baseSize.h * zoom}px` : 'auto'
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startInteraction}
              onMouseUp={stopInteraction}
              onMouseOut={stopInteraction}
              onMouseMove={handleInteractionMove}
              onTouchStart={startInteraction}
              onTouchEnd={stopInteraction}
              onTouchMove={handleInteractionMove}
              className={`block shadow-md ${tool === 'draw' ? 'cursor-crosshair' : ''}`}
              style={{ 
                width: '100%', 
                height: '100%',
                touchAction: tool === 'draw' ? 'none' : 'auto' // Prevents mobile scrolling while drawing
              }}
            />
          </div>
        </div>

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted bg-surface/80 backdrop-blur-sm z-10">
            Loading image...
          </div>
        )}
      </div>
      
      <p className="mt-4 text-muted text-sm text-center">
        {tool === 'draw' 
          ? "Draw Mode: Click and drag to annotate the image. Use the Undo and Clear buttons to correct mistakes."
          : "Pan Mode: Click and drag to navigate around the zoomed image."}
      </p>
    </div>
  );
}