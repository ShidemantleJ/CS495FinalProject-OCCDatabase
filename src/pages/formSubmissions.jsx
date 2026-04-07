import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { databaseAPI } from "../api";

export default function FormSubmissions() {
  const navigate = useNavigate();
  const MAX_CONTENT_HEIGHT_REM = 7;
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editContentText, setEditContentText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
    if (checkingAdmin || !isAdmin) return;

    const loadTemplates = async () => {
      setLoadingTemplates(true);
      setErrorMessage("");

      const { data, error } = await databaseAPI.list("form_templates", {
        select: "id, event_name",
        orderBy: { column: "event_name", ascending: true },
      });

      if (error) {
        setErrorMessage("Failed to load form templates.");
        setTemplates([]);
      } else {
        const safeTemplates = data || [];
        setTemplates(safeTemplates);

        if (safeTemplates.length > 0) {
          setSelectedTemplateId(String(safeTemplates[0].id));
        }
      }

      setLoadingTemplates(false);
    };

    loadTemplates();
  }, [checkingAdmin, isAdmin]);

  useEffect(() => {
    if (checkingAdmin || !isAdmin) return;

    if (!selectedTemplateId) {
      setSubmissions([]);
      return;
    }

    const loadSubmissions = async () => {
      setLoadingSubmissions(true);
      setErrorMessage("");

      const { data, error } = await databaseAPI.list("form_submissions", {
        filters: [
          {
            column: "form_template_id",
            op: "eq",
            value: Number(selectedTemplateId),
          },
        ],
        orderBy: { column: "id", ascending: false },
      });

      if (error) {
        setErrorMessage("Failed to load form submissions.");
        setSubmissions([]);
      } else {
        setSubmissions(data || []);
      }

      setLoadingSubmissions(false);
    };

    loadSubmissions();
  }, [selectedTemplateId, checkingAdmin, isAdmin]);

  const renderFormContent = (content) => {
    if (!content) return "";
    if (typeof content === "string") return content;
    return JSON.stringify(content, null, 2);
  };

  const isContentLong = (contentText) => {
    const lineCount = contentText.split("\n").length;
    return lineCount > 6 || contentText.length > 400;
  };

  const toggleExpanded = (submissionId) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const openEditModal = (submission) => {
    setEditingSubmission(submission);
    setEditContentText(
      submission.form_content
        ? JSON.stringify(submission.form_content, null, 2)
        : ""
    );
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingSubmission) return;
    let parsed;
    try {
      parsed = JSON.parse(editContentText);
    } catch {
      setEditError("Invalid JSON. Please fix the content before saving.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    const { error } = await databaseAPI.update("form_submissions", editingSubmission.id, { form_content: parsed });
    setEditSaving(false);
    if (error) {
      setEditError(`Save failed: ${error.message}`);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === editingSubmission.id ? { ...s, form_content: parsed } : s
        )
      );
      setEditingSubmission(null);
    }
  };

  const handleTransferConfirm = async () => {
    if (!pendingTransfer) return;
    setTransferring(true);
    setErrorMessage("");
    const { error } = await databaseAPI.transferForm(pendingTransfer.id);
    setTransferring(false);
    setPendingTransfer(null);
    if (error) {
      setErrorMessage(`Transfer failed: ${error.message}`);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === pendingTransfer.id
            ? { ...s, transferred_at: new Date().toISOString() }
            : s
        )
      );
    }
  };

  if (checkingAdmin) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Form Submissions</h1>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <label className="block text-sm font-medium mb-2">Form Template</label>
        <div className="flex items-center gap-3">
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full md:w-96 border rounded-md p-2 bg-white"
          disabled={loadingTemplates || templates.length === 0}
        >
          {loadingTemplates && <option>Loading templates...</option>}
          {!loadingTemplates && templates.length === 0 && <option>No templates found</option>}
          {!loadingTemplates &&
            templates.map((template) => (
              <option key={template.id} value={String(template.id)}>
                {template.event_name || "Unnamed Template"}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={() => navigate("/edit-templates")}
          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
        >
          Manage Templates
        </button>
        </div>
      </div>

      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

      {loadingSubmissions ? (
        <p>Loading submissions...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Content</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No submissions for this template.
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => {
                  const contentText = renderFormContent(submission.form_content);
                  const expanded = !!expandedSubmissions[submission.id];
                  const showToggle = isContentLong(contentText);

                  return (
                    <tr key={submission.id}>
                      <td className="px-4 py-3 align-top">{submission.id}</td>
                      <td className="px-4 py-3 align-top">{submission.form_template_name || ""}</td>
                      <td className="px-4 py-3">
                        <pre
                          className="text-xs whitespace-pre-wrap break-words max-w-3xl"
                          style={
                            expanded
                              ? undefined
                              : { maxHeight: `${MAX_CONTENT_HEIGHT_REM}rem`, overflow: "hidden" }
                          }
                        >
                          {contentText}
                        </pre>
                        {showToggle && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(submission.id)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </td>
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
                          {submission.transferred_at ? (
                            <span className="text-green-600 text-sm font-medium px-1">Transferred</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingTransfer(submission)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Transfer this submission"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Edit Form Content</h2>
            <p className="text-sm text-gray-500">Submission ID: {editingSubmission.id}</p>
            <textarea
              className="w-full h-72 border rounded-md p-2 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editContentText}
              onChange={(e) => setEditContentText(e.target.value)}
              disabled={editSaving}
              spellCheck={false}
            />
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
    </div>
  );
}
