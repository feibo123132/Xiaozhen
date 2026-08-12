'use client';

import Image from 'next/image';
import React, { type ComponentType, type PointerEvent, useEffect, useRef, useState } from 'react';
import { classifyPointerIntent, fitWorldToViewport, panCamera, updatePinch, zoomAtPointer, type CameraState, type Point } from './camera-controller';
import { InteractionOverlay } from './interaction-overlay';
import type { PixiTownCanvasProps } from './pixi-town-canvas';
import type { TownWorry } from './town-scene';
import type { TownWorldModel } from './world-model';
import styles from './town-experience.module.css';

export type TownCanvasImporter = () => Promise<{ default: ComponentType<PixiTownCanvasProps> }>;
const productionImporter: TownCanvasImporter = () => import('./pixi-town-canvas').then((module) => ({ default: module.PixiTownCanvas }));

class CanvasBoundary extends React.Component<{ children: React.ReactNode; onError(): void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function TownExperience({ world, worries, canvasComponent, canvasImporter = productionImporter }: { world: TownWorldModel; worries: readonly TownWorry[]; canvasComponent?: ComponentType<PixiTownCanvasProps>; canvasImporter?: TownCanvasImporter }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const points = useRef(new Map<number, Point>());
  const dragStart = useRef<Point | null>(null);
  const suppressClickRef = useRef(false);
  const suppressionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPinch = useRef<readonly [Point, Point] | null>(null);
  const [camera, setCamera] = useState<CameraState | null>(null);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dragged, setDragged] = useState(false);
  const [loadedCanvas, setLoadedCanvas] = useState<ComponentType<PixiTownCanvasProps> | null>(() => canvasComponent ?? null);

  useEffect(() => { const node = viewportRef.current; if (!node) return; if (typeof IntersectionObserver === 'undefined') return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setEntered(true); }); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (canvasComponent || !entered) { setLoadedCanvas(() => canvasComponent ?? null); return; }
    let active = true;
    setLoadedCanvas(null);
    void canvasImporter().then(
      ({ default: component }) => { if (active) setLoadedCanvas(() => component); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, [attempt, canvasComponent, canvasImporter, entered]);
  useEffect(() => { const node = viewportRef.current; if (!node) return; const measure = () => { if (node.clientWidth <= 0 || node.clientHeight <= 0) return; setCamera((current) => { if (!current) return fitWorldToViewport(node.clientWidth, node.clientHeight); if (current.viewportWidth === node.clientWidth && current.viewportHeight === node.clientHeight) return current; const fit = fitWorldToViewport(node.clientWidth, node.clientHeight); return zoomAtPointer(fit, { x: node.clientWidth / 2, y: node.clientHeight / 2 }, current.zoom); }); }; if (typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(measure); observer.observe(node); measure(); return () => observer.disconnect(); }, []);
  useEffect(() => () => { if (suppressionTimer.current) clearTimeout(suppressionTimer.current); }, []);

  function localPoint(event: PointerEvent<HTMLDivElement>): Point { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function firstTwo(): [Point, Point] | null { const values = [...points.current.values()]; return values.length >= 2 ? [values[0], values[1]] : null; }
  function pointerDown(event: PointerEvent<HTMLDivElement>) { const point = localPoint(event); points.current.set(event.pointerId, point); dragStart.current ??= point; event.currentTarget.setPointerCapture?.(event.pointerId); if (points.current.size >= 2) { previousPinch.current = firstTwo(); suppressClickRef.current = true; setDragged(true); } }
  function pointerMove(event: PointerEvent<HTMLDivElement>) { if (!points.current.has(event.pointerId)) return; const previous = points.current.get(event.pointerId)!; const next = localPoint(event); points.current.set(event.pointerId, next); if (points.current.size >= 2) { const currentPinch = firstTwo(); if (previousPinch.current && currentPinch) setCamera((current) => current ? updatePinch(current, previousPinch.current!, currentPinch) : current); previousPinch.current = currentPinch; suppressClickRef.current = true; setDragged(true); return; } setCamera((current) => current ? panCamera(current, next.x - previous.x, next.y - previous.y) : current); if (dragStart.current && classifyPointerIntent(dragStart.current, next) === 'drag') { setDragged(true); suppressClickRef.current = true; } }
  function pointerUp(event: PointerEvent<HTMLDivElement>) { points.current.delete(event.pointerId); previousPinch.current = firstTwo(); if (points.current.size === 0) { dragStart.current = null; setDragged(false); if (suppressionTimer.current) clearTimeout(suppressionTimer.current); suppressionTimer.current = setTimeout(() => { suppressClickRef.current = false; }, 250); } }

  return <section className={styles.shell} aria-label="解忧小镇地图"><div className={styles.toolbar} aria-label="地图控制"><button type="button" onClick={() => camera && setCamera(zoomAtPointer(camera, { x: camera.viewportWidth / 2, y: camera.viewportHeight / 2 }, camera.zoom * 1.2))}>放大</button><button type="button" onClick={() => camera && setCamera(zoomAtPointer(camera, { x: camera.viewportWidth / 2, y: camera.viewportHeight / 2 }, camera.zoom / 1.2))}>缩小</button><button type="button" onClick={() => { const node = viewportRef.current; if (node) setCamera(fitWorldToViewport(node.clientWidth, node.clientHeight)); }}>回到全景</button><a href="#town-list">切换为列表</a></div>
    <div ref={viewportRef} className={styles.viewport} onClickCapture={(event) => { if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false; if (suppressionTimer.current) clearTimeout(suppressionTimer.current); } }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={(event) => { event.preventDefault(); if (camera) { const rect = event.currentTarget.getBoundingClientRect(); setCamera(zoomAtPointer(camera, { x: event.clientX - rect.left, y: event.clientY - rect.top }, camera.zoom * (event.deltaY > 0 ? .9 : 1.1))); } }}>
      <Image className={styles.poster} src="/town/pixel/v2/poster.png" alt="解忧小镇地图预览" width={1536} height={864} priority />
      {!entered || !camera ? <p className={styles.loading}>地图正在醒来</p> : null}
      {entered && camera && loadedCanvas && !error ? <CanvasBoundary key={attempt} onError={() => setError(true)}>{React.createElement(loadedCanvas, { world, camera, mode: 'public', onError: () => setError(true) })}</CanvasBoundary> : null}
      {camera ? <InteractionOverlay world={world} worries={worries} camera={camera} onCameraChange={setCamera} /> : null}
      {error ? <button className={styles.retry} type="button" onClick={() => { setError(false); setAttempt((value) => value + 1); }}>重试加载地图</button> : null}
    </div></section>;
}
