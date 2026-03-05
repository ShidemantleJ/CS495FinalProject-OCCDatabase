import { useEffect, useState } from "react";
import { databaseAPI } from "../api";

export default function FormSubmissions() {
  const MAX_CONTENT_HEIGHT_REM = 7;
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      setErrorMessage("");

      const { data, error } = await databaseAPI.list("form_templates", {
        select: "id, name",
        orderBy: { column: "id", ascending: true },
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
  }, []);

  useEffect(() => {
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
  }, [selectedTemplateId]);

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

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Form Submissions</h1>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <label className="block text-sm font-medium mb-2">Form Template</label>
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
                {template.name || "Unnamed Template"}
              </option>
            ))}
        </select>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
