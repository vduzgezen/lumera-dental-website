// portal/components/ImageAnnotator.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface ImageAnnotatorProps {
  file: File;
  onSave: (annotatedFile: File) => void;
  onCancel: () => void;
}

export default function ImageAnnotator({ file, onSave, onCancel }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      // Fit canvas to image aspect ratio within a max container
      const maxWidth = Math.min(800, window.innerWidth - 64);
      const scale = maxWidth / img.width;
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Draw initial image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
    };
  }, [file]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath(); // Reset path so lines don't connect
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate coordinates
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ef4444"; // Tailwind red-500

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-4">
      {/* Toolbar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 text-foreground">
        <h3 className="text-lg font-medium">Draw on Image</h3>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg hover:bg-[var(--accent-dim)] transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!imageLoaded}
            className="px-6 py-2 bg-accent hover:bg-accent/80 rounded-lg font-bold text-white transition"
          >
            Save Annotation
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative bg-surface rounded-lg overflow-hidden shadow-2xl border border-border"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="cursor-crosshair block"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            Loading image...
          </div>
        )}
      </div>
      
      <p className="mt-4 text-muted text-sm">
        Click and drag to draw. Ideal for marking margins or contacts.
      </p>
    </div>
  );
}