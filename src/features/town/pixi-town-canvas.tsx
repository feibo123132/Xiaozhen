'use client';

import { Application as ManagedApplication, extend } from '@pixi/react';
import {
  Application as PixiApplication,
  Container,
  Sprite,
  Texture,
  type ApplicationOptions,
} from 'pixi.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import manifestJson from '../../../public/town/pixel/v2/manifest.json';
import { parseTownAssetManifest, type TownAssetManifest } from './asset-manifest';
import { acquireAtlasTexture } from './scene/atlas-resource';
import { TownStage, type TownRenderMode } from './scene/town-stage';
import type { TownCameraView, TownWorldModel } from './world-model';

extend({ Container, Sprite });

const manifest = parseTownAssetManifest(manifestJson);
const atlas = manifest.atlases.graybox;
const preflights = new Map<string, Promise<void>>();

export type PixiTownCanvasProps = {
  world: TownWorldModel;
  camera: TownCameraView;
  mode: TownRenderMode;
  onError?: (error: Error) => void;
};

type ErrorBoundaryProps = { children: React.ReactNode; onError: (error: Error) => void };

class PixiChildRenderBoundary extends React.Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

function asError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

function rendererOptions(resolution: number): Partial<ApplicationOptions> {
  return {
    antialias: false,
    backgroundAlpha: 0,
    resolution,
    autoStart: true,
    sharedTicker: false,
  };
}

function preflightRenderer(resolution: number): Promise<void> {
  const signature = `default:${resolution}`;
  const cached = preflights.get(signature);
  if (cached) return cached;

  const promise = (async () => {
    const app = new PixiApplication();
    try {
      await app.init({ ...rendererOptions(resolution), width: 1, height: 1 });
    } finally {
      if (app.renderer) {
        app.destroy({ removeView: true, releaseGlobalResources: false }, { children: true });
      } else {
        app.stage?.destroy({ children: true });
      }
    }
  })();
  preflights.set(signature, promise);
  void promise.catch(() => {
    if (preflights.get(signature) === promise) preflights.delete(signature);
  });
  return promise;
}

/** @internal Test isolation for the renderer-capability promise cache. */
export function resetRendererPreflightsForTests(): void {
  if (process.env.NODE_ENV === 'test') preflights.clear();
}

export function PixiTownCanvas({ world, camera, mode, onError }: PixiTownCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PixiApplication | null>(null);
  const appCleanupRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);
  const onErrorRef = useRef(onError);
  const [atlasTexture, setAtlasTexture] = useState<Texture | null>(null);
  const [rendererReady, setRendererReady] = useState(false);
  onErrorRef.current = onError;

  const reportError = useCallback((reason: unknown) => {
    if (mountedRef.current) onErrorRef.current?.(asError(reason));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    const resolution = Math.min(window.devicePixelRatio || 1, 2);
    void preflightRenderer(resolution).then(
      () => { if (active) setRendererReady(true); },
      reportError,
    );

    const asset = acquireAtlasTexture(atlas.imagePath);
    void asset.promise.then(
      (texture) => { if (active) setAtlasTexture(texture); },
      reportError,
    );
    return () => {
      active = false;
      mountedRef.current = false;
      asset.release();
    };
  }, [reportError]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => appRef.current?.resize());
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const handleInit = useCallback((app: PixiApplication) => {
    if (!mountedRef.current) return;
    appCleanupRef.current?.();
    appCleanupRef.current = null;
    appRef.current = app;
    const tick = () => undefined;
    const handleVisibility = () => document.hidden ? app.stop() : app.start();
    app.ticker.add(tick);
    document.addEventListener('visibilitychange', handleVisibility);
    appCleanupRef.current = () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      app.ticker.remove(tick);
    };
  }, []);

  useEffect(() => () => {
    appCleanupRef.current?.();
    appCleanupRef.current = null;
    appRef.current = null;
  }, []);

  const resolution = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  return (
    <div ref={hostRef} aria-hidden="true">
      {rendererReady && atlasTexture ? (
        <PixiChildRenderBoundary
          key={`${atlas.imagePath}:${world.layoutVersion}:${world.lives.map((life) => `${life.worryId}:${life.growthStage}`).join(',')}`}
          onError={reportError}
        >
          {/* @pixi/react 8.0.5 has no public async init-error callback or public root unmount API.
              The cached preflight guards renderer capability; this managed host owns root teardown. */}
          <ManagedApplication
            antialias={false}
            backgroundAlpha={0}
            resolution={resolution}
            resizeTo={hostRef}
            autoStart
            sharedTicker={false}
            onInit={handleInit}
          >
            <TownStage atlasTexture={atlasTexture} camera={camera} manifest={manifest} mode={mode} world={world} />
          </ManagedApplication>
        </PixiChildRenderBoundary>
      ) : null}
    </div>
  );
}

export type { TownAssetManifest };
