import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaTrash, FaArrowLeft } from "react-icons/fa";
import { databaseAPI } from "../api";
import Select from 'react-select';

export default function EditTemplates() {
  const navigate = useNavigate();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [validTables, setValidTables] = useState([]);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState({ event_name: "", destination_table: "", start_date: "", end_date: "" });

  // Table column fields state
  const [tableColumnsCache, setTableColumnsCache] = useState({});
  const [editTableColumns, setEditTableColumns] = useState([]);
  const [newTableColumns, setNewTableColumns] = useState([]);

  // Field builder modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState("edit"); // "edit" | "create"

  const SQL_TYPE_MAP = {
    text: "text", "character varying": "text", varchar: "text", char: "text", character: "text", citext: "text",
    integer: "number", bigint: "number", smallint: "number", numeric: "number", decimal: "number", real: "number", "double precision": "number",
    date: "date", timestamp: "date", "timestamp with time zone": "date", "timestamp without time zone": "date",
    boolean: "select",
    jsonb: "textarea", json: "textarea",
  };

  const mapSqlType = (sqlType) => SQL_TYPE_MAP[sqlType?.toLowerCase()] || "text";

  const TYPE_VARIANTS = {
    text:     ["text", "textarea", "bubble-select", "multi-select"],
    textarea: ["text", "textarea", "bubble-select", "multi-select"],
    number:   ["number", "phone", "zip"],
    date:     ["date"],
    select:   ["select"],
  };

  const TYPE_LABEL = {
    "text":          "Text",
    "textarea":      "Text Area",
    "bubble-select": "Bubble Select",
    "multi-select":  "Multi Select",
    "number":        "Number",
    "phone":         "Phone Number",
    "zip":           "Zip Code",
    "date":          "Date",
    "select":        "Select",
  };

  const fetchTableColumns = async (tableName) => {
    if (!tableName) return [];
    if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
    const { data } = await databaseAPI.getTableColumns(tableName);
    if (!data) return [];
    const cols = Object.entries(data).map(([name, colInfo]) => {
      const sqlType = colInfo?.data_type ?? colInfo;
      const nonNullable = colInfo?.nonNullable ?? false;
      return {
        name,
        type: mapSqlType(sqlType),
        sqlBaseType: mapSqlType(sqlType),
        enabled: true,
        required: true,
        nonNullable,
        fromTable: true,
        options: sqlType === "boolean" ? "true, false" : "",
      };
    });
    console.log("Fetched columns for table", tableName, cols);
    setTableColumnsCache((prev) => ({ ...prev, [tableName]: cols }));
    return cols;
  };

  const handleNewDestinationChange = async (tableName) => {
    setNewForm((prev) => ({ ...prev, destination_table: tableName }));
    if (!tableName) { setNewTableColumns([]); return; }
    const cols = await fetchTableColumns(tableName);
    setNewTableColumns(cols.map((c) => {
      const existing = newTableColumns.find((tc) => tc.name === c.name);
      return existing ? { ...c, enabled: existing.enabled, required: existing.required !== undefined ? existing.required : true, form_name: existing.form_name || "", type: existing.type || c.type, options: existing.options ?? c.options ?? "" } : { ...c, form_name: "" };
    }));
  };

  const handleEditDestinationChange = async (tableName) => {
    setEditForm((prev) => ({ ...prev, destination_table: tableName }));
    if (!tableName) { setEditTableColumns([]); return; }
    const cols = await fetchTableColumns(tableName);
    setEditTableColumns(cols.map((c) => {
      const existing = editTableColumns.find((tc) => tc.name === c.name);
      return existing ? { ...c, enabled: existing.enabled, required: existing.required !== undefined ? existing.required : true, form_name: existing.form_name || "", type: existing.type || c.type, options: existing.options ?? c.options ?? "" } : { ...c, form_name: "" };
    }));
  };

  const toggleEditTableColumn = (i) =>
    setEditTableColumns((prev) => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));

  const toggleNewTableColumn = (i) =>
    setNewTableColumns((prev) => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));

  const updateEditTableColumn = (i, key, value) =>
    setEditTableColumns((prev) => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));

  const updateNewTableColumn = (i, key, value) =>
    setNewTableColumns((prev) => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));

  const OPTIONS_TYPES = ["select", "bubble-select", "multi-select"];

  // Expandable fields
  const [expandedFields, setExpandedFields] = useState({});

  const toggleFieldsExpanded = (id) =>
    setExpandedFields((prev) => ({ ...prev, [id]: !prev[id] }));

  const formatFields = (fields) => {
    if (!fields) return "—";
    if (typeof fields === "string") return fields;
    return JSON.stringify(fields, null, 2);
  };

  const FIELD_TYPE_ICON = {
    "text":          { symbol: "T",  title: "Text Box" },
    "textarea":      { symbol: "¶",  title: "Text Area" },
    "number":        { symbol: "#",  title: "Number" },
    "phone":         { symbol: "☎",  title: "Phone Number" },
    "zip":           { symbol: "✉",  title: "Zip Code" },
    "date":          { symbol: "📅", title: "Date" },
    "select":        { symbol: "▾",  title: "Select" },
    "multi-select":  { symbol: "☰",  title: "Multi Select" },
    "bubble-select": { symbol: "⬤",  title: "Bubble Select" },
  };

  const renderFieldsSummary = (list, expandId) => {
    if (!list || list.length === 0)
      return <span className="text-xs text-gray-400">No fields yet</span>;
    const isLong = list.length > 4;
    const expanded = expandId !== undefined && !!expandedFields[expandId];
    const visible = isLong && !expanded ? list.slice(0, 4) : list;
    return (
      <div className="space-y-1">
        {visible.map((f, i) => {
          const icon = FIELD_TYPE_ICON[f.type] || { symbol: "?", title: f.type };
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
              <span title={icon.title}
                className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 font-mono font-bold cursor-default shrink-0 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                {icon.symbol}
              </span>
              <span className="truncate max-w-[10rem]" title={f.form_name || f.name}>{f.form_name || f.name}</span>
              {f.required
                ? <span title="Required" className="text-red-500 font-bold cursor-default leading-none">*</span>
                : <span title="Optional" className="text-gray-300 cursor-default leading-none">&mdash;</span>}
            </div>
          );
        })}
        {isLong && expandId !== undefined && (
          <button type="button" onClick={() => toggleFieldsExpanded(expandId)}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800">
            {expanded ? "Show less" : `+${list.length - 4} more`}
          </button>
        )}
      </div>
    );
  };

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

    loadTemplates();
    databaseAPI.getValidTablesForSubmissions().then(({ data }) => {
      if (data) setValidTables(data);
    });
  }, [checkingAdmin, isAdmin]);

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

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewForm({ event_name: "", destination_table: "", start_date: "", end_date: "" });
    setNewTableColumns([]);
  };

  const handleCreateSave = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newForm.end_date) {
      const endDate = new Date(newForm.end_date);
      if (endDate < today) {
        setErrorMessage("End date cannot be in the past.");
        return;
      }
      if (newForm.start_date && endDate < new Date(newForm.start_date)) {
        setErrorMessage("End date cannot be before the start date.");
        return;
      }
    }
    setErrorMessage("");

    const enabledTableFields = newTableColumns
      .filter((c) => c.enabled)
      .map((c) => {
        const field = { name: c.name, type: c.type, required: c.required, fromTable: true };
        if (c.form_name?.trim()) field.form_name = c.form_name.trim();
        if (["select", "bubble-select", "multi-select"].includes(c.type)) field.options = c.options.split(",").map((o) => o.trim()).filter(Boolean);
        return field;
      });

    const { error } = await databaseAPI.saveTemplate(
      newForm.event_name,
      newForm.start_date || null,
      newForm.end_date || null,
      null,
      newForm.destination_table || null,
      enabledTableFields.length > 0 ? enabledTableFields : null
    );
    if (error) {
      setErrorMessage("Failed to create template.");
      return;
    }
    handleCreateCancel();
    await loadTemplates();
  };

  const handleEditClick = (template) => {
    setEditingId(template.id);
    setEditForm({
      event_name: template.event_name || "",
      destination_table: template.destination_table || "",
      start_date: template.start_date || "",
      end_date: template.end_date || "",
    });
    const rawList = Array.isArray(template.fields) ? template.fields : [];
    // Load table columns and restore enabled/required state from saved fields
    if (template.destination_table) {
      fetchTableColumns(template.destination_table).then((cols) => {
        const savedTableFields = rawList.filter((f) => f.fromTable);
        const savedTableFieldNames = new Set(savedTableFields.map((f) => f.name));
        const savedTableFieldMap = Object.fromEntries(savedTableFields.map((f) => [f.name, f]));
        setEditTableColumns(cols.map((c) => ({
          ...c,
          enabled: savedTableFieldNames.size > 0 ? savedTableFieldNames.has(c.name) : true,
          required: c.nonNullable ? true : (savedTableFieldNames.has(c.name) ? (savedTableFieldMap[c.name]?.required !== false) : true),
          form_name: savedTableFieldMap[c.name]?.form_name || "",
          type: savedTableFieldNames.has(c.name) ? (savedTableFieldMap[c.name]?.type || c.type) : c.type,
          options: savedTableFieldNames.has(c.name)
            ? (Array.isArray(savedTableFieldMap[c.name]?.options)
                ? savedTableFieldMap[c.name].options.join(", ")
                : savedTableFieldMap[c.name]?.options || c.options || "")
            : (c.options || ""),
        })));
      });
    } else {
      setEditTableColumns([]);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
    setEditTableColumns([]);
  };

  const handleEditSave = async (templateId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (editForm.end_date) {
      const endDate = new Date(editForm.end_date);
      if (endDate < today) {
        setErrorMessage("End date cannot be in the past.");
        return;
      }
      if (editForm.start_date && endDate < new Date(editForm.start_date)) {
        setErrorMessage("End date cannot be before the start date.");
        return;
      }
    }
    setErrorMessage("");

    const enabledTableFields = editTableColumns
      .filter((c) => c.enabled)
      .map((c) => {
        const field = { name: c.name, type: c.type, required: c.required, fromTable: true };
        if (c.form_name?.trim()) field.form_name = c.form_name.trim();
        if (["select", "bubble-select", "multi-select"].includes(c.type)) field.options = c.options?.split(",").map((o) => o.trim()).filter(Boolean) || [];
        return field;
      });

    const { error } = await databaseAPI.updateTemplate(templateId, {
      ...editForm,
      destination_table: editForm.destination_table || null,
      fields: enabledTableFields.length > 0 ? enabledTableFields : null,
    });
    if (error) {
      setErrorMessage("Failed to update template.");
      return;
    }
    setEditingId(null);
    setEditForm({});
    setEditTableColumns([]);
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

  if (checkingAdmin) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!isAdmin) {
    return null;
  }

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
        <button
          onClick={() => { setIsCreating(true); setEditingId(null); }}
          disabled={isCreating}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          + New Template
        </button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Table</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => {
                return (
                  <tr key={template.id}>

                    {/* Event Name */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-gray-900">{template.event_name || "—"}</span>
                    </td>

                    {/* Table */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-gray-700">{template.destination_table || "—"}</span>
                    </td>

                    {/* Start Date */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-gray-700">{template.start_date || "—"}</span>
                    </td>

                    {/* End Date */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-gray-700">{template.end_date || "—"}</span>
                    </td>

                    {/* Fields */}
                    <td className="px-4 py-3 align-top max-w-xs">
                      {(() => {
                        const list = Array.isArray(template.fields) ? template.fields : [];
                        const isLong = list.length > 4;
                        const expanded = !!expandedFields[template.id];
                        const visible = expanded ? list : list.slice(0, 4);
                        return list.length === 0 ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <div className="space-y-1">
                            {visible.map((f, i) => {
                              const icon = FIELD_TYPE_ICON[f.type] || { symbol: "?", title: f.type };
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                                  <span
                                    title={icon.title}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 font-mono font-bold cursor-default shrink-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                  >
                                    {icon.symbol}
                                  </span>
                                  <span className="truncate max-w-[10rem]" title={f.form_name || f.name}>{f.form_name || f.name}</span>
                                  {f.required ? (
                                    <span title="Required" className="text-red-500 font-bold cursor-default hover:text-red-700 leading-none">*</span>
                                  ) : (
                                    <span title="Optional" className="text-gray-300 cursor-default hover:text-gray-500 leading-none">&mdash;</span>
                                  )}
                                </div>
                              );
                            })}
                            {isLong && (
                              <button
                                type="button"
                                onClick={() => toggleFieldsExpanded(template.id)}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                {expanded ? "Show less" : `+${list.length - 4} more`}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit template modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Edit Template</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  value={editForm.event_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, event_name: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Destination Table */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Table</label>
                <Select
                  value={[{ value: "", label: "No Table" }, ...validTables.map(t => ({ value: t, label: t }))].find(opt => opt.value === (editForm.destination_table || "")) || { value: "", label: "No Table" }}
                  onChange={(option) => handleEditDestinationChange(option ? option.value : "")}
                  options={[{ value: "", label: "No Table" }, ...validTables.map(t => ({ value: t, label: t }))]}
                  className="w-full text-sm"
                />
              </div>

              {/* Start & End Date */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.end_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fields (if table selected) */}
              {editTableColumns.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                  <div className="space-y-1 mb-2">
                    {renderFieldsSummary(editTableColumns.filter(c => c.enabled))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFieldModalMode("edit"); setFieldModalOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm transition-colors"
                  >
                    Edit Fields ({editTableColumns.filter(c => c.enabled).length})
                    <FaCog size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave(editingId)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create template modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">New Template</h2>
              <button
                onClick={handleCreateCancel}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  value={newForm.event_name}
                  onChange={(e) => setNewForm({ ...newForm, event_name: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Destination Table */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Table</label>
                <Select
                  value={[{ value: "", label: "No Table" }, ...validTables.map(t => ({ value: t, label: t }))].find(opt => opt.value === (newForm.destination_table || "")) || { value: "", label: "No Table" }}
                  onChange={(option) => handleNewDestinationChange(option ? option.value : "")}
                  options={[{ value: "", label: "No Table" }, ...validTables.map(t => ({ value: t, label: t }))]}
                  className="w-full text-sm"
                />
              </div>

              {/* Start & End Date */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newForm.start_date}
                    onChange={(e) => setNewForm({ ...newForm, start_date: e.target.value })}
                    className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newForm.end_date}
                    onChange={(e) => setNewForm({ ...newForm, end_date: e.target.value })}
                    className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fields (if table selected) */}
              {newTableColumns.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                  <div className="space-y-1 mb-2">
                    {renderFieldsSummary(newTableColumns.filter(c => c.enabled))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFieldModalMode("create"); setFieldModalOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm transition-colors"
                  >
                    Edit Fields ({newTableColumns.filter(c => c.enabled).length})
                    <FaCog size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={handleCreateCancel}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field builder modal */}
      {fieldModalOpen && (() => {
        const isEditMode = fieldModalMode === "edit";
        const tableCols = isEditMode ? editTableColumns : newTableColumns;
        const toggleTableCol = isEditMode ? toggleEditTableColumn : toggleNewTableColumn;
        const updateTableColFn = isEditMode ? updateEditTableColumn : updateNewTableColumn;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
              {/* Modal header */}
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Edit Fields</h2>
                <button
                  onClick={() => setFieldModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
                {tableCols.length === 0 ? (
                  <p className="text-sm text-gray-500">No table selected. Choose a destination table to see fields.</p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table Columns</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const allEnabled = tableCols.every((c) => c.enabled);
                          if (isEditMode) {
                            setEditTableColumns((prev) => prev.map((c) => c.nonNullable ? c : { ...c, enabled: !allEnabled }));
                          } else {
                            setNewTableColumns((prev) => prev.map((c) => c.nonNullable ? c : { ...c, enabled: !allEnabled }));
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {tableCols.every((c) => c.enabled) ? "Uncheck All" : "Check All"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {tableCols.map((col, i) => {
                        const icon = FIELD_TYPE_ICON[col.type] || { symbol: "?", title: col.type };
                        return (
                          <div key={col.name}
                            className={`border rounded-md p-2 transition-colors ${
                              col.enabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200 opacity-60"
                            }`}
                          >
                            <label className={`flex items-center gap-2 ${col.nonNullable ? "cursor-not-allowed" : "cursor-pointer"}`}>
                              <input
                                type="checkbox"
                                checked={col.enabled}
                                onChange={() => toggleTableCol(i)}
                                disabled={col.nonNullable}
                                className="shrink-0"
                              />
                              <span title={icon.title}
                                className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 font-mono font-bold text-xs shrink-0">
                                {icon.symbol}
                              </span>
                              <span className="text-xs text-gray-700 truncate">{col.name}</span>
                              {col.nonNullable && <span className="text-[10px] text-gray-400 shrink-0">(required)</span>}
                              <span className="text-[10px] text-gray-400 ml-auto shrink-0">{TYPE_LABEL[col.type] || col.type}</span>
                            </label>
                            {col.enabled && (
                              <div className="mt-1 ml-7 space-y-1.5">
                                <input
                                  type="text"
                                  placeholder="Display name (optional)"
                                  value={col.form_name || ""}
                                  onChange={(e) => updateTableColFn(i, "form_name", e.target.value)}
                                  className="border rounded px-2 py-0.5 text-xs w-full"
                                />
                                {TYPE_VARIANTS[col.sqlBaseType] && TYPE_VARIANTS[col.sqlBaseType].length > 1 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 shrink-0">Input type:</span>
                                    <Select
                                      value={TYPE_VARIANTS[col.sqlBaseType].map(t => ({ value: t, label: TYPE_LABEL[t] })).find(opt => opt.value === col.type)}
                                      onChange={(option) => {
                                        if (!option) return;
                                        updateTableColFn(i, "type", option.value);
                                        if (!OPTIONS_TYPES.includes(option.value)) {
                                          updateTableColFn(i, "options", "");
                                        }
                                      }}
                                      options={TYPE_VARIANTS[col.sqlBaseType].map(t => ({ value: t, label: TYPE_LABEL[t] }))}
                                      className="flex-1 text-xs"
                                    />
                                  </div>
                                )}
                                {OPTIONS_TYPES.includes(col.type) && (
                                  <input
                                    type="text"
                                    placeholder="Options (comma-separated)"
                                    value={col.options || ""}
                                    onChange={(e) => updateTableColFn(i, "options", e.target.value)}
                                    className="border rounded px-2 py-0.5 text-xs w-full"
                                  />
                                )}
                                <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none ${col.nonNullable ? "text-gray-400" : "text-gray-600"}`}>
                                  <input
                                    type="checkbox"
                                    checked={col.required !== false}
                                    onChange={(e) => updateTableColFn(i, "required", e.target.checked)}
                                    disabled={col.nonNullable}
                                  />
                                  Required
                                  {col.nonNullable && <span className="text-[10px] ml-1">(non-nullable)</span>}
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setFieldModalOpen(false)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
