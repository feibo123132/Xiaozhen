import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="empty-state">
      <span className="eyebrow">走错小路了</span>
      <h1>这里暂时没有故事</h1>
      <p>回到灯亮着的地方，再慢慢找一找。</p>
      <Link className="ink-button" href="/">返回小镇入口</Link>
    </main>
  );
}
