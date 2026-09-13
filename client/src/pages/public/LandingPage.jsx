import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ClipboardCheck, BarChart3, Bell, ShieldCheck } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Course Management', text: 'Organize courses, materials, and enrollments in one place.' },
  { icon: ClipboardCheck, title: 'Assignments & Tests', text: 'Create, submit, and grade work with automatic scoring for objective questions.' },
  { icon: BarChart3, title: 'Academic Analytics', text: 'Track attendance, performance, and trends with live dashboards.' },
  { icon: Bell, title: 'Real-time Notifications', text: 'Never miss a deadline, grade, or announcement.' },
  { icon: ShieldCheck, title: 'Role-Based Access', text: 'Admins, teachers, and students each see exactly what they need.' },
  { icon: GraduationCap, title: 'Built for Institutions', text: 'One platform connecting every academic workflow end to end.' },
];

const LandingPage = () => (
  <div className="min-h-screen bg-white">
    {/* Nav */}
    <header className="border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-primary-700">LearnSync</span>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        One platform for your entire academic life
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
        LearnSync connects admins, teachers, and students — courses, assignments, attendance,
        tests, and results, all in sync.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/register" className="btn-primary px-6 py-3 text-base">Create free account</Link>
        <Link to="/login" className="btn-secondary px-6 py-3 text-base">Sign in</Link>
      </div>
    </section>

    {/* Features */}
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h2 className="text-center text-2xl font-semibold text-gray-900">Everything academic teams need</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card">
            <div className="mb-3 inline-flex rounded-lg bg-primary-50 p-2.5 text-primary-600">
              <Icon size={22} />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1.5 text-sm text-gray-500">{text}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="border-t border-gray-100 bg-primary-50/50">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Ready to bring your academics in sync?</h2>
        <Link to="/register" className="btn-primary mt-6 inline-flex px-6 py-3 text-base">
          Get started for free
        </Link>
      </div>
    </section>

    <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
      © {new Date().getFullYear()} LearnSync — Academic Management System
    </footer>
  </div>
);

export default LandingPage;
