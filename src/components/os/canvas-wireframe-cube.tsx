'use client';

import React, { useEffect, useRef } from 'react';

export function CanvasWireframeCube() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;

    // 8 Vertices of a 3D Cube
    const size = 65;
    const vertices = [
      [-size, -size, -size],
      [size, -size, -size],
      [size, size, -size],
      [-size, size, -size],
      [-size, -size, size],
      [size, -size, size],
      [size, size, size],
      [-size, size, size],
    ];

    // 12 Edges connecting vertices
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back face
      [4, 5], [5, 6], [6, 7], [7, 4], // Front face
      [0, 4], [1, 5], [2, 6], [3, 7], // Connecting edges
    ];

    // Inner cross / diagonal wireframe lines for technical aesthetic
    const innerDiagonals = [
      [0, 6], [1, 7], [2, 4], [3, 5]
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Rotation speeds
      angleX += 0.008;
      angleY += 0.012;
      angleZ += 0.005;

      const radX = angleX;
      const radY = angleY;
      const radZ = angleZ;

      // Rotate and Project Vertices
      const projected: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i < vertices.length; i++) {
        const [x, y, z] = vertices[i];

        // Rotate around X
        const y1 = y * Math.cos(radX) - z * Math.sin(radX);
        const z1 = y * Math.sin(radX) + z * Math.cos(radX);

        // Rotate around Y
        const x2 = x * Math.cos(radY) + z1 * Math.sin(radY);
        const z2 = -x * Math.sin(radY) + z1 * Math.cos(radY);

        // Rotate around Z
        const x3 = x2 * Math.cos(radZ) - y1 * Math.sin(radZ);
        const y3 = x2 * Math.sin(radZ) + y1 * Math.cos(radZ);

        // Weak Perspective Projection
        const fov = 260;
        const scale = fov / (fov + z2);
        projected.push({
          x: cx + x3 * scale,
          y: cy + y3 * scale,
          z: z2,
        });
      }

      // Draw subtle internal guide lines (Amber)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.setLineDash([3, 3]);
      for (const [start, end] of innerDiagonals) {
        ctx.beginPath();
        ctx.moveTo(projected[start].x, projected[start].y);
        ctx.lineTo(projected[end].x, projected[end].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Main Cube Edges (Terracotta #C2553A)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#C2553A';
      ctx.shadowColor = 'rgba(194, 85, 58, 0.6)';
      ctx.shadowBlur = 8;

      for (const [start, end] of edges) {
        ctx.beginPath();
        ctx.moveTo(projected[start].x, projected[start].y);
        ctx.lineTo(projected[end].x, projected[end].y);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Draw Vertex Dots
      for (const p of projected) {
        ctx.fillStyle = '#F59E0B'; // Amber dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw decorative coordinate axes crosshair in top-right
      ctx.strokeStyle = 'rgba(194, 85, 58, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 25, 15);
      ctx.lineTo(canvas.width - 10, 15);
      ctx.moveTo(canvas.width - 15, 10);
      ctx.lineTo(canvas.width - 15, 25);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[180px] bg-[#14110F] rounded-none border border-[#4A463F] overflow-hidden flex items-center justify-center">
      {/* Corner coordinate badge */}
      <div className="absolute top-2 left-2 font-mono text-[9px] text-[#C2553A] tracking-wider select-none">
        RENDER: 3D_WIREFRAME_AXIS
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#F59E0B]/70 select-none">
        ROTATION: X/Y/Z REALTIME
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={180}
        className="w-full h-full max-w-[320px] max-h-[180px]"
      />
    </div>
  );
}
