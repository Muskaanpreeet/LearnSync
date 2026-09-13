// Dashboard summary tile — "Total Students: 240" style cards used on
// every role's dashboard.
const StatCard = ({ label, value, icon: Icon, tone = 'primary' }) => (
  <div className="card flex items-center gap-4">
    {Icon && (
      <div className={`rounded-lg bg-${tone}-50 p-3 text-${tone}-600`}>
        <Icon size={20} />
      </div>
    )}
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

export default StatCard;
