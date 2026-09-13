// Thin wrapper so every button in the app shares the same variants
// instead of re-typing Tailwind class strings everywhere.
const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'inline-flex items-center justify-center gap-2 rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-60',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
};

const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button className={`${variants[variant] || variants.primary} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
