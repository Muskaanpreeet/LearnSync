import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
    <Loader2 className="animate-spin" size={28} />
    <p className="text-sm">{message}</p>
  </div>
);

export default LoadingState;
