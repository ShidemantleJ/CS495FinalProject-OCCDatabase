import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaTrash, FaArrowLeft } from "react-icons/fa";
import { databaseAPI } from "../api";

export default function EditTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFieldsError, setEditFieldsError] = useState("");

  // Expandable fields
  const [expandedFields, setExpandedFields] = useState({});

  const toggleFieldsExpanded = (id) =>
    setExpandedFields((prev) => ({ ...prev, [id]: !prev[id] }));

  const formatFields = (fields) => {
    if (!fields) return "—";
    if (typeof fields === "string") return fields;
    return JSON.stringify(fields, null, 2);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    setErrorMessage("");

    const { data, error } = await databaseAPI.getTemplates();

    if (error) {
      setErrorMessage("Failed to load form templates.");
      setTemplates([]);
    } else {
      setTemplates(data || []);
    }

    setLoadingTemplates(false);
  };

  const handleEditClick = (template) => {
    setEditingId(template.id);
    setEditFieldsError("");
    setEditForm({
      template_name: template.template_name || "",
      type: template.type || "",
      start_date: template.start_date || "",
      end_date: template.end_date || "",
      fields: template.fields ? JSON.stringify(template.fields, null, 2) : "",
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = async (templateId) => {
    let parsedFields = editForm.fields;
    if (editForm.fields && editForm.fields.trim() !== "") {
      try {
        parsedFields = JSON.parse(editForm.fields);
      } catch {
        setEditFieldsError("Invalid JSON in Fields.");
        return;
      }
    } else {
      parsedFields = null;
    }
    setEditFieldsError("");
    const { error } = await databaseAPI.update("form_templates", templateId, {
      ...editForm,
      fields: parsedFields,
    });
    if (error) {
      setErrorMessage("Failed to update template.");
      return;
    }
    setEditingId(null);
    setEditForm({});
    await loadTemplates();
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    setDeletingId(templateId);
    const { error } = await databaseAPI.deleteTemplate(templateId);
    if (error) {
      setErrorMessage("Failed to delete template.");
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
    setDeletingId(null);
  };


  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/form-submissions")}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to Form Submissions"
          >
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-3xl font-bold">Form Templates</h1>
        </div>
      </div>

      {errorMessage && (
        <p className="text-red-600 mb-4">{errorMessage}</p>
      )}

      {loadingTemplates ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">No templates found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => {
                const isEditing = editingId === template.id;
                return (
                  <tr key={template.id}>

                    {/* Template Name */}
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.template_name}
                          onChange={(e) => setEditForm({ ...editForm, template_name: e.target.value })}
                          className="border rounded-md px-2 py-1 w-full text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{template.template_name || template.name || "—"}</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="border rounded-md px-2 py-1 w-full text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{template.type || "—"}</span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                          className="border rounded-md px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{template.start_date || "—"}</span>
                      )}
                    </td>

                    {/* End Date */}
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                          className="border rounded-md px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{template.end_date || "—"}</span>
                      )}
                    </td>

                    {/* Fields */}
                    <td className="px-4 py-3 align-top max-w-xs">
                      {isEditing ? (
                        <div>
                          <textarea
                            value={editForm.fields}
                            onChange={(e) => {
                              setEditFieldsError("");
                              setEditForm({ ...editForm, fields: e.target.value });
                            }}
                            rows={6}
                            className="border rounded-md px-2 py-1 w-full text-xs font-mono"
                            placeholder="null"
                          />
                          {editFieldsError && (
                            <p className="text-red-500 text-xs mt-1">{editFieldsError}</p>
                          )}
                        </div>
                      ) : (() => {
                        const text = formatFields(template.fields);
                        const isLong = text !== "—" && text.split("\n").length > 4;
                        const expanded = !!expandedFields[template.id];
                        return text === "—" ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <div>
                            <pre
                              className="text-xs font-mono whitespace-pre-wrap break-words"
                              style={expanded ? undefined : { maxHeight: "5rem", overflow: "hidden" }}
                            >
                              {text}
                            </pre>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() => toggleFieldsExpanded(template.id)}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                {expanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditSave(template.id)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Edit template"
                              onClick={() => handleEditClick(template)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <FaCog size={16} />
                            </button>
                            <button
                              title="Delete template"
                              onClick={() => handleDelete(template.id)}
                              disabled={deletingId === template.id}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              <FaTrash size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
