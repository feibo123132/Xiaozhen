import { AdminLoginForm } from '@/features/admin/admin-login-form';

export default function AdminLoginPage() {
  return <main id="main-content" className="admin-login"><span className="eyebrow">只对主理人开放</span><h1>回到策展桌</h1><p>这里保存草稿、安排活动并发布经过授权的真实观点。</p><AdminLoginForm /></main>;
}
