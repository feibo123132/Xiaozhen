import { getCurrentEvent } from '@/features/events/current-event';
import { HomeScreen } from '@/features/events/home-screen';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return <HomeScreen event={await getCurrentEvent()} />;
}
