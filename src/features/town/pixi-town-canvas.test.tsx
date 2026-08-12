import { act, render } from '@testing-library/react';
import type { Application as PixiApplication } from 'pixi.js';
import React, { type ComponentProps, type ReactNode } from 'react';

const pixi = vi.hoisted(() => {
  const makeApp = () => ({
    destroy: vi.fn(),
    renderer: {},
    resize: vi.fn(),
    stage: { destroy: vi.fn() },
    start: vi.fn(),
    stop: vi.fn(),
    ticker: { add: vi.fn(), remove: vi.fn() },
  });
  const app = makeApp();

  return {
    app,
    applicationProps: undefined as Record<string, unknown> | undefined,
    assetLoad: vi.fn(() => Promise.resolve({ source: {} })),
    assetUnload: vi.fn(() => Promise.resolve()),
    extend: vi.fn(),
    preflightInit: vi.fn(() => Promise.resolve()),
    preflightDestroy: vi.fn(),
    makeApp,
    onInit: undefined as ((app: PixiApplication) => void) | undefined,
  };
});

vi.mock('@pixi/react', async () => {
  const ReactModule = await import('react');
  return {
    Application: ({ children, onInit, ...options }: { children?: ReactNode; onInit?: (app: PixiApplication) => void }) => {
      pixi.applicationProps = options;
      pixi.onInit = onInit;
      ReactModule.useEffect(() => onInit?.(pixi.app as unknown as PixiApplication), [onInit]);
      return <div data-testid="managed-application">{children}</div>;
    },
    extend: pixi.extend,
  };
});

vi.mock('pixi.js', () => ({
  Application: class Application {
    renderer: object | undefined;
    stage = { destroy: vi.fn() };
    async init() {
      await pixi.preflightInit();
      this.renderer = {};
    }
    destroy(...args: unknown[]) { pixi.preflightDestroy(...args); }
  },
  Assets: { load: pixi.assetLoad, unload: pixi.assetUnload },
  Container: class Container {},
  Rectangle: class Rectangle {},
  Sprite: class Sprite {},
  Texture: class Texture {},
}));

vi.mock('./scene/town-stage', () => ({ TownStage: () => null }));

import { PixiTownCanvas, resetRendererPreflightsForTests } from './pixi-town-canvas';
import { resetAtlasResourcesForTests } from './scene/atlas-resource';
import type { TownCameraView, TownWorldModel } from './world-model';

const world = {
  layoutVersion: 2,
  width: 1536,
  height: 864,
  lives: [],
} satisfies TownWorldModel;

const camera = {
  x: 0,
  y: 0,
  scale: 1,
  viewportWidth: 1280,
  viewportHeight: 720,
} satisfies TownCameraView;

const observers: Array<{ disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> }> = [];

beforeEach(() => {
  resetAtlasResourcesForTests();
  resetRendererPreflightsForTests();
  pixi.app.start.mockClear();
  pixi.app.stop.mockClear();
  pixi.app.ticker.add.mockClear();
  pixi.app.ticker.remove.mockClear();
  pixi.assetLoad.mockReset();
  pixi.assetLoad.mockResolvedValue({ source: {} });
  pixi.assetUnload.mockClear();
  pixi.preflightInit.mockReset();
  pixi.preflightInit.mockResolvedValue(undefined);
  pixi.preflightDestroy.mockClear();
  pixi.applicationProps = undefined;
  observers.length = 0;

  vi.stubGlobal('ResizeObserver', class ResizeObserver {
    disconnect = vi.fn();
    observe = vi.fn();
    constructor() {
      observers.push(this);
    }
  });
});

afterEach(() => {
  resetAtlasResourcesForTests();
  resetRendererPreflightsForTests();
  vi.unstubAllGlobals();
});

function renderCanvas(props: Partial<ComponentProps<typeof PixiTownCanvas>> = {}) {
  return render(
    <PixiTownCanvas world={world} camera={camera} mode="public" {...props} />,
  );
}

it('exports an aria-hidden host with bounded client renderer options', async () => {
  const { container } = renderCanvas();

  await vi.waitFor(() => expect(pixi.applicationProps).toBeDefined());

  const host = container.firstElementChild;
  expect(host).toHaveAttribute('aria-hidden', 'true');
  expect(pixi.applicationProps).toMatchObject({
    antialias: false,
    backgroundAlpha: 0,
    resolution: Math.min(window.devicePixelRatio, 2),
  });
  expect(pixi.applicationProps?.resizeTo).toMatchObject({ current: host });
});

it('disconnects its observer and removes document and ticker callbacks on unmount', async () => {
  const addEventListener = vi.spyOn(document, 'addEventListener');
  const removeEventListener = vi.spyOn(document, 'removeEventListener');
  const { unmount } = renderCanvas();

  await vi.waitFor(() => expect(pixi.app.ticker.add).toHaveBeenCalledOnce());
  const tickerCallback = pixi.app.ticker.add.mock.calls[0][0];
  const visibilityCallback = addEventListener.mock.calls
    .find(([type]) => type === 'visibilitychange')?.[1];

  unmount();

  expect(observers[0].observe).toHaveBeenCalledOnce();
  expect(observers[0].disconnect).toHaveBeenCalledOnce();
  expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', visibilityCallback);
  expect(pixi.app.ticker.remove).toHaveBeenCalledWith(tickerCallback);
});

it('reports a renderer preflight rejection and does not mount the managed Application', async () => {
  const onError = vi.fn();
  pixi.preflightInit.mockRejectedValueOnce(new Error('renderer init failed'));

  const view = renderCanvas({ onError });

  await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'renderer init failed' }),
  ));
  expect(view.queryByTestId('managed-application')).not.toBeInTheDocument();
});

it('shares a successful preflight and retries after a rejected preflight', async () => {
  const first = renderCanvas();
  const second = renderCanvas();
  await vi.waitFor(() => expect(first.container.querySelector('[data-testid="managed-application"]')).toBeInTheDocument());
  expect(pixi.preflightInit).toHaveBeenCalledOnce();
  first.unmount();
  second.unmount();

  resetRendererPreflightsForTests();
  pixi.preflightInit.mockRejectedValueOnce(new Error('retryable'));
  const retryError = vi.fn();
  const failed = renderCanvas({ onError: retryError });
  await vi.waitFor(() => expect(retryError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'retryable' }),
  ));
  failed.unmount();
  await Promise.resolve();
  const retried = renderCanvas();
  await vi.waitFor(() => expect(retried.queryByTestId('managed-application')).toBeInTheDocument());
  expect(pixi.preflightInit).toHaveBeenCalledTimes(3);
  retried.unmount();
});

it('shares one atlas load across mounts and unloads only after the final release', async () => {
  const first = renderCanvas();
  const second = renderCanvas();

  await vi.waitFor(() => expect(pixi.applicationProps).toBeDefined());
  expect(pixi.assetLoad).toHaveBeenCalledOnce();

  first.unmount();
  expect(pixi.assetUnload).not.toHaveBeenCalled();
  second.unmount();

  await vi.waitFor(() => expect(pixi.assetUnload).toHaveBeenCalledOnce());
});

it('does not duplicate a pending load or unload it during a StrictMode effect replay', async () => {
  let resolveLoad: (texture: { source: object }) => void = () => undefined;
  pixi.assetLoad.mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));

  const view = render(
    <React.StrictMode>
      <PixiTownCanvas world={world} camera={camera} mode="public" />
    </React.StrictMode>,
  );
  expect(pixi.assetLoad).toHaveBeenCalledOnce();

  resolveLoad({ source: {} });
  await vi.waitFor(() => expect(pixi.applicationProps).toBeDefined());
  expect(pixi.assetUnload).not.toHaveBeenCalled();

  view.unmount();
  await vi.waitFor(() => expect(pixi.assetUnload).toHaveBeenCalledOnce());
});

it('replaces prior app-local callbacks when onInit runs again', async () => {
  const addEventListener = vi.spyOn(document, 'addEventListener');
  const removeEventListener = vi.spyOn(document, 'removeEventListener');
  const view = renderCanvas();
  await vi.waitFor(() => expect(pixi.app.ticker.add).toHaveBeenCalledOnce());
  const firstTick = pixi.app.ticker.add.mock.calls[0][0];
  const firstVisibility = addEventListener.mock.calls.find(([type]) => type === 'visibilitychange')?.[1];
  const nextApp = pixi.makeApp();

  act(() => pixi.onInit?.(nextApp as unknown as PixiApplication));

  expect(pixi.app.ticker.remove).toHaveBeenCalledWith(firstTick);
  expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', firstVisibility);
  expect(nextApp.ticker.add).toHaveBeenCalledOnce();
  const nextTick = nextApp.ticker.add.mock.calls[0][0];
  view.unmount();
  expect(nextApp.ticker.remove).toHaveBeenCalledWith(nextTick);
});

it('reports atlas loading errors and never reports them after unmount', async () => {
  const onError = vi.fn();
  let rejectLoad: (reason: unknown) => void = () => undefined;
  pixi.assetLoad.mockReturnValue(new Promise((_, reject) => { rejectLoad = reject; }));

  const first = renderCanvas({ onError });
  rejectLoad(new Error('atlas failed'));
  await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'atlas failed' })));
  first.unmount();
  await Promise.resolve();
  resetAtlasResourcesForTests();

  onError.mockClear();
  pixi.assetLoad.mockReturnValue(new Promise((_, reject) => { rejectLoad = reject; }));
  const second = renderCanvas({ onError });
  expect(pixi.assetLoad).toHaveBeenCalledTimes(2);
  second.unmount();
  rejectLoad(new Error('late failure'));
  await Promise.resolve();
  expect(onError).not.toHaveBeenCalled();
});
