'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage('');
    const data = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? '登录失败'); setPending(false); return; }
    router.push('/admin');
    router.refresh();
  }
  return <form className="admin-form admin-login-form" onSubmit={submit}><label>主理人账号<input name="username" autoComplete="username" required /></label><label>密码<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>{message ? <p className="form-error" role="alert">{message}</p> : null}<button className="ink-button" disabled={pending}>{pending ? '正在核验…' : '进入后台'}</button></form>;
}
