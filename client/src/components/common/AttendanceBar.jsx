import { AlertTriangle } from 'lucide-react';

// Visual attendance indicator reused on the student dashboard, the
// student attendance page, and the teacher's course summary. Color
// reflects standing relative to `threshold` (from the backend, driven
// by ATTENDANCE_WARNING_THRESHOLD) rather than a hardcoded number here.
const AttendanceBar = ({ percentage, threshold = 75, belowThreshold }) => {
  const isLow = belowThreshold ?? percentage < threshold;
  const barColor = isLow ? 'bg-danger-500' : percentage >= 90 ? 'bg-success-500' : 'bg-primary-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{percentage}%</span>
        {isLow && (
          <span className="flex items-center gap-1 text-xs font-medium text-danger-700">
            <AlertTriangle size={13} /> Below {threshold}%
          </span>
        )}
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  );
};

export default AttendanceBar;
