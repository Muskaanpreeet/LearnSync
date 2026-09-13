import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger-50 bg-danger-50/40 py-16 text-center">
    <AlertTriangle className="text-danger-500" size={28} />
    <p className="text-sm text-gray-700">{message}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export default ErrorState;
