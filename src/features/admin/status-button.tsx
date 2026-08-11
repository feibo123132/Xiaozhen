'use client';

import { useState } from 'react';

export function StatusButton({ resource, id, status, children }: { resource: 'events' | 'worries'; id: string; status: string; children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  async function update() {
    const response = await fetch(`/api/admin/${resource}/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? '操作失败'); return; }
    window.location.reload();
  }
  return <span className="status-action"><button type="button" onClick={update}>{children}</button>{message ? <small role="alert">{message}</small> : null}</span>;
}
