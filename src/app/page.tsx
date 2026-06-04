import { auth } from '@/auth';
import LandingClientPage from '@/components/LandingClientPage';

export const runtime = 'edge';

export default async function LandingPage() {
  const session = await auth();

  return <LandingClientPage session={session} />;
}
