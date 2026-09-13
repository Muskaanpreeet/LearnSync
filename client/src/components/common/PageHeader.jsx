// Consistent "Title + description + action button" header for every
// list/detail page, instead of hand-rolling this layout each time.
const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {action}
  </div>
);

export default PageHeader;
