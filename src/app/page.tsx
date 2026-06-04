import { auth } from '@/auth';
import LandingClientPage from '@/components/LandingClientPage';


export default async function LandingPage() {
  const session = await auth();

  return <LandingClientPage session={session} />;
}
