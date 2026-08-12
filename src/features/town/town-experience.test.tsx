import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { TownExperience } from './town-experience';

const world = { layoutVersion: 2 as const, width: 1536 as const, height: 864 as const, lives: [{ worryId: 'w1', slug: 'one', title: '第一个烦恼', responseCount: 3, zone: 'forest' as const, x: 300, y: 500, depthOffset: 0, assetId: 'mist-pine', growthStage: 2 }] };
const worries = [{ id: 'w1', slug: 'one', title: '第一个烦恼', publishedViewpointCount: 3, placement: { zone: 'forest', x: 20, y: 50, zIndex: 0, layoutVersion: 2 }, life: { id: 'mist-pine', name: '雾松', type: 'tree', previewPath: '/pine.svg', growthStage: 2, growthPath: '/pine.svg' } }];
const Canvas = ({ onError }: { onError?: (error: Error) => void }) => <button onClick={() => onError?.(new Error('fail'))}>canvas</button>;

beforeEach(() => {
  vi.stubGlobal('PointerEvent', class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
      this.width = init.width ?? 1;
      this.height = init.height ?? 1;
      this.pressure = init.pressure ?? 0;
    }
  });
  vi.stubGlobal('IntersectionObserver', class { constructor(private cb: IntersectionObserverCallback) {} observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never); } disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { constructor(private cb: ResizeObserverCallback) {} observe(target: Element) { Object.defineProperty(target, 'clientWidth', { value: 1000, configurable: true }); Object.defineProperty(target, 'clientHeight', { value: 600, configurable: true }); this.cb([], this as never); } disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());

function setup(props: Partial<ComponentProps<typeof TownExperience>> = {}) { return render(<TownExperience world={world} worries={worries} canvasComponent={Canvas as never} {...props} />); }

it('enters viewport, removes loading hint, and exposes one accessible life link', async () => {
  setup();
  expect(await screen.findByRole('button', { name: 'canvas' })).toBeInTheDocument();
  expect(screen.queryByText('地图正在醒来')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /第一个烦恼.*雾松.*3/ })).toHaveAttribute('href', '/worries/one');
});

it('shows retry after canvas error and keeps the overlay link', async () => {
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'canvas' }));
  expect(screen.getByRole('button', { name: '重试加载地图' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /第一个烦恼/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重试加载地图' }));
  expect(await screen.findByRole('button', { name: 'canvas' })).toBeInTheDocument();
});

it('opens a detail card and closes it with Escape', async () => {
  setup();
  const link = await screen.findByRole('link', { name: /第一个烦恼/ });
  fireEvent.focus(link);
  expect(screen.getByText(/成长阶段 3/)).toBeInTheDocument();
  fireEvent.keyDown(link, { key: 'Escape' });
  expect(screen.queryByText(/成长阶段 3/)).not.toBeInTheDocument();
});

it('suppresses the first hotspot click after a drag but allows a normal click', async () => {
  const view = setup();
  const viewport = view.container.querySelector('[class*="viewport"]') as HTMLElement;
  Object.defineProperty(viewport, 'getBoundingClientRect', { value: () => ({ left: 100, top: 50, width: 1000, height: 600, right: 1100, bottom: 650, x: 100, y: 50, toJSON() {} }) });
  const link = await screen.findByRole('link', { name: /第一个烦恼/ });
  const draggedClick = new MouseEvent('click', { bubbles: true, cancelable: true });
  fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 200, clientY: 150 });
  fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 220, clientY: 150 });
  fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 220, clientY: 150 });
  expect(link.dispatchEvent(draggedClick)).toBe(false);
  link.setAttribute('href', '#normal-click');
  const normalClick = new MouseEvent('click', { bubbles: true, cancelable: true });
  expect(link.dispatchEvent(normalClick)).toBe(true);
});

it('uses viewport-local pointer coordinates for a moving pinch', async () => {
  const view = setup();
  const viewport = view.container.querySelector('[class*="viewport"]') as HTMLElement;
  Object.defineProperty(viewport, 'getBoundingClientRect', { value: () => ({ left: 100, top: 50, width: 1000, height: 600, right: 1100, bottom: 650, x: 100, y: 50, toJSON() {} }) });
  await screen.findByRole('button', { name: 'canvas' });
  fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 300, clientY: 250 });
  fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 500, clientY: 250 });
  fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 600, clientY: 300 });
  expect(screen.getByRole('link', { name: /第一个烦恼/ })).toBeInTheDocument();
});

it('catches injected canvas render errors and retry remounts exactly one recovered canvas', async () => {
  let shouldThrow = true;
  const ThrowingCanvas = () => { if (shouldThrow) throw new Error('chunk failed'); return <div data-testid="recovered-canvas" />; };
  setup({ canvasComponent: ThrowingCanvas as never });
  expect(await screen.findByRole('button', { name: '重试加载地图' })).toBeInTheDocument();
  expect(screen.getByAltText('解忧小镇地图预览')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /第一个烦恼/ })).toBeInTheDocument();
  shouldThrow = false;
  fireEvent.click(screen.getByRole('button', { name: '重试加载地图' }));
  expect(await screen.findByTestId('recovered-canvas')).toBeInTheDocument();
  expect(screen.getAllByTestId('recovered-canvas')).toHaveLength(1);
});

it('retries a rejected dynamic importer with a fresh generation', async () => {
  const Imported = () => <div data-testid="imported-canvas" />;
  const importer = vi.fn()
    .mockRejectedValueOnce(new Error('chunk unavailable'))
    .mockResolvedValue({ default: Imported });
  setup({ canvasImporter: importer as never, canvasComponent: undefined });
  expect(await screen.findByRole('button', { name: '重试加载地图' })).toBeInTheDocument();
  expect(screen.getByAltText('解忧小镇地图预览')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重试加载地图' }));
  expect(await screen.findByTestId('imported-canvas')).toBeInTheDocument();
  expect(importer).toHaveBeenCalledTimes(2);
  expect(screen.getAllByTestId('imported-canvas')).toHaveLength(1);
});

it('accumulates multiple pointer moves in one act', async () => {
  const cameraSpy = vi.fn();
  const CameraCanvas = ({ camera }: { camera: { x: number } }) => { cameraSpy(camera.x); return <div />; };
  const view = setup({ canvasComponent: CameraCanvas as never });
  const viewport = view.container.querySelector('[class*="viewport"]') as HTMLElement;
  Object.defineProperty(viewport, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 1000, height: 600, right: 1000, bottom: 600, x: 0, y: 0, toJSON() {} }) });
  await screen.findByRole('link', { name: /第一个烦恼/ });
  fireEvent.wheel(viewport, { clientX: 500, clientY: 300, deltaY: -100 });
  act(() => {
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500, clientY: 300 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 490, clientY: 300 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 480, clientY: 300 });
  });
  const cameraXs = cameraSpy.mock.calls.map(([x]) => x as number);
  expect(cameraXs[cameraXs.length - 1]).toBeLessThan(cameraXs[0]);
  expect(Number.isFinite(cameraXs[cameraXs.length - 1])).toBe(true);
});

it('suppresses clicks after pinch and after a three-pointer gesture', async () => {
  const view = setup();
  const viewport = view.container.querySelector('[class*="viewport"]') as HTMLElement;
  Object.defineProperty(viewport, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 1000, height: 600, right: 1000, bottom: 600, x: 0, y: 0, toJSON() {} }) });
  const link = await screen.findByRole('link', { name: /第一个烦恼/ });
  fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 200, clientY: 200 });
  fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 400, clientY: 200 });
  fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 450, clientY: 200 });
  fireEvent.pointerUp(viewport, { pointerId: 1 }); fireEvent.pointerUp(viewport, { pointerId: 2 });
  expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
  fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 200, clientY: 200 });
  fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 400, clientY: 200 });
  fireEvent.pointerDown(viewport, { pointerId: 3, clientX: 600, clientY: 200 });
  fireEvent.pointerMove(viewport, { pointerId: 3, clientX: 650, clientY: 200 });
  fireEvent.pointerUp(viewport, { pointerId: 1 }); fireEvent.pointerUp(viewport, { pointerId: 2 }); fireEvent.pointerUp(viewport, { pointerId: 3 });
  expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
});
