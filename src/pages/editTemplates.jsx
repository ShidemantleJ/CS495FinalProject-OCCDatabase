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
  const [validTables, setValidTables] = useState([]);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFieldsError, setEditFieldsError] = useState("");
  const [editFieldsList, setEditFieldsList] = useState([]);

  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState({ template_name: "", type: "", destination_table: "", start_date: "", end_date: "" });
  const [newFieldsList, setNewFieldsList] = useState([]);
  const [newFieldsError, setNewFieldsError] = useState("");

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

  const fetchTableColumns = async (tableName) => {
    if (!tableName) return [];
    if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
    const { data } = await databaseAPI.getTableColumns(tableName);
    if (!data) return [];
    const cols = Object.entries(data).map(([name, sqlType]) => ({
      name,
      type: mapSqlType(sqlType),
      enabled: true,
      fromTable: true,
      options: sqlType === "boolean" ? "true, false" : "",
    }));
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
      return existing ? { ...c, enabled: existing.enabled, form_name: existing.form_name || "" } : { ...c, form_name: "" };
    }));
  };

  const handleEditDestinationChange = async (tableName) => {
    setEditForm((prev) => ({ ...prev, destination_table: tableName }));
    if (!tableName) { setEditTableColumns([]); return; }
    const cols = await fetchTableColumns(tableName);
    setEditTableColumns(cols.map((c) => {
      const existing = editTableColumns.find((tc) => tc.name === c.name);
      return existing ? { ...c, enabled: existing.enabled, form_name: existing.form_name || "" } : { ...c, form_name: "" };
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

  const FIELD_TYPES = [
    { value: "text",         label: "Text Box" },
    { value: "textarea",     label: "Text Area" },
    { value: "number",       label: "Number" },
    { value: "date",         label: "Date" },
    { value: "select",       label: "Select" },
    { value: "multi-select", label: "Multi Select" },
    { value: "bubble-select",label: "Bubble Select" },
  ];

  const OPTIONS_TYPES = ["select", "multi-select", "bubble-select"];

  const addField = () =>
    setEditFieldsList((prev) => [...prev, { name: "", type: "text", required: false, options: "", form_name: "" }]);

  const addNewField = () =>
    setNewFieldsList((prev) => [...prev, { name: "", type: "text", required: false, options: "", form_name: "" }]);

  const removeField = (i) =>
    setEditFieldsList((prev) => prev.filter((_, idx) => idx !== i));

  const removeNewField = (i) =>
    setNewFieldsList((prev) => prev.filter((_, idx) => idx !== i));

  const updateField = (i, key, value) =>
    setEditFieldsList((prev) => prev.map((f, idx) => idx === i ? { ...f, [key]: value } : f));

  const updateNewField = (i, key, value) =>
    setNewFieldsList((prev) => prev.map((f, idx) => idx === i ? { ...f, [key]: value } : f));

  const moveField = (i, dir) => {
    setEditFieldsList((prev) => {
      const list = [...prev];
      const target = i + dir;
      if (target < 0 || target >= list.length) return list;
      [list[i], list[target]] = [list[target], list[i]];
      return list;
    });
  };

  const moveNewField = (i, dir) => {
    setNewFieldsList((prev) => {
      const list = [...prev];
      const target = i + dir;
      if (target < 0 || target >= list.length) return list;
      [list[i], list[target]] = [list[target], list[i]];
      return list;
    });
  };

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
    loadTemplates();
    databaseAPI.getValidTablesForSubmissions().then(({ data }) => {
      if (data) setValidTables(data);
    });
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

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewForm({ template_name: "", type: "", destination_table: "", start_date: "", end_date: "" });
    setNewFieldsList([]);
    setNewTableColumns([]);
    setNewFieldsError("");
  };

  const handleCreateSave = async () => {
    const hasBlankName = newFieldsList.some((f) => !f.name.trim());
    if (hasBlankName) {
      setNewFieldsError("All fields must have a name.");
      return;
    }
    setNewFieldsError("");

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

    const parsedFields = newFieldsList.map((f) => {
      const field = { name: f.name.trim(), type: f.type, required: f.required };
      if (f.form_name?.trim()) field.form_name = f.form_name.trim();
      if (OPTIONS_TYPES.includes(f.type)) {
        field.options = f.options.split(",").map((o) => o.trim()).filter(Boolean);
      }
      return field;
    });

    const enabledTableFields = newTableColumns
      .filter((c) => c.enabled)
      .map((c) => {
        const field = { name: c.name, type: c.type, required: true, fromTable: true };
        if (c.form_name?.trim()) field.form_name = c.form_name.trim();
        if (c.type === "select") field.options = c.options.split(",").map((o) => o.trim()).filter(Boolean);
        return field;
      });
    const allFields = [...enabledTableFields, ...parsedFields];

    const { error } = await databaseAPI.saveTemplate(
      newForm.template_name,
      newForm.start_date || null,
      newForm.end_date || null,
      newForm.type || null,
      newForm.destination_table || null,
      allFields.length > 0 ? allFields : null
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
    setEditFieldsError("");
    setEditForm({
      template_name: template.template_name || "",
      type: template.type || "",
      destination_table: template.destination_table || "",
      start_date: template.start_date || "",
      end_date: template.end_date || "",
    });
    const rawList = Array.isArray(template.fields) ? template.fields : [];
    const customFields = rawList.filter((f) => !f.fromTable);
    setEditFieldsList(
      customFields.map((f) => ({
        name: f.name || "",
        type: f.type || "text",
        required: !!f.required,
        options: Array.isArray(f.options) ? f.options.join(", ") : (f.options || ""),
        form_name: f.form_name || "",
      }))
    );
    // Load table columns and restore enabled state from saved fields
    if (template.destination_table) {
      fetchTableColumns(template.destination_table).then((cols) => {
        const savedTableFields = rawList.filter((f) => f.fromTable);
        const savedTableFieldNames = new Set(savedTableFields.map((f) => f.name));
        const savedTableFieldMap = Object.fromEntries(savedTableFields.map((f) => [f.name, f]));
        setEditTableColumns(cols.map((c) => ({
          ...c,
          enabled: savedTableFieldNames.size > 0 ? savedTableFieldNames.has(c.name) : true,
          form_name: savedTableFieldMap[c.name]?.form_name || "",
        })));
      });
    } else {
      setEditTableColumns([]);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
    setEditFieldsList([]);
    setEditTableColumns([]);
  };

  const handleEditSave = async (templateId) => {
    // Validate field names
    const hasBlankName = editFieldsList.some((f) => !f.name.trim());
    if (hasBlankName) {
      setEditFieldsError("All fields must have a name.");
      return;
    }
    setEditFieldsError("");

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

    const parsedFields = editFieldsList.map((f) => {
      const field = { name: f.name.trim(), type: f.type, required: f.required };
      if (f.form_name?.trim()) field.form_name = f.form_name.trim();
      if (OPTIONS_TYPES.includes(f.type)) {
        field.options = f.options.split(",").map((o) => o.trim()).filter(Boolean);
      }
      return field;
    });

    const enabledTableFields = editTableColumns
      .filter((c) => c.enabled)
      .map((c) => {
        const field = { name: c.name, type: c.type, required: true, fromTable: true };
        if (c.form_name?.trim()) field.form_name = c.form_name.trim();
        if (c.type === "select") field.options = c.options?.split(",").map((o) => o.trim()).filter(Boolean) || [];
        return field;
      });
    const allFields = [...enabledTableFields, ...parsedFields];

    const { error } = await databaseAPI.updateTemplate(templateId, {
      ...editForm,
      destination_table: editForm.destination_table || null,
      fields: allFields.length > 0 ? allFields : null,
    });
    if (error) {
      setErrorMessage("Failed to update template.");
      return;
    }
    setEditingId(null);
    setEditForm({});
    setEditFieldsList([]);
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Table</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* New template row */}
              {isCreating && (
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      placeholder="Template name"
                      value={newForm.template_name}
                      onChange={(e) => setNewForm({ ...newForm, template_name: e.target.value })}
                      className="border rounded-md px-2 py-1 w-full text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      placeholder="Type"
                      value={newForm.type}
                      onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                      className="border rounded-md px-2 py-1 w-full text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={newForm.destination_table}
                      onChange={(e) => handleNewDestinationChange(e.target.value)}
                      className="border rounded-md px-2 py-1 w-full text-sm"
                    >
                      <option value="">No Table</option>
                      {validTables.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="date"
                      value={newForm.start_date}
                      onChange={(e) => setNewForm({ ...newForm, start_date: e.target.value })}
                      className="border rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="date"
                      value={newForm.end_date}
                      onChange={(e) => setNewForm({ ...newForm, end_date: e.target.value })}
                      className="border rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top max-w-xs">
                    <div className="space-y-2">
                      {renderFieldsSummary([...newTableColumns.filter(c => c.enabled), ...newFieldsList])}
                      <button
                        type="button"
                        onClick={() => { setFieldModalMode("create"); setFieldModalOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm transition-colors"
                      >
                        Edit Fields ({newTableColumns.filter(c => c.enabled).length + newFieldsList.length})
                        <FaCog size={11} />
                      </button>
                      {newFieldsError && (
                        <p className="text-red-500 text-xs">{newFieldsError}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCreateSave}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCreateCancel}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
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

                    {/* Table */}
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <select
                          value={editForm.destination_table}
                          onChange={(e) => handleEditDestinationChange(e.target.value)}
                          className="border rounded-md px-2 py-1 w-full text-sm"
                        >
                          <option value="">No Table</option>
                          {validTables.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">{template.destination_table || "—"}</span>
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
                        <div className="space-y-2">
                          {renderFieldsSummary([...editTableColumns.filter(c => c.enabled), ...editFieldsList], template.id)}
                          <button
                            type="button"
                            onClick={() => { setFieldModalMode("edit"); setFieldModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 shadow-sm transition-colors"
                          >
                            Edit Fields ({editTableColumns.filter(c => c.enabled).length + editFieldsList.length})
                            <FaCog size={11} />
                          </button>
                          {editFieldsError && (
                            <p className="text-red-500 text-xs">{editFieldsError}</p>
                          )}
                        </div>
                      ) : (() => {
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

      {/* Field builder modal */}
      {fieldModalOpen && (() => {
        const isEditMode = fieldModalMode === "edit";
        const list = isEditMode ? editFieldsList : newFieldsList;
        const tableCols = isEditMode ? editTableColumns : newTableColumns;
        const toggleTableCol = isEditMode ? toggleEditTableColumn : toggleNewTableColumn;
        const addFn = isEditMode ? addField : addNewField;
        const updateFn = isEditMode ? updateField : updateNewField;
        const moveFn = isEditMode ? moveField : moveNewField;
        const removeFn = isEditMode ? removeField : removeNewField;
        const fieldError = isEditMode ? editFieldsError : newFieldsError;
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
                {/* Table columns section */}
                {tableCols.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table Columns</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const allEnabled = tableCols.every((c) => c.enabled);
                          if (isEditMode) {
                            setEditTableColumns((prev) => prev.map((c) => ({ ...c, enabled: !allEnabled })));
                          } else {
                            setNewTableColumns((prev) => prev.map((c) => ({ ...c, enabled: !allEnabled })));
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
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={col.enabled}
                                onChange={() => toggleTableCol(i)}
                                className="shrink-0"
                              />
                              <span title={icon.title}
                                className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 font-mono font-bold text-xs shrink-0">
                                {icon.symbol}
                              </span>
                              <span className="text-xs text-gray-700 truncate">{col.name}</span>
                              <span className="text-[10px] text-gray-400 ml-auto shrink-0">{col.type}</span>
                            </label>
                            {col.enabled && (
                              <input
                                type="text"
                                placeholder="Display name (optional)"
                                value={col.form_name || ""}
                                onChange={(e) => updateTableColFn(i, "form_name", e.target.value)}
                                className="mt-1 ml-7 border rounded px-2 py-0.5 text-xs w-[calc(100%-1.75rem)]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom fields section */}
                <div>
                  {tableCols.length > 0 && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Fields</h3>
                  )}
                  <div className="space-y-2">
                    {list.map((field, i) => (
                      <div key={i} className="border rounded-md p-2 bg-gray-50 space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Field name"
                            value={field.name}
                            onChange={(e) => updateFn(i, "name", e.target.value)}
                            className="border rounded px-2 py-1 text-xs flex-1 min-w-0"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateFn(i, "type", e.target.value)}
                            className="border rounded px-1 py-1 text-xs"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateFn(i, "required", e.target.checked)}
                            />
                            Req
                          </label>
                          <button type="button" onClick={() => moveFn(i, -1)} disabled={i === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-0.5">↑</button>
                          <button type="button" onClick={() => moveFn(i, 1)} disabled={i === list.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-0.5">↓</button>
                          <button type="button" onClick={() => removeFn(i)}
                            className="text-red-400 hover:text-red-600 text-xs px-0.5">&times;</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Display name (optional)"
                          value={field.form_name || ""}
                          onChange={(e) => updateFn(i, "form_name", e.target.value)}
                          className="border rounded px-2 py-1 text-xs w-full"
                        />
                        {OPTIONS_TYPES.includes(field.type) && (
                          <input
                            type="text"
                            placeholder="Options (comma-separated)"
                            value={field.options}
                            onChange={(e) => updateFn(i, "options", e.target.value)}
                            className="border rounded px-2 py-1 text-xs w-full"
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFn}
                      className="w-full text-xs border border-dashed border-gray-300 rounded-md py-1.5 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                    >
                      + Add Custom Field
                    </button>
                  </div>
                </div>

                {fieldError && (
                  <p className="text-red-500 text-xs">{fieldError}</p>
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
