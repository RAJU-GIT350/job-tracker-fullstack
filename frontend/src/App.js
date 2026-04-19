import React, { useEffect, useState } from "react";
import "./App.css";

// ✅ ONE LINE FIX — works on localhost AND after deployment!
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "",
    applied_date: "",
    response_days: ""
  });

  // FETCH JOBS
  const fetchJobs = () => {
    fetch(`${API}/jobs`)
      .then(res => res.json())
      .then(data => setJobs(data.data));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ADD / UPDATE JOB
  const handleSubmit = (e) => {
    e.preventDefault();

    const url = editId
      ? `${API}/update-job/${editId}`
      : `${API}/add-job`;

    const method = editId ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        fetchJobs();
        setForm({
          company: "",
          role: "",
          status: "",
          applied_date: "",
          response_days: ""
        });
        setEditId(null);
      });
  };

  // DELETE JOB
  const deleteJob = (id) => {
    fetch(`${API}/delete-job/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(() => fetchJobs());
  };

  return (
    <div className="container">
      <h1 className="title">🚀 Job Tracker</h1>

      {/* FORM */}
      <div className="card">
        <form onSubmit={handleSubmit} className="form">

          <input name="company" placeholder="Company"
            value={form.company} onChange={handleChange} required />

          <input name="role" placeholder="Role"
            value={form.role} onChange={handleChange} required />

          <select name="status"
            value={form.status}
            onChange={handleChange}
            required>
            <option value="">Select Status</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input type="date"
            name="applied_date"
            value={form.applied_date}
            onChange={handleChange}
            required />

          <input name="response_days" placeholder="Days"
            value={form.response_days}
            onChange={handleChange}
            required />

          <button type="submit">
            {editId ? "Update Job" : "Add Job"}
          </button>

        </form>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
      />

      {/* FILTER */}
      <select
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px" }}
      >
        <option value="">All</option>
        <option value="Applied">Applied</option>
        <option value="Interview">Interview</option>
        <option value="Rejected">Rejected</option>
      </select>

      {/* DASHBOARD CARDS */}
      <div className="stats">
        <div className="card-box">
          <h3>Total</h3>
          <p>{jobs.length}</p>
        </div>

        <div className="card-box">
          <h3>Applied</h3>
          <p>{jobs.filter(j => j.status === "Applied").length}</p>
        </div>

        <div className="card-box">
          <h3>Interview</h3>
          <p>{jobs.filter(j => j.status === "Interview").length}</p>
        </div>

        <div className="card-box">
          <h3>Rejected</h3>
          <p>{jobs.filter(j => j.status === "Rejected").length}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {jobs
              .filter(job =>
                job.company.toLowerCase().includes(search.toLowerCase())
              )
              .filter(job =>
                filter ? job.status === filter : true
              )
              .map(job => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.company}</td>
                  <td>{job.role}</td>
                  <td>
                    <span className={`badge ${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </td>

                  <td>
                    <button onClick={() => {
                      setForm(job);
                      setEditId(job.id);
                    }}>
                      Edit
                    </button>

                    <button onClick={() => {
                      if (window.confirm("Delete this job?")) {
                        deleteJob(job.id);
                      }
                    }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;