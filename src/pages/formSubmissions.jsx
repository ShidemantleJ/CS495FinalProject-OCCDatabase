import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { databaseAPI } from "../api";

const CARD_COLORS = [
  { bar: "#2563EB", arrow: "text-blue-600" },
  { bar: "#10B981", arrow: "text-emerald-600" },
  { bar: "#6366F1", arrow: "text-indigo-600" },
  { bar: "#F43F5E", arrow: "text-rose-600" },
  { bar: "#8B5CF6", arrow: "text-violet-600" },
  { bar: "#F59E0B", arrow: "text-amber-600" },
];

export default function FormSubmissions() {
  const navigate = useNavigate();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

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
        select: "id, event_name, start_date, end_date",
        orderBy: { column: "start_date", ascending: false },
      });

      if (error) {
        setErrorMessage("Failed to load form templates.");
        setTemplates([]);
      } else {
        const getStatus = (t) => {
          const today = new Date().toLocaleDateString("en-CA");
          if (t.start_date || t.end_date) {
            if (t.end_date && today > t.end_date) return 2; // archived
            if (t.start_date && today < t.start_date) return 1; // upcoming
            return 0; // active
          }
          return 3; // no date
        };
        const sorted = (data || []).slice().sort((a, b) => {
          const statusDiff = getStatus(a) - getStatus(b);
          if (statusDiff !== 0) return statusDiff;
          if (!a.start_date && !b.start_date) return 0;
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return b.start_date.localeCompare(a.start_date);
        });
        setTemplates(sorted);
      }

      setLoadingTemplates(false);
    };

    loadTemplates();
  }, [checkingAdmin, isAdmin]);

  if (checkingAdmin) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Form Submissions</h1>
        <button
          type="button"
          onClick={() => navigate("/edit-templates")}
          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
        >
          Manage Templates
        </button>
      </div>

      {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {loadingTemplates ? (
        <p className="text-center">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-center text-gray-500">No form templates found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {templates
            .filter((t) =>
              !search || (t.event_name || "").toLowerCase().includes(search.toLowerCase())
            )
            .map((template, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length];
            const today = new Date().toLocaleDateString("en-CA");
            let status = null;
            if (template.start_date || template.end_date) {
              if (template.end_date && today > template.end_date) {
                status = "archived";
              } else if (template.start_date && today < template.start_date) {
                status = "upcoming";
              } else {
                status = "active";
              }
            }
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => navigate(`/form-submissions/${template.id}`)}
                className="group relative h-28 bg-white border border-slate-100 rounded-2xl shadow-lg shadow-slate-200/50 flex items-center px-8 hover:shadow-xl active:scale-[0.98] transition-all overflow-hidden text-left"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-3 rounded-l-2xl"
                  style={{ backgroundColor: color.bar }}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">
                    {template.event_name || "Unnamed Template"}
                  </span>
                  {status === "active" && (
                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                  {status === "archived" && (
                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                      Archived
                    </span>
                  )}
                  {status === "upcoming" && (
                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Not Active
                    </span>
                  )}
                </div>
                <span className={`ml-auto text-3xl group-hover:translate-x-2 transition-transform opacity-20 group-hover:opacity-100 ${color.arrow}`}>
                  →
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
