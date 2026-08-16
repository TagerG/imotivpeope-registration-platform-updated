"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/Lib/supabase";
import { toast } from "sonner";

type Person = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  id_document_url?: string | null;
  created_at?: string | null;
};

type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
};

type SortField = "full_name" | "date_of_birth" | "gender" | "phone_number";
type SortOrder = "asc" | "desc";

export default function AdminPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>("");

  // Search, Filter, Sort & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & Active Tab State
  const [activeTab, setActiveTab] = useState<"records" | "logs">("records");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Person | null>(null);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = "/Login"; 
        return;
      }

      setAdminEmail(session.user.email || "Admin");
      await Promise.all([fetchPeople(), fetchLogs()]);
    }

    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  async function fetchPeople() {
    setLoading(true);
    const { data, error } = await supabase.from("people").select("*");
    if (error) toast.error("Error fetching people records.");
    else setPeople(data || []);
    setLoading(false);
  }

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setLogs(data || []);
  }

  async function logAction(action: string, targetId: string, details: string) {
    await supabase.from("audit_logs").insert([
      {
        admin_email: adminEmail,
        action,
        target_id: targetId,
        details,
      },
    ]);
    fetchLogs();
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  const processedPeople = useMemo(() => {
    let result = people.filter((p) =>
      p.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.phone_number?.includes(debouncedSearch) ||
      p.id.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    result.sort((a, b) => {
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [people, debouncedSearch, sortField, sortOrder]);

  const totalPages = Math.ceil(processedPeople.length / pageSize) || 1;
  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedPeople.slice(start, start + pageSize);
  }, [processedPeople, currentPage, pageSize]);

  // CRUD Actions
  async function confirmDelete() {
    if (!deleteTargetId) return;

    const { error } = await supabase.from("people").delete().eq("id", deleteTargetId);
    if (error) {
      toast.error("Failed to delete record: " + error.message);
    } else {
      toast.success("Record deleted successfully!");
      await logAction("DELETE_RECORD", deleteTargetId, "Deleted registration entry");
      setPeople((prev) => prev.filter((p) => p.id !== deleteTargetId));
      if (selectedPerson?.id === deleteTargetId) setSelectedPerson(null);
    }
    setDeleteTargetId(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFormData) return;

    const { error } = await supabase
      .from("people")
      .update({
        full_name: editFormData.full_name,
        date_of_birth: editFormData.date_of_birth,
        gender: editFormData.gender,
        phone_number: editFormData.phone_number,
      })
      .eq("id", editFormData.id);

    if (error) {
      toast.error("Failed to update record: " + error.message);
    } else {
      toast.success("Record updated successfully!");
      await logAction("UPDATE_RECORD", editFormData.id, `Updated details for ${editFormData.full_name}`);
      setPeople((prev) =>
        prev.map((p) => (p.id === editFormData.id ? editFormData : p))
      );
      setEditFormData(null);
    }
  }

  function exportToCSV() {
    if (processedPeople.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const headers = ["ID", "Full Name", "Date of Birth", "Gender", "Phone Number"];
    const rows = processedPeople.map((p) => [
      `"${p.id}"`,
      `"${p.full_name}"`,
      `"${p.date_of_birth || ""}"`,
      `"${p.gender || ""}"`,
      `"${p.phone_number || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registration_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully!");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Emotiv People Registration</h1>
          <p className="text-gray-500 text-sm">Logged in as: <span className="font-semibold text-gray-700">{adminEmail}</span></p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
        >
          Export to CSV
        </button>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{people.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Records</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{processedPeople.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className={`h-3 w-3 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <p className="text-xl font-bold text-gray-800">{loading ? "Syncing..." : "Connected"}</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("records")}
          className={`pb-2 text-sm font-medium border-b-2 ${activeTab === "records" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          Registration Records
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2 text-sm font-medium border-b-2 ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          Audit Logs ({logs.length})
        </button>
      </div>

      {activeTab === "records" ? (
        <>
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-4">ID</th>
                  <th onClick={() => handleSort("full_name")} className="p-4 cursor-pointer select-none hover:text-black">
                    Full Name {sortField === "full_name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("date_of_birth")} className="p-4 cursor-pointer select-none hover:text-black">
                    Date of Birth {sortField === "date_of_birth" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("gender")} className="p-4 cursor-pointer select-none hover:text-black">
                    Gender {sortField === "gender" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("phone_number")} className="p-4 cursor-pointer select-none hover:text-black">
                    Phone Number {sortField === "phone_number" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">Loading records...</td>
                  </tr>
                ) : paginatedPeople.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No records found.</td>
                  </tr>
                ) : (
                  paginatedPeople.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-xs text-gray-500">{person.id.slice(0, 8)}...</td>
                      <td className="p-4 font-medium text-gray-900">{person.full_name}</td>
                      <td className="p-4">{person.date_of_birth || "-"}</td>
                      <td className="p-4">{person.gender || "-"}</td>
                      <td className="p-4">{person.phone_number || "-"}</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => setSelectedPerson(person)} className="text-blue-600 hover:underline">View</button>
                        <button onClick={() => setEditFormData(person)} className="text-amber-600 hover:underline">Edit</button>
                        <button onClick={() => setDeleteTargetId(person.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t text-sm text-gray-600 bg-gray-50">
              <span>Showing {paginatedPeople.length} of {processedPeople.length} records</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs View */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target ID</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No activity logged yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-4 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4 font-medium">{log.admin_email}</td>
                    <td className="p-4 font-semibold text-blue-600">{log.action}</td>
                    <td className="p-4 font-mono text-xs">{log.target_id.slice(0, 8)}...</td>
                    <td className="p-4 text-gray-700">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Detail Modal & Storage Document Viewer */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Record Details</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>ID:</strong> {selectedPerson.id}</p>
              <p><strong>Full Name:</strong> {selectedPerson.full_name}</p>
              <p><strong>Date of Birth:</strong> {selectedPerson.date_of_birth || "-"}</p>
              <p><strong>Gender:</strong> {selectedPerson.gender || "-"}</p>
              <p><strong>Phone:</strong> {selectedPerson.phone_number || "-"}</p>
              {selectedPerson.id_document_url && (
                <div className="pt-2">
                  <p className="font-semibold mb-1">Uploaded ID Document:</p>
                  <img
                    src={selectedPerson.id_document_url}
                    alt="Uploaded ID Document"
                    className="w-full h-40 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedPerson(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-md text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Confirm Deletion</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Edit Record</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full border p-2 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.date_of_birth || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full border p-2 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Gender</label>
                <input
                  type="text"
                  value={editFormData.gender || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full border p-2 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                  className="w-full border p-2 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditFormData(null)}
                className="bg-gray-200 px-4 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}