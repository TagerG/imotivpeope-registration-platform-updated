"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/Lib/supabase";
import { toast } from "sonner";

type AdminAccess = {
  role: string;
  permissions: string[];
};

type Person = {
  id: string;
  registration_id: string | null;
  id_number: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  email: string | null;
  passport_url: string | null;
  valid_id_url: string | null;
  created_at: string | null;
};

type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
};

type SortField =
  | "full_name"
  | "date_of_birth"
  | "gender"
  | "phone_number";

type SortOrder = "asc" | "desc";

type AdminPermission = {
  value: string;
  label: string;
  description: string;
};

const PEOPLE_COLUMNS =
  "id, registration_id, id_number, full_name, date_of_birth, gender, phone_number, email, passport_url, valid_id_url, created_at";

const AVAILABLE_ADMIN_PERMISSIONS: AdminPermission[] = [
  {
    value: "people.read",
    label: "View registration records",
    description: "View and search registered people.",
  },
  {
    value: "people.update",
    label: "Edit registration records",
    description: "Update registration details.",
  },
  {
    value: "people.delete",
    label: "Delete registration records",
    description: "Delete registration entries.",
  },
  {
    value: "audit_logs.view",
    label: "View audit logs",
    description: "View recorded administrative activity.",
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const isActive = pathname === "/admin";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-gray-200 bg-white max-md:relative max-md:h-auto max-md:w-full max-md:border-r-0 max-md:border-b">
      <div className="flex h-20 items-center border-b border-gray-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
          E
        </div>

        <div className="ml-3">
          <p className="text-base font-bold tracking-tight text-gray-900">
            Emotiv
          </p>

          <p className="text-xs text-gray-500">Administration</p>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </p>

        <a
          href="/admin"
          aria-current={isActive ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
            isActive
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25A1.5 1.5 0 0 1 5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25Z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 8h8M8 12h8M8 16h5"
            />
          </svg>

          <span>Admin</span>

          <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
        </a>
      </nav>

      <div className="border-t border-gray-100 p-4">
        <p className="text-xs text-gray-400">
          Emotiv People Registration
        </p>
      </div>
    </aside>
  );
}

export default function AdminPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [activeTab, setActiveTab] = useState<
    "records" | "logs" | "admins"
  >("records");

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Person | null>(null);

  // Super Admin: create additional administrator accounts.
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPermissions, setNewAdminPermissions] = useState<string[]>([
    "people.read",
  ]);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const isSuperAdmin = adminAccess?.role === "super_admin";

  const can = useCallback(
    (permission: string) =>
      isSuperAdmin || Boolean(adminAccess?.permissions.includes(permission)),
    [adminAccess, isSuperAdmin]
  );

  const canReadPeople = can("people.read");
  const canUpdatePeople = can("people.update");
  const canDeletePeople = can("people.delete");
  const canReadLogs = can("audit_logs.view");

  const fetchPeople = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("people")
      .select(PEOPLE_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Unable to load registration records: ${error.message}`);
      setPeople([]);
    } else {
      setPeople((data ?? []) as Person[]);
    }

    setLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, admin_email, action, target_id, details, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setLogs([]);
      return false;
    }

    setLogs((data ?? []) as AuditLog[]);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setAccessLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !session) {
        window.location.replace("/login");
        return;
      }

      setAdminEmail(session.user.email || "Admin");

      const { data: accessData, error: accessError } = await supabase.rpc(
        "get_my_admin_access"
      );

      if (cancelled) return;

      if (accessError || !accessData || !accessData.role) {
        toast.error(
          "Your administrator access could not be verified. Please contact the Super Admin."
        );

        setAccessLoading(false);
        setLoading(false);
        return;
      }

      const access = accessData as AdminAccess;

      setAdminAccess(access);
      setAccessLoading(false);

      if (
        access.role !== "super_admin" &&
        !access.permissions.includes("people.read")
      ) {
        if (access.permissions.includes("audit_logs.view")) {
          setActiveTab("logs");
          await fetchLogs();
        } else {
          toast.error(
            "You do not have permission to access this dashboard."
          );
        }

        setLoading(false);
        return;
      }

      await fetchPeople();

      if (
        access.role === "super_admin" ||
        access.permissions.includes("audit_logs.view")
      ) {
        await fetchLogs();
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [fetchPeople, fetchLogs]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Create an administrator through the protected server-side API.
  async function handleCreateAdmin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isSuperAdmin) {
      toast.error(
        "Only the Super Admin can create administrator accounts."
      );
      return;
    }

    const email = newAdminEmail.trim().toLowerCase();

    if (!email) {
      toast.error("Enter the administrator's email address.");
      return;
    }

    if (newAdminPermissions.length === 0) {
      toast.error("Select at least one permission.");
      return;
    }

    setCreatingAdmin(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        toast.error("Your session has expired. Please log in again.");
        window.location.replace("/login");
        return;
      }

      const response = await fetch("/api/admin-users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          permissions: newAdminPermissions,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(
          result?.error ||
            result?.message ||
            "Unable to create the administrator account."
        );
        return;
      }

      toast.success(
        result?.message ||
          `Administrator invitation sent to ${email}.`
      );

      setNewAdminEmail("");
      setNewAdminPermissions(["people.read"]);

      if (canReadLogs) {
        await fetchLogs();
      }
    } catch (error) {
      console.error("Create administrator error:", error);

      toast.error(
        "A network error occurred while creating the administrator."
      );
    } finally {
      setCreatingAdmin(false);
    }
  }

  function toggleAdminPermission(permission: string) {
    setNewAdminPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  async function logAction(
    action: string,
    targetId: string,
    details: string
  ) {
    const { error } = await supabase.from("audit_logs").insert({
      admin_email: adminEmail,
      action,
      target_id: targetId,
      details,
    });

    if (error) {
      toast.error(
        `The record change succeeded, but audit logging failed: ${error.message}`
      );

      return false;
    }

    if (canReadLogs) {
      await fetchLogs();
    }

    return true;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  const processedPeople = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    const result = people.filter(
      (person) =>
        person.full_name?.toLowerCase().includes(query) ||
        person.phone_number?.includes(debouncedSearch) ||
        person.registration_id?.toLowerCase().includes(query) ||
        person.id_number?.toLowerCase().includes(query) ||
        person.id.toLowerCase().includes(query)
    );

    result.sort((a, b) => {
      const valueA = (a[sortField] || "").toString().toLowerCase();
      const valueB = (b[sortField] || "").toString().toLowerCase();

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;

      return 0;
    });

    return result;
  }, [people, debouncedSearch, sortField, sortOrder]);

  const totalPages = Math.ceil(processedPeople.length / pageSize) || 1;

  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return processedPeople.slice(start, start + pageSize);
  }, [processedPeople, currentPage, pageSize]);

  async function confirmDelete() {
    if (!deleteTargetId || !canDeletePeople) {
      toast.error("You do not have permission to delete records.");
      return;
    }

    const target = people.find((person) => person.id === deleteTargetId);

    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      toast.error(`Failed to delete record: ${error.message}`);
      return;
    }

    setPeople((previous) =>
      previous.filter((person) => person.id !== deleteTargetId)
    );

    if (selectedPerson?.id === deleteTargetId) {
      setSelectedPerson(null);
    }

    setDeleteTargetId(null);

    toast.success("Record deleted successfully.");

    await logAction(
      "DELETE_RECORD",
      deleteTargetId,
      `Deleted registration entry for ${target?.full_name ?? "unknown person"}`
    );
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editFormData || !canUpdatePeople) {
      toast.error("You do not have permission to update records.");
      return;
    }

    const updatedFields = {
      full_name: editFormData.full_name,
      date_of_birth: editFormData.date_of_birth || null,
      gender: editFormData.gender || null,
      phone_number: editFormData.phone_number || null,
    };

    const { data, error } = await supabase
      .from("people")
      .update(updatedFields)
      .eq("id", editFormData.id)
      .select(PEOPLE_COLUMNS)
      .maybeSingle();

    if (error) {
      toast.error(`Failed to update record: ${error.message}`);
      return;
    }

    if (!data) {
      toast.error(
        "No record was updated. Check your permissions and whether the record still exists."
      );
      return;
    }

    const updatedPerson = data as Person;

    setPeople((previous) =>
      previous.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person
      )
    );

    setEditFormData(null);

    toast.success("Record updated successfully.");

    await logAction(
      "UPDATE_RECORD",
      updatedPerson.id,
      `Updated details for ${updatedPerson.full_name}`
    );
  }

  function exportToCSV() {
    if (!canReadPeople) {
      toast.error("You do not have permission to export registration records.");
      return;
    }

    if (processedPeople.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const escapeCSV = (value: string | null | undefined) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Registration ID",
      "Permanent ID Number",
      "Full Name",
      "Date of Birth",
      "Gender",
      "Phone Number",
    ];

    const rows = processedPeople.map((person) => [
      escapeCSV(person.registration_id),
      escapeCSV(person.id_number),
      escapeCSV(person.full_name),
      escapeCSV(person.date_of_birth),
      escapeCSV(person.gender),
      escapeCSV(person.phone_number),
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `registration_records_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("CSV report downloaded successfully.");
  }

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="ml-60 p-8 max-md:ml-0 max-md:p-5">
          <p className="text-sm text-gray-500">
            Verifying administrator permissions...
          </p>
        </main>
      </div>
    );
  }

  if (!adminAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="ml-60 p-8 max-md:ml-0 max-md:p-5">
          <h1 className="text-xl font-bold text-gray-900">
            Administrator access unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Your account could not be verified as an administrator. Please
            contact the Super Admin.
          </p>
        </main>
      </div>
    );
  }

  if (
    !isSuperAdmin &&
    !adminAccess.permissions.includes("people.read") &&
    !adminAccess.permissions.includes("audit_logs.view")
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="ml-60 p-8 max-md:ml-0 max-md:p-5">
          <h1 className="text-xl font-bold text-gray-900">
            Access restricted
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Your account does not currently have permission to view records or
            audit logs.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-60 min-h-screen p-8 max-md:ml-0 max-md:p-5">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Admin Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Emotiv People Registration
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Logged in as:{" "}
                <span className="font-semibold text-gray-700">
                  {adminEmail}
                </span>
                {" · "}
                <span className="font-semibold">
                  {isSuperAdmin ? "Super Admin" : adminAccess.role}
                </span>
              </p>
            </div>

            {canReadPeople && (
              <button
                onClick={exportToCSV}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
              >
                Export to CSV
              </button>
            )}
          </header>

          {canReadPeople && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Registered
                </p>

                <p className="mt-2 text-3xl font-extrabold text-gray-900">
                  {people.length}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Active Records
                </p>

                <p className="mt-2 text-3xl font-extrabold text-blue-600">
                  {processedPeople.length}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  System Status
                </p>

                <div className="mt-2 flex items-center space-x-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      loading
                        ? "animate-pulse bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  <p className="text-xl font-bold text-gray-800">
                    {loading ? "Syncing..." : "Connected"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 border-b border-gray-200">
            {canReadPeople && (
              <button
                onClick={() => setActiveTab("records")}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  activeTab === "records"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Registration Records
              </button>
            )}

            {canReadLogs && (
              <button
                onClick={() => setActiveTab("logs")}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  activeTab === "logs"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Audit Logs ({logs.length})
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("admins")}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  activeTab === "admins"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Admin Management
              </button>
            )}
          </div>

          {activeTab === "records" && canReadPeople ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
                <input
                  type="text"
                  placeholder="Search by name, phone, or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full max-w-md rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <label htmlFor="page-size">Rows per page:</label>

                  <select
                    id="page-size"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded border px-2 py-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                      <tr>
                        <th className="p-4">Registration ID</th>

                        <th
                          onClick={() => handleSort("full_name")}
                          className="cursor-pointer select-none p-4 hover:text-black"
                        >
                          Full Name{" "}
                          {sortField === "full_name" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>

                        <th
                          onClick={() => handleSort("date_of_birth")}
                          className="cursor-pointer select-none p-4 hover:text-black"
                        >
                          Date of Birth{" "}
                          {sortField === "date_of_birth" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>

                        <th
                          onClick={() => handleSort("gender")}
                          className="cursor-pointer select-none p-4 hover:text-black"
                        >
                          Gender{" "}
                          {sortField === "gender" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>

                        <th
                          onClick={() => handleSort("phone_number")}
                          className="cursor-pointer select-none p-4 hover:text-black"
                        >
                          Phone Number{" "}
                          {sortField === "phone_number" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>

                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 text-center text-gray-500"
                          >
                            Loading records...
                          </td>
                        </tr>
                      ) : paginatedPeople.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 text-center text-gray-500"
                          >
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        paginatedPeople.map((person) => (
                          <tr
                            key={person.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap p-4 font-mono text-xs text-gray-500">
                              {person.registration_id ||
                                person.id_number ||
                                person.id}
                            </td>

                            <td className="p-4 font-medium text-gray-900">
                              {person.full_name}
                            </td>

                            <td className="whitespace-nowrap p-4">
                              {person.date_of_birth || "-"}
                            </td>

                            <td className="p-4">
                              {person.gender || "-"}
                            </td>

                            <td className="whitespace-nowrap p-4">
                              {person.phone_number || "-"}
                            </td>

                            <td className="whitespace-nowrap p-4 text-right">
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => setSelectedPerson(person)}
                                  className="text-blue-600 hover:underline"
                                >
                                  View
                                </button>

                                {canUpdatePeople && (
                                  <button
                                    onClick={() =>
                                      setEditFormData({ ...person })
                                    }
                                    className="text-amber-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                )}

                                {canDeletePeople && (
                                  <button
                                    onClick={() =>
                                      setDeleteTargetId(person.id)
                                    }
                                    className="text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 p-4 text-sm text-gray-600">
                  <span>
                    Showing {paginatedPeople.length} of{" "}
                    {processedPeople.length} records
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(page - 1, 1))
                      }
                      className="rounded border bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <span>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        )
                      }
                      className="rounded border bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === "logs" && canReadLogs ? (
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Admin Email</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target ID</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-4 text-center text-gray-500"
                        >
                          No activity logged yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap p-4 text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>

                          <td className="p-4 font-medium">
                            {log.admin_email}
                          </td>

                          <td className="p-4 font-semibold text-blue-600">
                            {log.action}
                          </td>

                          <td className="p-4 font-mono text-xs">
                            {log.target_id?.slice(0, 8) || "-"}...
                          </td>

                          <td className="p-4 text-gray-700">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "admins" && isSuperAdmin ? (
            <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create Administrator
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Invite a new administrator and choose which permissions
                  their account will have.
                </p>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-6">
                <div>
                  <label
                    htmlFor="new-admin-email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Administrator Email Address
                  </label>

                  <input
                    id="new-admin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="administrator@example.com"
                    value={newAdminEmail}
                    onChange={(event) =>
                      setNewAdminEmail(event.target.value)
                    }
                    className="w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    An invitation will be sent to this email address.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    Assign Permissions
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {AVAILABLE_ADMIN_PERMISSIONS.map((permission) => (
                      <label
                        key={permission.value}
                        className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <input
                          type="checkbox"
                          checked={newAdminPermissions.includes(
                            permission.value
                          )}
                          onChange={() =>
                            toggleAdminPermission(permission.value)
                          }
                          className="mt-1 h-4 w-4 accent-blue-600"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-gray-800">
                            {permission.label}
                          </span>

                          <span className="mt-1 block text-xs text-gray-500">
                            {permission.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {newAdminPermissions.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      Select at least one permission before creating the
                      administrator.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Permission reminder
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    Give each administrator only the access they need.
                    Assign deletion and audit-log permissions carefully.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    creatingAdmin || newAdminPermissions.length === 0
                  }
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingAdmin
                    ? "Sending Invitation..."
                    : "Create Administrator"}
                </button>
              </form>
            </section>
          ) : (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              This section is unavailable for your assigned permissions.
            </div>
          )}
        </div>
      </main>

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="text-xl font-bold">Record Details</h2>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Registration ID:</strong>{" "}
                {selectedPerson.registration_id || "-"}
              </p>

              <p>
                <strong>Permanent ID Number:</strong>{" "}
                {selectedPerson.id_number || "-"}
              </p>

              <p>
                <strong>Full Name:</strong> {selectedPerson.full_name}
              </p>

              <p>
                <strong>Date of Birth:</strong>{" "}
                {selectedPerson.date_of_birth || "-"}
              </p>

              <p>
                <strong>Gender:</strong> {selectedPerson.gender || "-"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {selectedPerson.phone_number || "-"}
              </p>

              <p>
                <strong>Email:</strong> {selectedPerson.email || "-"}
              </p>

              {selectedPerson.passport_url && (
                <div className="pt-2">
                  <p className="mb-1 font-semibold">Passport Photograph</p>

                  <img
                    src={selectedPerson.passport_url}
                    alt="Passport photograph"
                    className="h-40 w-full rounded border object-contain"
                  />
                </div>
              )}

              {selectedPerson.valid_id_url && (
                <div className="pt-2">
                  <p className="mb-1 font-semibold">Valid ID Document</p>

                  <img
                    src={selectedPerson.valid_id_url}
                    alt="Valid ID document"
                    className="h-40 w-full rounded border object-contain"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPerson(null)}
              className="w-full rounded-md bg-gray-200 py-2 text-sm font-medium transition hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {deleteTargetId && canDeletePeople && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Confirm Deletion
            </h2>

            <p className="text-sm text-gray-600">
              Are you sure you want to delete this record? This action cannot
              be undone.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {editFormData && canUpdatePeople && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md space-y-4 rounded-lg bg-white p-6"
          >
            <h2 className="text-xl font-bold">Edit Record</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Full Name
                </label>

                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      full_name: event.target.value,
                    })
                  }
                  className="w-full rounded-md border p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={editFormData.date_of_birth || ""}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      date_of_birth: event.target.value || null,
                    })
                  }
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Gender
                </label>

                <input
                  type="text"
                  value={editFormData.gender || ""}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      gender: event.target.value || null,
                    })
                  }
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={editFormData.phone_number || ""}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      phone_number: event.target.value || null,
                    })
                  }
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditFormData(null)}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
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