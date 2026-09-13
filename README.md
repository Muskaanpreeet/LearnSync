# LearnSync — Academic Management System

A full-stack MERN academic management platform connecting **Admins**, **Teachers**, and **Students**
around courses, assignments, attendance, tests, results, study materials, announcements, and
notifications.

> **Status: All 10 planned modules complete, admin panel fully built out.** LearnSync now has:
> project scaffold, JWT authentication, role-based authorization, Course Management, the
> Assignment System, the Attendance System, the Test/Quiz System, Results & Marks, Study
> Materials, Announcements, Notifications, full role dashboards with Recharts, and the complete
> **Admin panel**: Students management (list/search/filter/activate-deactivate/delete/detail
> view), Teachers management (same, plus assigned-courses view), Reports (institution stats +
> CSV-exportable course breakdown), and Settings (profile + change password, shared across all
> three roles). This README documents the finished system end to end.

---

## 1. Technology Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18 + Vite, JavaScript (no TypeScript), Tailwind CSS, React Router DOM, Axios, React Hook Form, React Hot Toast, Lucide React, Recharts |
| Backend    | Node.js, Express.js, RESTful APIs, JWT, bcryptjs |
| Database   | MongoDB + Mongoose |
| File storage | Cloudinary (configured, wired up as upload features are built) |

## 2. Folder Structure

```
learnsync/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # common/ + layout/ reusable UI
│   │   ├── pages/                # public/ admin/ teacher/ student/ common/
│   │   ├── layouts/              # DashboardLayout (shared sidebar+topbar shell)
│   │   ├── routes/               # ProtectedRoute, RoleRoute
│   │   ├── services/              # api.js (Axios instance) + authService.js
│   │   ├── context/               # AuthContext (global auth state)
│   │   ├── hooks/                 # (custom hooks added as needed)
│   │   ├── utils/                 # (helpers added as needed)
│   │   └── assets/
│   ├── .env.example
│   └── package.json
└── server/                       # Express backend
    ├── config/                   # db.js (MongoDB), cloudinary.js
    ├── controllers/               # authController.js
    ├── middleware/                 # auth.js (protect/authorize), errorHandler.js
    ├── models/                     # User.js
    ├── routes/                     # authRoutes.js
    ├── utils/                      # generateToken.js, seedData.js
    ├── uploads/                    # (temp storage before Cloudinary push, if needed)
    ├── .env.example
    ├── server.js
    └── package.json
```

## 3. How Authentication Works (for your presentation)

1. **Registration/Login** — the client posts credentials to `/api/auth/register` or
   `/api/auth/login`. The backend hashes passwords with **bcrypt** before ever storing them
   (`User.js` pre-save hook) and compares hashes on login — the plaintext password is never stored.
2. **Token issuance** — on success, the server signs a **JWT** containing only the user's `id` and
   `role` (`utils/generateToken.js`) and returns it to the client.
3. **Token storage** — the frontend stores the token in `localStorage` and `AuthContext` holds the
   decoded user in memory for the whole app to read (`useAuth()`).
4. **Authenticated requests** — every subsequent API call automatically attaches
   `Authorization: Bearer <token>` via an Axios request interceptor (`services/api.js`) — no
   component manually manages headers.
5. **Backend verification** — the `protect` middleware (`middleware/auth.js`) verifies the JWT
   signature, loads the real user from MongoDB, and rejects the request if the token is missing,
   invalid, expired, or the account has been deactivated. **This is the only real security
   boundary** — frontend route guards (`ProtectedRoute`, `RoleRoute`) only control what's *shown*,
   never what's *allowed*.
6. **Role-based authorization** — routes that should only be hit by certain roles add
   `authorize('admin')` (or any combination) after `protect`, e.g.
   `router.post('/', protect, authorize('admin'), createCourse)`.
7. **Password reset** — `forgot-password` generates a random token, stores only its SHA-256 hash
   in MongoDB (so a database leak can't be used to reset accounts) with a 30-minute expiry, and
   returns the plain token (in production this would be emailed instead). `reset-password/:token`
   re-hashes the incoming token and matches it against the stored hash before allowing a new
   password.

## 4. Installation

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
- A free Cloudinary account (needed once file-upload features are built)

### Backend
```bash
cd server
npm install
cp .env.example .env       # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm run dev                 # starts on http://localhost:5000
```

### Frontend
```bash
cd client
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                 # starts on http://localhost:5173
```

### Seed demo data
```bash
cd server
npm run seed
```
This creates 1 Admin, 2 Teachers, and 3 Students. Credentials are printed to the console — see
`server/utils/seedData.js`. **Demo data only — never run against production.**

## 5. Environment Variables

See `server/.env.example` and `client/.env.example` for the full list. Never commit a real `.env`
file — secrets (JWT secret, Cloudinary keys, MongoDB credentials) must stay out of version control.

## 6. API Overview (current)

| Method | Endpoint | Access | Description |
|--------|----------|--------|--------------|
| POST | `/api/auth/register` | Public | Create a student or teacher account |
| POST | `/api/auth/login` | Public | Log in, receive a JWT |
| POST | `/api/auth/logout` | Private | Clear auth cookie |
| GET  | `/api/auth/me` | Private | Get the current authenticated user |
| PUT  | `/api/auth/change-password` | Private | Change password while logged in |
| POST | `/api/auth/forgot-password` | Public | Request a password reset token |
| PUT  | `/api/auth/reset-password/:token` | Public | Reset password using a valid token |
| GET  | `/api/health` | Public | Health check |
| GET  | `/api/courses` | Private | List courses — scoped automatically: Admin sees all, Teacher sees assigned, Student sees enrolled. Supports `search`, `department`, `semester`, `status`, `teacher`, `page`, `limit` |
| POST | `/api/courses` | Admin | Create a course |
| GET  | `/api/courses/:id` | Private | Get one course (403 if a teacher/student isn't actually attached to it) |
| PUT  | `/api/courses/:id` | Admin | Update a course, including reassigning its teacher |
| DELETE | `/api/courses/:id` | Admin | Delete a course and clean up references on affected users |
| POST | `/api/courses/:id/enroll` | Admin | Enroll one or more students (`{ studentIds: [...] }`) |
| GET  | `/api/users` | Admin | List users — supports `role`, `search`, `department`, `status`, `page`, `limit` (also powers the teacher/student pickers) |
| GET  | `/api/users/:id` | Admin | Get one user |
| PUT  | `/api/users/:id/status` | Admin | Activate/deactivate an account |
| DELETE | `/api/users/:id` | Admin | Delete a user |
| GET  | `/api/assignments` | Private | List assignments — Teacher: own; Student: published assignments in enrolled courses (annotated with `mySubmission`/`submissionStatus`); Admin: all. Supports `course`, `status`, `page`, `limit` |
| POST | `/api/assignments` | Teacher/Admin | Create an assignment (`multipart/form-data`, optional `attachment` file) |
| GET  | `/api/assignments/:id` | Private | Get one assignment (403 if a student isn't enrolled or it's still a draft) |
| PUT  | `/api/assignments/:id` | Teacher (owner)/Admin | Update an assignment, optionally replacing its attachment |
| DELETE | `/api/assignments/:id` | Teacher (owner)/Admin | Delete an assignment, its Cloudinary attachment, and all its submissions |
| GET  | `/api/assignments/:id/submissions` | Teacher (owner)/Admin | Full roster: submitted students + not-yet-submitted students marked pending/late |
| POST | `/api/assignments/:id/submit` | Student | Submit or resubmit (`multipart/form-data`, `file` field) |
| PUT  | `/api/assignments/submissions/:id/grade` | Teacher (owner)/Admin | Grade a submission (`{ marks, feedback }`) |
| GET  | `/api/attendance/session?course=&date=` | Teacher (owner)/Admin | Enrolled roster merged with any attendance already marked that day |
| POST | `/api/attendance` | Teacher (owner)/Admin | Bulk mark/edit attendance (`{ course, date, records: [{ student, status }] }`) |
| GET  | `/api/attendance/course/:courseId/summary` | Teacher (owner)/Admin | Per-student present/total/percentage for a course |
| GET  | `/api/attendance/me` | Student | Own attendance percentage across every enrolled course |
| GET  | `/api/attendance/me/course/:courseId` | Student | Own full attendance history for one course |
| GET  | `/api/tests` | Private | List tests — Teacher: own; Student: published tests in enrolled courses (annotated with `attemptStatus`/`myScore`); Admin: all |
| POST | `/api/tests` | Teacher/Admin | Create a test (no questions yet — added separately) |
| GET  | `/api/tests/:id` | Private | Get one test — Teacher gets full detail incl. questions with correct answers; Student gets metadata only |
| PUT  | `/api/tests/:id` | Teacher (owner)/Admin | Update a test, including publish/unpublish |
| DELETE | `/api/tests/:id` | Teacher (owner)/Admin | Delete a test, its questions, and all attempts |
| POST | `/api/tests/:id/questions` | Teacher (owner)/Admin | Add an MCQ question |
| PUT  | `/api/tests/questions/:questionId` | Teacher (owner)/Admin | Edit a question |
| DELETE | `/api/tests/questions/:questionId` | Teacher (owner)/Admin | Delete a question |
| GET  | `/api/tests/:id/attempts` | Teacher (owner)/Admin | Every student's attempt (submitted + not-yet-started) |
| POST | `/api/tests/:id/start` | Student | Start or resume an attempt — returns questions **without** answer keys and a server-computed deadline |
| POST | `/api/tests/:id/submit` | Student | Submit answers — auto-grades MCQs and locks the attempt |
| GET  | `/api/tests/:id/my-result` | Student | Own result, respecting the test's configured result visibility |
| GET  | `/api/results/roster?course=&title=` | Teacher (owner)/Admin | Roster for one exam title, merged with any marks already entered |
| POST | `/api/results` | Teacher (owner)/Admin | Bulk enter/edit marks for a whole exam (`{ course, title, examType, maxMarks, status, records: [{ student, marksObtained }] }`) |
| PUT  | `/api/results/:id` | Teacher (owner)/Admin | Edit a single student's result row |
| GET  | `/api/results/course/:courseId/exams` | Teacher (owner)/Admin | List every exam entered for a course with averages |
| DELETE | `/api/results/course/:courseId/exam?title=` | Teacher (owner)/Admin | Delete an entire exam (all students' rows) |
| GET  | `/api/results/course/:courseId/performance` | Teacher (owner)/Admin | Average score per exam, for the course performance chart |
| GET  | `/api/results/me` | Student | Consolidated percentage + grade per enrolled course (exams + assignments + tests combined) |
| GET  | `/api/results/me/course/:courseId` | Student | Full component-by-component breakdown for one course |
| GET  | `/api/materials` | Private | List materials — Teacher: own courses; Student: enrolled courses; Admin: all. Supports `search`, `course`, `fileType`, pagination |
| POST | `/api/materials` | Teacher (course owner)/Admin | Upload a material (`multipart/form-data`, `file` field) |
| DELETE | `/api/materials/:id` | Teacher (uploader)/Admin | Delete a material and its Cloudinary file |
| GET  | `/api/announcements` | Private | List announcements — scoped per role (see below) |
| POST | `/api/announcements` | Teacher (own course only)/Admin | Create an announcement — platform-wide (Admin) or course-specific |
| PUT  | `/api/announcements/:id` | Owner/Admin | Edit an announcement, including publish/unpublish |
| DELETE | `/api/announcements/:id` | Owner/Admin | Delete an announcement |
| GET  | `/api/notifications` | Private | List the logged-in user's notifications + unread count |
| PUT  | `/api/notifications/:id/read` | Private | Mark one notification as read |
| PUT  | `/api/notifications/read-all` | Private | Mark every notification as read |
| GET  | `/api/dashboard/admin` | Admin | Institution-wide stats + chart data |
| GET  | `/api/dashboard/teacher` | Teacher | Own courses/submissions/attendance/performance stats + chart data |
| GET  | `/api/dashboard/student` | Student | Own courses, deadlines, attendance, recent results/announcements/materials |

Additional endpoints (Assignments, Attendance, Tests, Results, Materials, Announcements,
Notifications) will be documented here as each module is implemented.

## 9. Course Management — How It Works

- **Data model** (`models/Course.js`): a course stores a `teacher` reference and a `students`
  array of references — it does **not** embed full user documents. Each `User` also keeps
  `assignedCourses` / `enrolledCourses` arrays pointing back. Both sides are kept in sync in the
  controller (e.g. assigning a teacher adds the course to that teacher's `assignedCourses`, and
  removing them pulls it back out) — this two-way referencing is a standard MongoDB pattern for
  many-to-many relationships without duplicating data.
- **Scoped queries, not client-side filtering**: `getCourses` builds a different MongoDB query
  per role — `{ teacher: req.user._id }` for teachers, `{ students: req.user._id }` for students —
  so a teacher's "My Courses" list is only ever fetching courses the database itself will return,
  never all courses filtered on the frontend after the fact.
- **Defense in depth on details**: even after that scoping, `getCourseById` independently checks
  that the requesting teacher/student is actually attached to the course being opened, so guessing
  another course's ID in the URL returns a 403, not the data.
- **Search/filter/pagination**: `name`/`code` have a MongoDB text index for search; `department`,
  `semester`, and `status` are simple equality filters; results are paginated server-side and the
  frontend's `Pagination` component just renders whatever `{ page, pages, total }` the API returns.

## 10. Assignment System — How It Works

- **Two models, one relationship**: `Assignment` (owned by a teacher, belongs to a course) and
  `Submission` (one per student per assignment, enforced by a unique compound index on
  `{ assignment, student }`). A `Submission` document is only created once a student actually
  submits — there is no placeholder row pre-created for every enrolled student. "Pending" is
  computed, not stored: if no submission exists and the deadline hasn't passed, the frontend/
  backend treats it as pending; once the deadline passes with nothing submitted, it's treated as
  late.
- **File uploads**: `middleware/upload.js` is a small factory around `multer` +
  `multer-storage-cloudinary` — calling `createUploader('assignments')` or
  `createUploader('submissions')` gives each feature its own Cloudinary folder while sharing one
  configuration (file-type filter, 15MB size limit). Uploaded files never touch MongoDB directly —
  only the resulting Cloudinary `url` and `publicId` are stored, and `publicId` is used to delete
  the file from Cloudinary when a submission is replaced or an assignment is deleted, so storage
  doesn't accumulate orphaned files.
- **Ownership checks**: a teacher can only edit/delete/grade assignments and submissions that
  belong to a course they teach — checked server-side in `assertOwnsAssignment`, independent of
  whatever the frontend shows. Admin bypasses this check for oversight.
- **Automatic late detection**: `submitAssignment` compares `Date.now()` to the assignment's
  deadline at the moment of submission and stores `isLate` — this value doesn't change
  retroactively if the deadline is edited later, since it reflects what actually happened when the
  student submitted.
- **Grading**: `gradeSubmission` validates marks are within `[0, assignment.maxMarks]`, then sets
  the submission's `status` to `graded` and records who graded it and when — this is how a
  submission moves from `submitted`/`late` to `graded` in the UI.

## 11. Attendance System — How It Works

- **One row per student per session**: `Attendance` stores one document per
  `(course, student, date)`, not one document per class with an embedded student array. This
  makes "what percentage of classes has this student attended" a simple `count()` query rather
  than an aggregation over embedded arrays across many session documents — attendance percentage
  is read far more often (every dashboard load) than a session is written (once per class).
- **Idempotent marking**: dates are normalized to midnight UTC, and a unique index on
  `(course, student, date)` means marking or re-marking the same day for the same student always
  updates the same row via `bulkWrite` upserts — a teacher can reopen and edit a past day without
  creating duplicate records.
- **Percentage calculation**: `Present classes / Total classes × 100`, computed on read (not
  stored/cached), so it's always accurate as new sessions are added — exactly the formula
  specified. `ATTENDANCE_WARNING_THRESHOLD` in `.env` drives the "below threshold" warning shown
  on both the teacher's course summary and the student's own view, with the shared `AttendanceBar`
  component providing one consistent visual indicator across both.
- **Students cannot self-report**: every attendance-writing route (`POST /api/attendance`) is
  restricted to `authorize('teacher', 'admin')` — there is no route a student's token could call
  to modify their own attendance, satisfying the "students can't modify their own attendance"
  requirement at the API level, not just by hiding the button in the UI.

## 12. Test/Quiz System — How It Works

- **Three models**: `Test` (metadata — course, teacher, duration, start/end window, publish
  status, result-visibility setting), `Question` (its own collection, not embedded, so questions
  can be added/edited/deleted independently without rewriting the whole test document), and
  `TestAttempt` (one per student per test, enforced by a unique index — starting a test twice
  resumes the same attempt instead of creating a second one, and submitting locks it against
  re-attempts).
- **The answer key never reaches the student's browser before they finish**: `startTest` fetches
  questions with `.select('-correctOptionIndex')`, so the correct answer simply isn't in the HTTP
  response — there's nothing for browser devtools to inspect. Only `getTestById` (teacher-only)
  and `getMyResult` (after submission) ever include `correctOptionIndex`.
- **Server-issued deadlines**: the countdown timer's deadline is calculated once, from
  `attempt.startedAt + test.duration`, capped at the test's `endDate`, and returned by the
  `start` endpoint — refreshing the page re-fetches the same deadline rather than restarting the
  clock, so a student can't extend their time by reloading.
- **Auto-grading**: `submitTest` compares each submitted `selectedOptionIndex` against the
  question's stored `correctOptionIndex` and sums `marks` for correct answers — this is the
  "automatically evaluate objective questions" requirement, computed the moment a student submits.
- **Configurable result visibility**: a test's `resultVisibility` is `immediate` (default) or
  `after_end` (scores only become visible once the test window closes for everyone) — checked
  identically in `submitTest`'s response and in `getMyResult`, so an early finisher can't see
  their score and share it with classmates still taking the test when the teacher wants it withheld.
- **No cross-student access**: `getMyResult` always looks up `TestAttempt` by
  `{ test, student: req.user._id }` — there is no route parameter for an attempt ID a student
  could tamper with to view someone else's result.

## 13. Results & Marks — How It Works

- **A fourth model, not a duplicate of Submission/TestAttempt**: `Result` covers marks that don't
  come from an online submission or auto-graded quiz — midterms, finals, internal assessments —
  entered directly by the teacher. It deliberately does not duplicate assignment or test scores;
  instead, the consolidated views below pull all three sources together at read time.
- **Bulk entry mirrors the Attendance pattern**: `enterMarks` takes a whole class roster in one
  request and upserts via `bulkWrite` on the unique `(course, student, title)` index — reopening
  "Midterm Exam" to fix one student's score updates that row instead of creating a duplicate,
  exactly like re-marking a day of attendance.
- **Consolidated performance, computed on read**: `buildCoursePerformance` (shared by both
  `getMyPerformance` and `getMyCoursePerformance`) gathers a student's **published** `Result`
  rows, **graded** `Submission`s, and **submitted** `TestAttempt`s for a course, sums obtained vs.
  max marks across all of them, and derives one percentage and letter grade — nothing is
  duplicated or cached, so it's always consistent with the underlying assignment/test/exam data.
- **Grade scale in one place**: `utils/grade.js` maps a percentage to a letter grade (A+ through
  F) — changing the institution's grading policy means editing one array, not hunting through
  multiple controllers.
- **Draft/publish, same as Assignments and Tests**: a `Result` row is invisible to students until
  its `status` is `published`, and `buildCoursePerformance` filters on that — a teacher can enter
  provisional marks without students seeing them until they're finalized.
- **Charts**: both the teacher's course-performance page and the student's per-course results page
  use Recharts bar charts — the teacher sees average score per exam across the whole class, the
  student sees their own score per component (exam/assignment/test) within a course.

## 14. Study Materials — How It Works

- **Reuses the same upload factory as Assignments**: `createUploader('materials', { maxSizeMB: 25 })`
  gives study materials their own Cloudinary folder and a larger size limit (lecture slides run
  bigger than assignment submissions), but shares the exact same middleware as the Assignment
  module — no new upload logic was written for this feature.
- **File-type detection at upload time**: `detectFileType` buckets the original filename's
  extension into `pdf` / `doc` / `ppt` / `image` / `other` once, at upload, and stores it on the
  document — the frontend's file-type filter and icon are then a simple field match, not a
  runtime string-parse of the Cloudinary URL on every render.
- **Scoping mirrors Courses/Assignments**: `getMaterials` restricts the query to
  `{ course: { $in: teacherOwnCourseIds } }` for teachers and
  `{ course: { $in: enrolledCourseIds } }` for students — the same "scope the database query, not
  the frontend list" pattern used everywhere else in the app.
- **Cleanup on delete**: deleting a material removes the Cloudinary file via
  `cloudinary.uploader.destroy` before removing the database record, consistent with how
  Assignments and Submissions avoid leaving orphaned files in storage.

## 15. Announcements — How It Works

- **Two scoping mechanisms, one model**: an announcement is either **course-specific**
  (`course` is set — visible to that course's teacher and enrolled students regardless of
  `audience`) or **platform-wide** (`course` is `null` — visibility is decided by `audience`:
  `everyone`, `students`, or `teachers`). This lets an Admin post an institution-wide notice and a
  Teacher post a course-only one through the same endpoint and the same list.
- **"Authorized teachers" enforced server-side**: a teacher can only create a **course-specific**
  announcement, and only for a course they actually teach — `createAnnouncement` rejects a
  teacher's request outright if they omit a course or name one they don't own. Only Admin can post
  platform-wide.
- **Visibility built as a MongoDB query, not a frontend filter**: `getAnnouncements` constructs a
  different `$or` condition per role — e.g. a student's query is
  `{ status: 'published', course: { $in: enrolledCourseIds } } OR { status: 'published', course: null, audience: { $in: ['everyone', 'students'] } }`
  — the same "scope the database read" pattern used by Courses, Assignments, and Materials. A
  teacher's own drafts are included regardless of status so they can manage unpublished
  announcements, but nobody else's drafts ever appear in another user's feed.
- **One shared component, three roles**: `pages/common/Announcements.jsx` renders the same feed
  for Admin, Teacher, and Student — the create/edit/delete controls simply don't render for
  students, and what appears in the list is already exactly what that role should see, straight
  from the API.

## 16. Notifications — How It Works

- **Event-triggered, never scheduled**: notifications are created at the exact moment something
  happens in another controller — an assignment flips from draft to published, a submission gets
  graded, a test is published, an announcement goes out, marks are published, or a study material
  is uploaded. There is no cron job or polling worker generating them; `utils/notify.js` exports a
  single `notifyUsers(userIds, { type, title, message, link })` helper that each of those
  controllers calls inline, right after the action that makes the notification true actually
  succeeds.
- **Fails silently, by design**: `notifyUsers` catches and logs its own errors instead of
  re-throwing — a notification-insert failure should never roll back or block the assignment
  publish, grading, or announcement post that triggered it. The core action always completes; the
  notification is a best-effort side effect.
- **One row per (recipient, event)**: rather than one event document with a recipients array,
  `Notification` stores a separate row per recipient. This makes "mark as read for this one user"
  a trivial single-document update instead of manipulating a read-state array inside a shared
  document that many users would otherwise contend over.
- **Role-agnostic links**: a notification's `link` is stored without a role prefix (e.g.
  `assignments/<id>`, not `/student/assignments/<id>`), because the same announcement or material
  notification can go out to students and teachers alike. The frontend prefixes it with the
  current viewer's own role at click-time (`navigate(/${role}/${n.link})`), so the same stored
  link correctly routes each recipient to their own version of that page.
- **Bell + full page share one API**: both `NotificationBell` (topbar dropdown, polls every 30s)
  and the full `Notifications` page call the same `GET /api/notifications` endpoint and the same
  mark-as-read endpoints — there's no separate "preview" data shape to keep in sync with the full
  list.

## 17. Dashboards — How It Works

- **Every number is a live query, nothing precomputed**: `dashboardController.js` runs
  aggregation pipelines and counts directly against the real collections (`User`, `Course`,
  `Assignment`, `Submission`, `Test`, `Attendance`, `Announcement`, `Result`, `StudyMaterial`) on
  every request — there's no nightly job or cached snapshot that could drift from what the rest of
  the app shows. The spec's explicit requirement not to use fake statistics once the backend is
  integrated is met by construction: the dashboard endpoints simply don't have a code path that
  returns anything but a real query result.
- **One aggregation, not an app-side loop**: charts like "course distribution by department" and
  "student enrollment by department" use MongoDB's `$group`/`$project` aggregation pipeline
  directly, rather than fetching every course/user into Node and counting in JavaScript — this
  scales to the database doing the work it's good at, regardless of how large those collections get.
- **Scoped exactly like every other module**: the teacher dashboard's queries are filtered to
  `{ teacher: req.user._id }` / `{ course: { $in: ownCourseIds } }`, and the student dashboard's to
  `{ course: { $in: enrolledCourseIds } }` — the same "scope the database read, not the frontend
  view" pattern used throughout the app, so a teacher's dashboard can never leak another teacher's
  submission counts.
- **Recharts throughout**: Admin gets a bar chart (course distribution), a pie chart (attendance
  present/absent), a second bar chart (student enrollment), and a second pie chart (assignment
  submission statistics). Teacher gets a bar chart (average score per course) and a pie chart
  (attendance). Student's dashboard favors direct lists (deadlines, tests, results, announcements,
  materials) plus the shared `AttendanceBar` component, since a single attendance percentage reads
  more clearly as a bar than a chart.
- **Quick actions are just links**: the "Create Assignment" / "Mark Attendance" / "Create Test" /
  "Upload Material" buttons on the teacher dashboard, and "New course" / "Post announcement" on the
  admin dashboard, route straight to the relevant page's existing create flow — no separate
  quick-action-specific logic was built, keeping one code path per action.

## 18. Admin Panel — Students, Teachers, Reports, Settings

- **Students & Teachers management reuse the existing user API entirely**: `AdminStudents.jsx`
  and `AdminTeachers.jsx` are both built on `GET /api/users` (role-filtered, searchable,
  paginated) plus `PUT /api/users/:id/status` and `DELETE /api/users/:id` — all of which were
  already built and working via the backend since Module 2. No new backend endpoints were needed
  for this panel; it's frontend surfacing of API capability that existed but had no UI yet.
- **Detail pages show real relationships**: `StudentDetails.jsx` and `TeacherDetails.jsx` call
  `GET /api/users/:id`, which already populates `enrolledCourses`/`assignedCourses` — so a
  student's detail page genuinely lists the courses they're in (linking through to
  `CourseDetails`), not a static profile card.
- **Activate/deactivate takes effect immediately at login**: toggling a user's `isActive` status
  is enforced in `middleware/auth.js`'s `protect` function — a deactivated user's existing JWT
  stops working on their very next request, not just at their next login.
- **Reports is a read-only recombination, not new data**: `AdminReports.jsx` reuses
  `GET /api/dashboard/admin` for the summary stats and `GET /api/courses` for the course
  breakdown table, then adds a client-side CSV export (built with a `Blob` and a synthetic
  download link — no backend export endpoint needed for a report this size).
- **Settings is one shared page, not three**: `pages/common/Settings.jsx` is used by Admin,
  Teacher, and Student alike — profile display plus a change-password form calling the existing
  `PUT /api/auth/change-password` endpoint from Module 1. Same "one component, role-agnostic"
  pattern as Announcements and Notifications.

## 7. User Roles

- **Admin** — manages users, courses, teacher assignments, announcements, and views
  institution-wide reports.
- **Teacher** — manages assigned courses, assignments, attendance, tests, grading, and materials.
- **Student** — views enrolled courses, submits work, tracks attendance/results, takes tests.

## 8. Future Improvements

Every module in the original spec is built. Genuine remaining ideas, none of which block a demo:

- **Scheduled reminders** — the spec's "assignment deadline" and "test reminder" notifications
  need a scheduled job (e.g. a cron-style worker checking for upcoming deadlines); everything else
  in Notifications is event-triggered off real actions, which a scheduler can't provide on its own.
- **Real email delivery** — password reset currently returns the token directly in the API
  response for demo purposes instead of emailing it (see `forgotPassword` in
  `authController.js`); swapping in Nodemailer/SendGrid would be a drop-in change.
- **Seed data beyond users** — `seedData.js` creates demo accounts only; extending it with sample
  courses/assignments/tests would make a fresh clone demoable without manually clicking through
  the UI first.
- **Automated tests** — the project has been manually syntax-checked (`node --check`) throughout
  development, but has no unit/integration test suite yet.
- **Production deployment** — works locally against a local or Atlas MongoDB instance; a
  production deployment would add process management (PM2), a reverse proxy, and environment
  hardening beyond what's in `.env.example`.
