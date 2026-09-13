import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

import announcementService from '../../services/announcementService';
import courseService from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDateTime } from '../../utils/formatDate';

const audienceTone = { everyone: 'primary', students: 'success', teachers: 'warning' };
const statusTone = { draft: 'neutral', published: 'success' };

const emptyForm = { title: '', content: '', audience: 'everyone', course: '', status: 'published' };

// One page, three roles: Admin and Teacher get create/edit/delete;
// Student gets a read-only feed. Visibility itself is already
// enforced server-side (see announcementController.getAnnouncements),
// so this component just renders whatever the API returns.
const Announcements = () => {
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements({ limit: 50 });
      setAnnouncements(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (canManage) {
      courseService.getCourses({ limit: 50 }).then((res) => setCourses(res.data));
    }
  }, [canManage]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, course: role === 'teacher' ? courses[0]?._id || '' : '' });
    setFormOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      audience: a.audience,
      course: a.course?._id || '',
      status: a.status,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (role === 'teacher' && !editing && !form.course) {
      toast.error('Teachers must select a course for the announcement');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await announcementService.updateAnnouncement(editing._id, {
          title: form.title,
          content: form.content,
          audience: form.audience,
          status: form.status,
        });
        toast.success('Announcement updated');
      } else {
        await announcementService.createAnnouncement(form);
        toast.success('Announcement posted');
      }
      setFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await announcementService.deleteAnnouncement(deleteTarget._id);
      toast.success('Announcement deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        description={canManage ? 'Post updates for your courses or the whole platform.' : 'Updates from your teachers and administrators.'}
        action={canManage && <Button onClick={openCreate}><Plus size={16} /> New announcement</Button>}
      />

      {loading ? (
        <LoadingState message="Loading announcements…" />
      ) : announcements.length === 0 ? (
        <EmptyState title="No announcements yet" message="Check back later for updates." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary-50 p-2 text-primary-600">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-xs text-gray-400">
                      {a.createdBy?.name} · {formatDateTime(a.createdAt)}
                      {a.course && ` · ${a.course.code}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={a.course ? 'primary' : audienceTone[a.audience]}>{a.course ? a.course.code : a.audience}</Badge>
                  {canManage && a.status === 'draft' && <Badge tone={statusTone.draft}>draft</Badge>}
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-primary-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(a)} className="text-gray-400 hover:text-danger-700">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit announcement' : 'New announcement'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
            <textarea rows={4} className="input-field" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          </div>

          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course {role === 'teacher' ? '' : '(optional — leave blank for platform-wide)'}
                </label>
                <select className="input-field" value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}>
                  {role === 'admin' && <option value="">None — platform-wide</option>}
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {!form.course && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
                  <select className="input-field" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
                    <option value="everyone">Everyone</option>
                    <option value="students">Students only</option>
                    <option value="teachers">Teachers only</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {editing && !editing.course && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
              <select className="input-field" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
                <option value="everyone">Everyone</option>
                <option value="students">Students only</option>
                <option value="teachers">Teachers only</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select className="input-field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Post announcement'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete announcement"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
};

export default Announcements;
