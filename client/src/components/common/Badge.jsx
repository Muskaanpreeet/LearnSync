// Small status pill — used for course status, assignment status,
// attendance status, test status, etc. `tone` maps to the shared
// success/warning/danger/primary palette defined in tailwind.config.js.
const tones = {
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  primary: 'bg-primary-50 text-primary-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const Badge = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tones[tone] || tones.neutral}`}>
    {children}
  </span>
);

export default Badge;
