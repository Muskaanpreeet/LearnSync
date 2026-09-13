import { Search } from 'lucide-react';

// Controlled search input reused across every list page (students,
// teachers, courses, assignments, tests, materials).
const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative">
    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pl-9"
    />
  </div>
);

export default SearchBar;
