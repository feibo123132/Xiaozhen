import Link from 'next/link';
import { FocusLink } from './focus-link';

export function SiteHeader() {
  return (
    <>
      <FocusLink>跳到正文</FocusLink>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="解忧小镇首页">
          <span className="brand-mark" aria-hidden="true">忧</span>
          <span><strong>解忧小镇</strong><small>RELIEF TOWN</small></span>
        </Link>
        <nav className="site-nav" aria-label="主要导航">
          <Link href="/">本场问题</Link>
          <Link href="/town">完整小镇</Link>
          <Link className="traveler-link" href="/login">我的旅人</Link>
        </nav>
      </header>
    </>
  );
}
