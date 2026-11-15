import { AppRoutes } from './routes';
import { ScrollManager } from '@/components/ScrollManager';

export default function App() {
  return (
    <>
      <ScrollManager />
      <AppRoutes />
    </>
  );
}
