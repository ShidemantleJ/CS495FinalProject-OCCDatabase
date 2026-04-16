import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { databaseAPI } from "../api";
import ChurchDropdown from "../components/ChurchDropdown";

export default function FormSubmissionDetail() {
  const navigate = useNavigate();
  const { templateId } = useParams();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateFields, setTemplateFields] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editFieldValues, setEditFieldValues] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [pendingUndo, setPendingUndo] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [churches, setChurches] = useState([]);
  const [isAddingNewChurch, setIsAddingNewChurch] = useState(false);

  const CHURCH_FIELD_NAMES = new Set(["church_id", "church_affiliation_id"]);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const adminStatus = await databaseAPI.checkAdmin();

      if (!isMounted) return;

      setIsAdmin(adminStatus);
      setCheckingAdmin(false);

      if (!adminStatus) {
        navigate("/", { replace: true });
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (checkingAdmin || !isAdmin || !templateId) return;

    const loadData = async () => {
      setLoadingSubmissions(true);
      setErrorMessage("");

      const [templateResult, submissionsResult, churchesResult] = await Promise.all([
        databaseAPI.list("form_templates", {
          select: "id, event_name, fields",
          filters: [{ column: "id", op: "eq", value: templateId }],
        }),
        databaseAPI.list("form_submissions", {
          filters: [
            {
              column: "form_template_id",
              op: "eq",
              value: templateId,
            },
          ],
          orderBy: { column: "id", ascending: false },
        }),
        databaseAPI.list("church2", {
          select: "id, church_name, church_physical_city, church_physical_state, church_physical_county",
          orderBy: { column: "church_name", ascending: true },
        }),
      ]);

      if (churchesResult.data) {
        setChurches(
          churchesResult.data.sort((a, b) =>
            (a.church_name || "").localeCompare(b.church_name || "")
          )
        );
      }

      if (templateResult.data && templateResult.data.length > 0) {
        setTemplateName(templateResult.data[0].event_name || "Unnamed Template");
        setTemplateFields(Array.isArray(templateResult.data[0].fields) ? templateResult.data[0].fields : []);
      }

      if (submissionsResult.error) {
        setErrorMessage("Failed to load form submissions.");
        setSubmissions([]);
      } else {
        setSubmissions(submissionsResult.data || []);
      }

      setLoadingSubmissions(false);
    };

    loadData();
  }, [checkingAdmin, isAdmin, templateId]);

  const prettifyKey = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const renderFieldValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getFieldEntries = (content) => {
    if (!content || typeof content !== "object") return [];
    return Object.entries(content);
  };

  const getLabelForKey = (key) => {
    const field = templateFields.find((f) => f.name === key);
    return field?.form_name || prettifyKey(key);
  };

  const toggleExpanded = (id) =>
    setExpandedSubmissions((prev) => ({ ...prev, [id]: !prev[id] }));

  const resolveDisplayValue = (key, value) => {
    if (CHURCH_FIELD_NAMES.has(key)) {
      const church = churches.find((c) => c.id === value);
      return church ? church.church_name : renderFieldValue(value);
    }
    return renderFieldValue(value);
  };

  const getSummary = (content) => {
    if (!content || typeof content !== "object") return "—";
    const pairs = Object.entries(content)
      .slice(0, 3)
      .map(([k, v]) => `${getLabelForKey(k)}: ${resolveDisplayValue(k, v) || "—"}`);
    return pairs.join(" · ");
  };

  const openEditModal = (submission) => {
    setEditingSubmission(submission);
    setEditFieldValues(
      submission.form_content && typeof submission.form_content === "object"
        ? { ...submission.form_content }
        : {}
    );
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingSubmission) return;
    setEditSaving(true);
    setEditError("");
    const { error } = await databaseAPI.update(
      "form_submissions",
      editingSubmission.id,
      { form_content: editFieldValues }
    );
    setEditSaving(false);
    if (error) {
      setEditError(`Save failed: ${error.message}`);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === editingSubmission.id ? { ...s, form_content: editFieldValues } : s
        )
      );
      setEditingSubmission(null);
    }
  };

  const handleTransferConfirm = async () => {
    if (!pendingTransfer) return;
    setTransferring(true);
    setErrorMessage("");
    const { data: insertedRow, error } = await databaseAPI.transferForm(pendingTransfer.id);
    setTransferring(false);
    setPendingTransfer(null);
    if (error) {
      setErrorMessage(`Transfer failed: ${error.message}`);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === pendingTransfer.id
            ? { ...s, transferred_at: new Date().toISOString(), transferred_row_id: insertedRow?.id ?? null }
            : s
        )
      );
    }
  };

  const handleUndoConfirm = async () => {
    if (!pendingUndo) return;
    setUndoing(true);
    setErrorMessage("");
    const { error } = await databaseAPI.undoTransfer(pendingUndo.id);
    setUndoing(false);
    setPendingUndo(null);
    if (error) {
      setErrorMessage(`Undo failed: ${error.message}`);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === pendingUndo.id
            ? { ...s, transferred_at: null, transferred_row_id: null }
            : s
        )
      );
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    setDeleting(true);
    setErrorMessage("");
    const { error } = await databaseAPI.delete("form_submissions", submissionToDelete.id);
    setDeleting(false);
    if (error) {
      setErrorMessage(`Delete failed: ${error.message}`);
    }
    // Close modal and update state regardless of error, error message will show
    setShowDeleteModal(false);
    if (!error) {
      setSubmissions((prev) =>
        prev.filter((s) => s.id !== submissionToDelete.id)
      );
    }
    setSubmissionToDelete(null);
  };

  if (checkingAdmin) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 md:px-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate("/form-submissions")}
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title="Back to templates"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">{templateName}</h1>
      </div>

      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

      {loadingSubmissions ? (
        <p>Loading submissions...</p>
      ) : (() => {
        const pending = submissions.filter((s) => !s.transferred_at);
        const transferred = submissions.filter((s) => s.transferred_at);

        const renderContentCell = (submission) => {
          const entries = getFieldEntries(submission.form_content);
          const expanded = !!expandedSubmissions[submission.id];
          return entries.length === 0 ? (
            <span className="text-gray-400 text-sm italic">No content</span>
          ) : (
            <div>
              {!expanded && (
                <p className="text-sm text-gray-600 truncate max-w-xl">
                  {getSummary(submission.form_content)}
                </p>
              )}
              {expanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-w-3xl mt-1">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {getLabelForKey(key)}
                      </label>
                      <input
                        readOnly
                        value={resolveDisplayValue(key, value)}
                        className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-800 cursor-default focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleExpanded(submission.id)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                {expanded ? "▲ Collapse" : "▼ Expand"}
              </button>
            </div>
          );
        };

        return (
          <>
            {/* Pending submissions */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Pending</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Content</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pending.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                        No pending submissions.
                      </td>
                    </tr>
                  ) : (
                    pending.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-4 py-3 align-top text-sm">{submission.id}</td>
                        <td className="px-4 py-3">{renderContentCell(submission)}</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(submission)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit form content"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingTransfer(submission)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Transfer this submission"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteModal(true);
                                setSubmissionToDelete(submission);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete submission"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>

            {/* Transferred submissions */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Transferred</h2>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Content</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferred.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No transferred submissions yet.
                        </td>
                      </tr>
                    ) : (
                      transferred.map((submission) => (
                        <tr key={submission.id}>
                          <td className="px-4 py-3 align-top text-sm">{submission.id}</td>
                          <td className="px-4 py-3">{renderContentCell(submission)}</td>
                          <td className="px-4 py-3 align-top text-sm text-gray-500 whitespace-nowrap">
                            {new Date(submission.transferred_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPendingUndo(submission)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Undo transfer (removes row from destination table)"
                              >
                                ↩
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteModal(true);
                                  setSubmissionToDelete(submission);
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete submission"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Edit Form Content</h2>
            <p className="text-sm text-gray-500">Submission ID: {editingSubmission.id}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {getFieldEntries(editingSubmission.form_content).map(([key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {getLabelForKey(key)}
                  </label>
                  {CHURCH_FIELD_NAMES.has(key) ? (
                    <ChurchDropdown
                      churches={churches}
                      selectedName={churches.find(c => c.id === editFieldValues[key])?.church_name || ""}
                      isAddingNew={isAddingNewChurch}
                      setIsAddingNew={setIsAddingNewChurch}
                      onSelect={async (name) => {
                        const { data } = await databaseAPI.list("church2", {
                          select: "id, church_name, church_physical_city, church_physical_state, church_physical_county",
                          orderBy: { column: "church_name", ascending: true },
                        });
                        if (data) {
                          const sorted = data.sort((a, b) => (a.church_name || "").localeCompare(b.church_name || ""));
                          setChurches(sorted);
                          const found = sorted.find(c => c.church_name === name);
                          setEditFieldValues((prev) => ({ ...prev, [key]: found ? found.id : null }));
                        }
                      }}
                    />
                  ) : (
                  <input
                    type="text"
                    value={renderFieldValue(editFieldValues[key])}
                    onChange={(e) =>
                      setEditFieldValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    disabled={editSaving}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                  />
                  )}
                </div>
              ))}
            </div>
            {editError && <p className="text-red-600 text-sm">{editError}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                disabled={editSaving}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-3">Confirm Transfer</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to transfer this form to{" "}
              <span className="font-mono font-semibold">&apos;{pendingTransfer.destination_table}&apos;</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingTransfer(null)}
                disabled={transferring}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferConfirm}
                disabled={transferring}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {transferring ? "Transferring..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingUndo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-3">Undo Transfer</h2>
            <p className="text-gray-700 mb-2">
              This will <span className="font-semibold text-red-600">permanently delete</span> the transferred row from{" "}
              <span className="font-mono font-semibold">&apos;{pendingUndo.destination_table}&apos;</span> and mark this submission as not yet transferred.
            </p>
            <p className="text-sm text-gray-500 mb-6">Submission ID: {pendingUndo.id}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingUndo(null)}
                disabled={undoing}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUndoConfirm}
                disabled={undoing}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {undoing ? "Undoing..." : "Undo Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-3">Delete Submission</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete submission ID {submissionToDelete?.id}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSubmissionToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmission}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
