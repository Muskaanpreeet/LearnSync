import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-16 text-center">
    <Inbox className="text-gray-300" size={32} />
    <p className="font-medium text-gray-700">{title}</p>
    {message && <p className="max-w-sm text-sm text-gray-500">{message}</p>}
    {action}
  </div>
);

export default EmptyState;
