import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, FileText, FileImage, File as FileIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import materialService from '../../services/materialService';
import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import useDebounce from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatDate';

const fileIcon = { pdf: FileText, doc: FileText, ppt: FileText, image: FileImage, other: FileIcon };

const TeacherMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    courseService.getCourses({ limit: 50 }).then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) setUploadCourse(res.data[0]._id);
    });
  }, []);

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

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadCourse || !uploadFile) {
      toast.error('Title, course, and a file are required');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('course', uploadCourse);
    formData.append('file', uploadFile);
    try {
      await materialService.createMaterial(formData);
      toast.success('Material uploaded');
      setUploadOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await materialService.deleteMaterial(deleteTarget._id);
      toast.success('Material deleted');
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete material');
    }
  };

  return (
    <div>
      <PageHeader
        title="Study Materials"
        description="Upload notes, slides, and other resources for your courses."
        action={
          <Button onClick={() => setUploadOpen(true)} disabled={courses.length === 0}>
            <Plus size={16} /> Upload material
          </Button>
        }
      />

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
        <EmptyState title="No materials uploaded yet" message="Upload notes or slides for your students to access." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => {
            const Icon = fileIcon[m.file.fileType] || FileIcon;
            return (
              <div key={m._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                    <Icon size={18} />
                  </div>
                  <button onClick={() => setDeleteTarget(m)} className="text-gray-400 hover:text-danger-700">
                    <Trash2 size={15} />
                  </button>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{m.title}</h3>
                <p className="text-xs text-gray-400">{m.course?.code}</p>
                {m.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{m.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                  <a href={m.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload study material">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input className="input-field" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea rows={2} className="input-field" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course</label>
            <select className="input-field" value={uploadCourse} onChange={(e) => setUploadCourse(e.target.value)}>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">File</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50">
              <FileText size={16} />
              {uploadFile ? uploadFile.name : 'Choose a file (PDF, DOC, PPT…)'}
              <input type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files[0])} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete material"
        message={`Delete "${deleteTarget?.title}"? Students will no longer be able to access it.`}
      />
    </div>
  );
};

export default TeacherMaterials;
