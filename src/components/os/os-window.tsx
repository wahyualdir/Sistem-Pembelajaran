'use client';

import React, { useState } from 'react';

export interface OSWindowProps {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  statusText?: string;
  isActive?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  children: React.ReactNode;
  className?: string;
  initialCollapsed?: boolean;
  defaultMaximized?: boolean;
  bodyClassName?: string;
}

export function OSWindow({
  id,
  title,
  icon,
  statusText,
  isActive = true,
  onClose,
  onMinimize,
  onMaximize,
  children,
  className = '',
  initialCollapsed = false,
  defaultMaximized = false,
  bodyClassName = '',
}: OSWindowProps) {
  const [isMinimized, setIsMinimized] = useState(initialCollapsed);
  const [isMaximized, setIsMaximized] = useState(defaultMaximized);
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) return null;

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsClosed(true);
    }
  };

  return (
    <div
      id={id}
      className={`vt-window rounded-none flex flex-col transition-all duration-150 ${
        isMaximized ? 'w-full' : ''
      } ${className}`}
    >
      {/* Title Bar (Velqora Signature Terracotta Gradient) */}
      <div
        className={`px-2.5 py-1 flex items-center justify-between select-none cursor-default ${
          isActive ? 'vt-titlebar' : 'vt-titlebar-inactive'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {icon && <span className="flex-shrink-0 text-sm text-[#FDE68A]">{icon}</span>}
          <span className="font-mono text-xs font-bold tracking-wide text-white truncate uppercase shadow-xs">
            {title}
          </span>
        </div>

        {/* Retro Window Controls: _ , □ , × */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleMinimize}
            aria-label="Minimize window"
            title="Minimize"
            className="vt-window-btn"
          >
            _
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            aria-label="Maximize window"
            title="Maximize"
            className="vt-window-btn font-sans"
          >
            {isMaximized ? '❐' : '□'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close window"
            title="Close"
            className="vt-window-btn vt-window-btn-close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Window Body */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FFFFFF]">
          {/* Main Content Area */}
          <div className={`flex-1 overflow-auto ${bodyClassName}`}>{children}</div>

          {/* Retro Inset Status Bar */}
          {statusText && (
            <div className="px-3 py-1 bg-[#ECE9D8] border-t-2 border-[#FFFFFF] flex items-center justify-between text-[11px] font-mono text-[#57534E] select-none shrink-0">
              <span className="flex items-center gap-1.5 truncate pr-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                {statusText}
              </span>
              <span className="text-[#8A857D] hidden sm:inline shrink-0">RUANGKAMPUS_OS · 64-BIT</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
