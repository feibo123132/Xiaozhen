'use client';

import type { PointerEvent, ReactNode, WheelEvent } from 'react';
import { useRef, useState } from 'react';

import { usePanZoom } from './use-pan-zoom';

export function TownViewport({ children }: { children: ReactNode }) {
  const [view, dispatch] = usePanZoom();
  const [dragging, setDragging] = useState(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    setDragging(true);
    lastPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    dispatch({ type: 'pan', dx: event.clientX - lastPoint.current.x, dy: event.clientY - lastPoint.current.y });
    lastPoint.current = { x: event.clientX, y: event.clientY };
  }

  function zoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    dispatch({ type: 'zoom', factor: event.deltaY > 0 ? 0.9 : 1.1 });
  }

  return (
    <div className="town-viewport-wrap">
      <div className="town-toolbar" aria-label="地图控制">
        <button type="button" onClick={() => dispatch({ type: 'zoom', factor: 1.2 })} aria-label="放大地图">＋</button>
        <button type="button" onClick={() => dispatch({ type: 'zoom', factor: 0.8 })} aria-label="缩小地图">－</button>
        <button type="button" onClick={() => dispatch({ type: 'reset' })}>回到全景</button>
        <a href="#town-list">切换为列表</a>
      </div>
      <div
        className={`town-viewport${dragging ? ' is-dragging' : ''}`}
        aria-label="解忧小镇地图"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onWheel={zoom}
      >
        <div className="town-scene-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
