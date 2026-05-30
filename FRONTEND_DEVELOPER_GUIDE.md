# Frontend Developer Guide

This document explains how to consume the API exposed by this server from a browser frontend.

## 1. Quick Summary

- Server runtime: Bun + Express
- Default port: `3000`
- Base URL in local development: `http://localhost:3000`
- API prefix: `/api`
- Auth: Better Auth with cookie-based sessions
- Database-backed entities: users, students, projects, scores

## 2. Important Integration Notes

1. Requests must send JSON bodies.
2. Browser requests that need auth must include cookies.
3. The server currently does not register CORS middleware in `index.ts`.
4. If the frontend runs on a different origin, the browser will block requests unless CORS or a proxy is added.
5. Auth cookies are configured as secure in `auth.ts`. If login works on the backend but the browser does not persist the session over plain HTTP, check the cookie security settings first.
6. The backend expects the frontend to guard role-based actions. Some endpoints return `403 Forbidden` for non-admin users.

### Recommended frontend environment variable

Use a single API base URL in your frontend app:

```bash
VITE_API_URL=http://localhost:3000
```

Or, if you are using Next.js:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 3. Data Model Reference

### User

Relevant fields:

- `id`
- `name`
- `email`
- `role` - `"admin"` or `"student"`
- `emailVerified`
- `image`
- `createdAt`
- `updatedAt`

### Student

- `id`
- `firstName`
- `lastName`
- `email`
- `createdAt`

### Project

- `id`
- `title`
- `description`
- `assignedBy` - user id
- `submittedAt` - date string
- `status` - `"pending" | "submitted" | "reviewed"`
- `createdAt`

### Score

- `id`
- `studentId`
- `projectId`
- `category` - `"assignment" | "presentation" | "classwork"`
- `score`
- `recordedAt`

## 4. Authentication

Auth is mounted under:

```text
/api/auth/*
```

The exact Better Auth endpoints are handled by the library, so frontend code should treat auth as a cookie session system and not a custom handcrafted login API.

### What the frontend should do

- Use the auth routes provided by Better Auth for sign-in, sign-out, and session retrieval.
- Always include credentials when calling protected endpoints.
- Treat `401 Unauthorized` as "not logged in".
- Treat `403 Forbidden` as "logged in, but not allowed".

### Fetch requirement for protected routes

Use:

```js
fetch(url, {
  credentials: "include",
});
```

Without `credentials: "include"`, cookie-based auth will not work reliably across requests.

## 5. API Endpoints

## Health

### `GET /api/health`

Purpose:

- Basic health check for the server.

Response:

```json
{ "message": "API called successfully" }
```

---

## Students

Base path:

```text
/api/students
```

### `GET /api/students`

Auth:

- Required

Behavior:

- Returns all students.
- If there are no students, the server responds with `400`.

Response:

```json
{
  "message": "Student fetch complete",
  "students": []
}
```

### `GET /api/students/all`

Auth:

- Required
- Admin only

Behavior:

- Returns detailed student records with nested project and score relations.

Response shape:

```json
{
  "students": [
    {
      "id": "student-id",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "createdAt": "2026-05-30T00:00:00.000Z",
      "studentProjects": [
        {
          "studentId": "student-id",
          "projectId": "project-id",
          "project": {
            "id": "project-id",
            "title": "Project title"
          }
        }
      ],
      "scores": [
        {
          "id": "score-id",
          "studentId": "student-id",
          "projectId": "project-id",
          "category": "assignment",
          "score": 85,
          "recordedAt": "2026-05-30T00:00:00.000Z",
          "project": {
            "id": "project-id",
            "title": "Project title"
          }
        }
      ]
    }
  ]
}
```

### `POST /api/students/new`

Auth:

- Required

Body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com"
}
```

Response:

```json
{
  "message": "Student created successfully",
  "student": {
    "id": "generated-id",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "createdAt": "2026-05-30T00:00:00.000Z"
  }
}
```

### `PATCH /api/students/:id`

Auth:

- Required

Body:

```json
{
  "firstName": "Janet",
  "lastName": "Doe",
  "email": "janet@example.com"
}
```

Response:

```json
{
  "meessage": "Student edited successfully",
  "student": {
    "id": "student-id",
    "firstName": "Janet",
    "lastName": "Doe",
    "email": "janet@example.com"
  }
}
```

Note:

- The response key is spelled `meessage` in the backend. Do not depend on that key name for UI logic if you can avoid it.

### `DELETE /api/students/:id`

Auth:

- Required

Response:

```json
{ "message": "Student deleted successfully" }
```

## Projects

Base path:

```text
/api/projects
```

### `GET /api/projects`

Auth:

- Required

Behavior:

- Returns all projects.
- If none exist, returns a message instead of an empty array.

Response:

```json
{
  "message": "Projects fetched successfully",
  "projects": []
}
```

Empty-state response:

```json
{ "message": "No projects as of yet" }
```

### `POST /api/projects/new`

Auth:

- Required
- Admin only

Body:

```json
{
  "studentIds": ["student-1", "student-2"],
  "title": "Math Portfolio",
  "description": "Term project",
  "submittedAt": "2026-06-01"
}
```

Notes:

- `studentIds` must be a non-empty array.
- `submittedAt` should be a date string. The database column is a date, so `YYYY-MM-DD` is the safest format.
- The backend creates the project and then inserts rows into the join table `student_projects`.

Response:

```json
{
  "message": "Project assigned successfully",
  "project": {
    "id": "generated-project-id",
    "title": "Math Portfolio",
    "description": "Term project",
    "assignedBy": "admin-user-id",
    "submittedAt": "2026-06-01",
    "status": "pending",
    "createdAt": "2026-05-30T00:00:00.000Z"
  }
}
```

### `PATCH /api/projects/:id`

Auth:

- Required

Body:

```json
{
  "title": "Updated Project Title",
  "description": "Updated description"
}
```

Notes:

- The backend requires `title` to be present.
- This endpoint updates project metadata only. It does not change assigned students.

Response:

```json
{ "message": "Project edited successfully" }
```

### `DELETE /api/projects/:id`

Auth:

- Required

Response:

```json
{ "message": "Project deleted successfully" }
```

## Scores

Base path:

```text
/api/scores
```

### `POST /api/scores/new`

Auth:

- Required
- Admin only

Body:

```json
{
  "studentId": "student-id",
  "projectId": "project-id",
  "category": "assignment",
  "score": 90
}
```

Validation rules:

- All fields are required.
- The student must already be assigned to the project in `student_projects`.
- `category` must be one of:
  - `assignment`
  - `presentation`
  - `classwork`

Response:

```json
{
  "message": "Score set successfully",
  "score": {
    "category": "assignment",
    "score": 90,
    "studentId": "student-id",
    "projectId": "project-id"
  }
}
```

### `GET /api/scores/:studentId`

Auth:

- Required
- Admin only

Behavior:

- Returns every score for the requested student.
- Includes nested project details.

Response:

```json
{
  "scores": [
    {
      "id": "score-id",
      "studentId": "student-id",
      "projectId": "project-id",
      "category": "assignment",
      "score": 90,
      "recordedAt": "2026-05-30T00:00:00.000Z",
      "project": {
        "id": "project-id",
        "title": "Math Portfolio"
      }
    }
  ]
}
```

## 6. Vanilla JS Examples

### Shared request helper

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed: ${res.status}`);
  }

  return data;
}
```

### Fetch students

```js
async function loadStudents() {
  const data = await api("/api/students");
  console.log(data.students);
}
```

### Create a student

```js
async function createStudent() {
  const payload = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
  };

  const data = await api("/api/students/new", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(data.student);
}
```

### Create a project

```js
async function createProject() {
  const payload = {
    studentIds: ["student-1", "student-2"],
    title: "Math Portfolio",
    description: "Term project",
    submittedAt: "2026-06-01",
  };

  const data = await api("/api/projects/new", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(data.project);
}
```

### Set a score

```js
async function setScore() {
  const payload = {
    studentId: "student-id",
    projectId: "project-id",
    category: "assignment",
    score: 95,
  };

  const data = await api("/api/scores/new", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(data.score);
}
```

## 7. React Examples

### API helper

```js
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}
```

### Example component: student list

```jsx
import { useEffect, useState } from "react";
import { api } from "./api";

export function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await api("/api/students");
        if (active) setStudents(data.students || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {students.map((student) => (
        <li key={student.id}>
          {student.firstName} {student.lastName} - {student.email}
        </li>
      ))}
    </ul>
  );
}
```

### Example component: create student form

```jsx
import { useState } from "react";
import { api } from "./api";

export function CreateStudentForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await api("/api/students/new", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setMessage(`Created: ${data.student.firstName} ${data.student.lastName}`);
      setForm({ firstName: "", lastName: "", email: "" });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.firstName}
        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        placeholder="First name"
      />
      <input
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        placeholder="Last name"
      />
      <input
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Create student"}
      </button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
```

## 8. Role-Based UI Guidance

The backend uses `session.user.role` to gate some routes.

Recommended frontend behavior:

- Hide admin-only actions from student users.
- Still keep server-side checks in place, because the UI should not be the only protection.
- If you load the session object in the frontend, use `role` to decide which controls to render.

Suggested UI permissions:

- Admin:
  - Create students
  - Edit students
  - Delete students
  - Create projects
  - Edit projects
  - Delete projects
  - Assign scores
  - View scores for any student
- Student:
  - View their own visible data, if your frontend exposes it
  - Non-admin routes may still be available, but admin-only endpoints will reject them

## 9. Practical Notes And Caveats

1. There is no dedicated endpoint for "unassign student from project" or "add student to existing project" after creation.
2. `POST /api/projects/new` creates both the project row and the many-to-many links in one request.
3. `GET /api/projects` and `GET /api/students` do not always return the same shape when empty, so check both `data.projects` and `data.message`.
4. Some handlers log errors to the server console instead of returning a structured error body. Your frontend should always handle network failure and unexpected empty responses.
5. If you are building a production frontend, confirm the auth cookie behavior in a secure HTTPS environment.

## 10. Suggested Frontend Checklist

- Use one API client wrapper for all requests.
- Always send `credentials: "include"` for protected routes.
- Use JSON request bodies only.
- Handle `401`, `403`, `400`, and `500` distinctly in the UI.
- Hide admin-only controls when `role !== "admin"`.
- Normalize empty responses in the UI before rendering.
- Keep `submittedAt` in `YYYY-MM-DD` format.

## 11. Endpoint Summary

| Method | Path | Auth | Role | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | No | Any | Health check |
| GET | `/api/students` | Yes | Any logged-in user | List students |
| GET | `/api/students/all` | Yes | Admin | List students with nested relations |
| POST | `/api/students/new` | Yes | Any logged-in user | Create student |
| PATCH | `/api/students/:id` | Yes | Any logged-in user | Update student |
| DELETE | `/api/students/:id` | Yes | Any logged-in user | Delete student |
| GET | `/api/projects` | Yes | Any logged-in user | List projects |
| POST | `/api/projects/new` | Yes | Admin | Create project and assign students |
| PATCH | `/api/projects/:id` | Yes | Any logged-in user | Update project |
| DELETE | `/api/projects/:id` | Yes | Any logged-in user | Delete project |
| POST | `/api/scores/new` | Yes | Admin | Create score |
| GET | `/api/scores/:studentId` | Yes | Admin | List scores for a student |

