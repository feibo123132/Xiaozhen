'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Asset = { id: string; name: string; type: string };

export function AdminDraftForm({ kind, assets = [] }: { kind: 'event' | 'worry'; assets?: Asset[] }) {
  const storageKey = `relief-town:${kind}-draft`;
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setSaved(JSON.parse(sessionStorage.getItem(storageKey) ?? '{}')); } catch { setSaved({}); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  function remember(event: FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(Array.from(new FormData(event.currentTarget).entries(), ([key, value]) => [key, String(value)]));
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('正在保存草稿…');
    const form = event.currentTarget; const values: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    if (values.eventDate) values.eventDate = new Date(String(values.eventDate)).toISOString();
    values.sensitive = values.sensitive === 'on';
    const response = await fetch(`/api/admin/${kind === 'event' ? 'events' : 'worries'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? '保存失败，请稍后重试'); return; }
    sessionStorage.removeItem(storageKey); form.reset(); setSaved({}); setMessage('草稿已保存。刷新页面后可查看。');
  }

  return <form className="admin-form" onInput={remember} onSubmit={submit}>
    <div className="form-row"><label>短链接<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={saved.slug ?? ''} placeholder="first-roadshow" required /></label><label>标题<input name="title" defaultValue={saved.title ?? ''} required /></label></div>
    {kind === 'event' ? <><label>活动介绍<textarea name="intro" defaultValue={saved.intro ?? ''} rows={4} required /></label><label>活动时间（可选）<input name="eventDate" type="datetime-local" defaultValue={saved.eventDate ?? ''} /></label></> : <><label>烦恼正文<textarea name="body" defaultValue={saved.body ?? ''} rows={5} required /></label><label>主理人背景说明（可选）<textarea name="background" defaultValue={saved.background ?? ''} rows={3} /></label><div className="form-row"><label>生命素材<select name="lifeAssetId" defaultValue={saved.lifeAssetId ?? ''} required><option value="" disabled>请选择</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.type === 'tree' ? '树' : '动物'} · {asset.name}</option>)}</select></label><label className="checkbox-label"><input name="sensitive" type="checkbox" defaultChecked={saved.sensitive === 'on'} />包含危机敏感内容</label></div></>}
    {message ? <p className="form-message" role="status">{message}</p> : null}<button className="ink-button">保存为草稿</button>
  </form>;
}
