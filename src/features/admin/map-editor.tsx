'use client';

import { useState, type MouseEvent } from 'react';
export { clampPlacement } from './placement';
import { clampPlacement } from './placement';

type Worry = { id: string; title: string; lifeAssetId: string; placement: { zone: string; x: number; y: number } | null };
type Asset = { id: string; name: string; type: string; previewPath: string };

export function MapEditor({ worries, assets }: { worries: Worry[]; assets: Asset[] }) {
  const [worryId, setWorryId] = useState(worries[0]?.id ?? ''); const [assetId, setAssetId] = useState(worries[0]?.lifeAssetId ?? ''); const [zone, setZone] = useState('forest'); const [message, setMessage] = useState('');
  function chooseWorry(id: string) { const worry = worries.find((item) => item.id === id); setWorryId(id); if (worry) { setAssetId(worry.lifeAssetId); setZone(worry.placement?.zone ?? 'forest'); } }
  async function place(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect(); const point = clampPlacement({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
    const response = await fetch('/api/admin/placements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ worryId, lifeAssetId: assetId, zone, ...point }) });
    const result = await response.json(); setMessage(response.ok ? '位置已保存。' : result.error ?? '保存失败');
  }
  return <div className="map-editor"><aside><label>选择烦恼<select value={worryId} onChange={(event) => chooseWorry(event.target.value)}>{worries.map((worry) => <option key={worry.id} value={worry.id}>{worry.title}</option>)}</select></label><label>生命素材<select value={assetId} onChange={(event) => setAssetId(event.target.value)}>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.type === 'tree' ? '树' : '动物'} · {asset.name}</option>)}</select></label><fieldset><legend>放在哪儿</legend><label><input type="radio" checked={zone === 'forest'} onChange={() => setZone('forest')} />林场</label><label><input type="radio" checked={zone === 'pasture'} onChange={() => setZone('pasture')} />牧场</label></fieldset><p role="status">{message || '在右侧画卷中点击目标位置。'}</p></aside><button className="map-editor__canvas" type="button" onClick={place} aria-label="点击地图摆放生命"><span>点击这里摆放</span></button></div>;
}
