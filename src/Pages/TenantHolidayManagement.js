import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import { HiHome } from "react-icons/hi";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../Pages/lightbill.css";

const API = (process.env.REACT_APP_API_BASE || "http://localhost:8000/api").trim();

const emptyForm = {
  tenantId: "",
  fromDate: "",
  toDate: "",
};

const toISODate = (value) => {
  if (!value) return "";
  // handles both ISO strings and Date objects
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const toDisplayDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-GB").format(new Date(value)); // dd/mm/yyyy
  } catch {
    return "";
  }
};

const getTotalDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

/**
 * ✅ TenantHolidayManagement
 * - Use embedded={true} when you want it inside another page/panel.
 * - When embedded=true, it hides top nav buttons.
 */
export default function TenantHolidayManagement({ embedded = false }) {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const hideNav = embedded === true;

  const tenantMap = useMemo(() => {
    const m = new Map();
    (tenants || []).forEach((t) => m.set(String(t._id), t));
    return m;
  }, [tenants]);

  const safeJson = async (res, label) => {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${label} failed (${res.status})`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${label} returned non-JSON response`);
    }
  };

  const loadData = async () => {
    try {
      const [tRes, hRes] = await Promise.all([
        fetch(`${API}`), // backend formRoutes: GET /api -> all tenants
        fetch(`${API}/tenant-holidays`),
      ]);

      const [tData, hData] = await Promise.all([
        safeJson(tRes, "Tenants API"),
        safeJson(hRes, "Holiday API"),
      ]);

      setTenants(Array.isArray(tData) ? tData : []);
      setHolidays(Array.isArray(hData) ? hData : []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load holiday data");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditId(row._id);

    setForm({
      tenantId: String(row.tenantId || ""),
      fromDate: row.fromDate ? toISODate(row.fromDate) : "",
      toDate: row.toDate ? toISODate(row.toDate) : "",
    });

    setShowModal(true);
  };

  const saveHoliday = async () => {
    if (!form.tenantId) return alert("Please select tenant");
    if (!form.fromDate || !form.toDate)
      return alert("Please select from/to dates");

    if (new Date(form.fromDate) > new Date(form.toDate)) {
      return alert("From date cannot be after To date");
    }

    try {
      const payload = {
        tenantId: form.tenantId,
        fromDate: form.fromDate,
        toDate: form.toDate,
      };

      const url = editId
        ? `${API}/tenant-holidays/${editId}`
        : `${API}/tenant-holidays`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      alert(editId ? "Holiday updated" : "Holiday saved");
      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save holiday");
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday record?")) return;

    try {
      const res = await fetch(`${API}/tenant-holidays/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete holiday");
    }
  };

  const markReturned = async (id) => {
    try {
      const res = await fetch(`${API}/tenant-holidays/${id}/return`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to mark returned");
    }
  };

  return (
    <div className={`p-2 ${embedded ? "" : "container-fluid"}`}>
      {/* ✅ Panel wrapper (same as your dashboard style) */}
      <div className="sd-panel">
        {!hideNav && (
          <div className="d-flex gap-2 mb-3 thm-top-actions">
            <button
              className="btn"
              style={{ backgroundColor: "#3db7b1", color: "white" }}
              onClick={() => navigate("/NewComponant")}
            >
              <HiHome className="me-1" />
              Rent & Deposit
            </button>

            <button
              className="btn btn-dark"
              onClick={() => navigate("/maindashboard")}
            >
              <FaArrowLeft className="me-1" />
              Back
            </button>
          </div>
        )}

        {/* ✅ Same header style */}
        <div className="section-title mb-3">
          <span className="section-icon">
            <FaCalendarAlt />
          </span>
          <span className="section-text">Tenant Holiday Management</span>
        </div>

        <div className="filter-bar mb-3 d-flex justify-content-end thm-filter-bar">
          <button
            className="btn"
            style={{ backgroundColor: "rgb(85, 114, 241)", color: "white" }}
            onClick={openAdd}
          >
            <FaPlus className="me-1" />
            Add Holiday
          </button>
        </div>

        <div className="light-table-wrapper holiday-table-wrap">
          <table className="table light-bill-table mb-0">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Total Days</th>
                <th>Status</th>
                <th className="text-nowrap" style={{ minWidth: 220 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {holidays.map((row) => {
                const tenant = tenantMap.get(String(row.tenantId));
                const totalDays =
                  row.totalDays || getTotalDays(row.fromDate, row.toDate);

                return (
                  <tr key={row._id}>
                    <td>{row.tenantName || tenant?.name || "-"}</td>
                    <td>{row.fromDate ? toDisplayDate(row.fromDate) : "-"}</td>
                    <td>{row.toDate ? toDisplayDate(row.toDate) : "-"}</td>
                    <td>{totalDays}</td>

                    <td>
                      <span
                        className={`badge ${
                          row.status === "active" ? "bg-danger" : "bg-success"
                        }`}
                      >
                        {row.status === "active" ? "Active" : "Returned"}
                      </span>
                    </td>

                    <td className="text-nowrap">
                      <div className="d-flex flex-wrap justify-content-center gap-2 thm-action-btns">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openEdit(row)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteHoliday(row._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>

                        {row.status !== "returned" && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => markReturned(row._id)}
                            title="Mark Returned"
                          >
                            <FaCheckCircle className="me-1" />
                            Returned
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!holidays.length && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No holiday records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Modal */}
        {showModal && (
          <div
            className="modal d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editId ? "Edit Holiday" : "Add Holiday"}
                  </h5>

                  {/* ✅ Your preferred close button structure */}
                  <button
                    type="button"
                    className="modal-x-btn"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <label className="form-label">Tenant</label>
                  <select
                    className="form-select mb-3"
                    value={form.tenantId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tenantId: e.target.value }))
                    }
                    disabled={Boolean(editId)}
                  >
                    <option value="">Select tenant</option>
                    {tenants.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control mb-3"
                    value={form.fromDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fromDate: e.target.value }))
                    }
                  />

                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.toDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, toDate: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>

                  <button className="btn btn-primary" onClick={saveHoliday}>
                    {editId ? "Save Changes" : "Save Holiday"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
