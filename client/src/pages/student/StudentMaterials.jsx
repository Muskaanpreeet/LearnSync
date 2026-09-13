import { useEffect, useState, useCallback } from 'react';
import { FileText, FileImage, File as FileIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import materialService from '../../services/materialService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import useDebounce from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatDate';

const fileIcon = { pdf: FileText, doc: FileText, ppt: FileText, image: FileImage, other: FileIcon };

const StudentMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await materialService.getMaterials({ search: debouncedSearch || undefined, fileType: fileType || undefined, limit: 50 });
      setMaterials(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, fileType]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return (
    <div>
      <PageHeader title="Study Materials" description="Notes, slides, and resources shared by your teachers." />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search materials…" />
        <select className="input-field" value={fileType} onChange={(e) => setFileType(e.target.value)}>
          <option value="">All file types</option>
          <option value="pdf">PDF</option>
          <option value="doc">Word (DOC/DOCX)</option>
          <option value="ppt">PowerPoint (PPT/PPTX)</option>
          <option value="image">Image</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading materials…" />
      ) : materials.length === 0 ? (
        <EmptyState title="No materials available yet" message="Your teachers haven't uploaded anything yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => {
            const Icon = fileIcon[m.file.fileType] || FileIcon;
            return (
              <a key={m._id} href={m.file.url} target="_blank" rel="noreferrer" className="card block transition-shadow hover:shadow-md">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-600 w-fit">
                  <Icon size={18} />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{m.title}</h3>
                <p className="text-xs text-gray-400">
                  {m.course?.code} · {m.uploadedBy?.name}
                </p>
                {m.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{m.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary-600">
                    <Download size={13} /> Download
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;
