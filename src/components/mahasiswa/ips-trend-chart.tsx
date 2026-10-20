"use client";

import { useState } from "react";

export interface DataSemesterIps {
  semester: number;
  tahunAjaranKode: string;
  ips: number;
  sks: number;
}

interface IpsTrendChartProps {
  data: DataSemesterIps[];
}

export function IpsTrendChart({ data }: IpsTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
        Belum ada riwayat IPS semester
      </div>
    );
  }

  // Koordinat SVG
  const width = 280;
  const height = 75;
  const paddingX = 24;
  const paddingY = 14;

  const minIps = 2.0;
  const maxIps = 4.0;

  const getX = (index: number) => {
    if (data.length === 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    const clamped = Math.max(minIps, Math.min(maxIps, val));
    const ratio = (clamped - minIps) / (maxIps - minIps);
    return height - paddingY - ratio * (height - paddingY * 2);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.ips)}`).join(" ");

  // Area path untuk efek visual halus di bawah garis
  const firstX = getX(0);
  const lastX = getX(data.length - 1);
  const bottomY = height - 2;
  const areaPath = `M ${firstX},${bottomY} L ${firstX},${getY(data[0].ips)} ${data
    .slice(1)
    .map((d, i) => `L ${getX(i + 1)},${getY(d.ips)}`)
    .join(" ")} L ${lastX},${bottomY} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-muted-foreground">Tren IPS Semester</span>
        <span className="text-xs font-bold text-ink">
          Terakhir: {data[data.length - 1].ips.toFixed(2)}
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-[8px] bg-muted/40 p-2 border border-border/40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-16 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Garis batas acuan 3.00 & 4.00 */}
          <line
            x1={paddingX}
            y1={getY(3.0)}
            x2={width - paddingX}
            y2={getY(3.0)}
            stroke="var(--border-main)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={getY(4.0)}
            x2={width - paddingX}
            y2={getY(4.0)}
            stroke="var(--border-main)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Area bawah garis */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Garis tren utama */}
          <polyline
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Titik per semester */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.ips);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={d.semester}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 4}
                  fill="var(--bg-surface)"
                  stroke="var(--primary)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Baris label semester di bawah grafik */}
        <div className="flex justify-between items-center px-2 mt-1 text-xs text-muted-foreground font-medium">
          {data.map((d, i) => (
            <span
              key={d.semester}
              className={`transition-colors ${
                hoveredIdx === i ? "text-ink font-bold" : ""
              }`}
            >
              Sm.{d.semester} ({d.ips.toFixed(2)})
            </span>
          ))}
        </div>

        {/* Tooltip interaktif saat titik di-hover */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-1 right-2 bg-popover text-popover-foreground border border-border rounded-[6px] px-2 py-0.5 text-xs shadow-sm animate-fade-up pointer-events-none">
            <span className="font-semibold">Semester {data[hoveredIdx].semester}:</span>{" "}
            IPS <strong className="text-ink">{data[hoveredIdx].ips.toFixed(2)}</strong> ({data[hoveredIdx].sks} SKS)
          </div>
        )}
      </div>
    </div>
  );
}
