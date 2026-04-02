import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databaseAPI } from "../api";
import { useUser } from "../contexts/UserContext";

export default function EditShoeboxCount() {
    const {user} = useUser();
    const { churchId } = useParams();
    const navigate = useNavigate();
    const [shoeboxCount, setShoeboxCount] = useState(null);
    const [churchData, setChurchData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    // Get current year dynamically - automatically switches to 2026 when the year changes
    const SHOEBOX_UPDATE_YEAR = new Date().getFullYear();
    const shoeboxFieldName = `shoebox_${SHOEBOX_UPDATE_YEAR}`;

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                navigate("/");
                return;
            }

            const { data: memberData } = await databaseAPI
                .list("team_members", {
                    select: "admin_flag",
                    filters: [{ column: "email", op: "eq", value: user.email }],
                })
                .single();

            const adminStatus = memberData?.admin_flag === true || memberData?.admin_flag === "true";
            setIsAdmin(adminStatus);
            setCheckingAdmin(false);

            if (!adminStatus) {
                navigate(`/church/${churchId}`);
            }
        };

        checkAdminStatus();
    }, [churchId, navigate, user]);

    useEffect(() => {
        if (!isAdmin || checkingAdmin) return;

        const fetchChurchAndCount = async () => {
            // Fetch church name
            const { data: churchInfo, error: churchError } = await databaseAPI.get("church2", churchId, {
                select: `church_name`,
            });

            if (churchError || !churchInfo) {
                setError("Error loading church details.");
                return;
            }
            setChurchData(churchInfo);

            // Fetch shoebox count for the year
            const { data: attr, error: attrError } = await databaseAPI.list("church_annual_attributes", {
                filters: [
                    { column: "church_id", op: "eq", value: churchId },
                    { column: "year", op: "eq", value: SHOEBOX_UPDATE_YEAR }
                ]
            }).maybeSingle();

            if (attrError) {
                setError("Error loading shoebox count.");
            } else {
                setShoeboxCount(attr?.shoebox_count ?? '');
            }
        };

        fetchChurchAndCount();
    }, [churchId, isAdmin, checkingAdmin, SHOEBOX_UPDATE_YEAR]);

    const handleChange = (e) => {
        setShoeboxCount(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            navigate(`/church/${churchId}`);
            return;
        }
        setLoading(true);
        setError(null);

        const numericValue = shoeboxCount === '' ? null : parseInt(shoeboxCount, 10);
        
        if (numericValue !== null && isNaN(numericValue)) {
            setError("Please enter a valid number or leave blank.");
            setLoading(false);
            return;
        }

        // We need to upsert into church_annual_attributes
        // First, check if a record for this church/year exists to get its ID
        const { data: existingAttr, error: fetchError } = await databaseAPI.list("church_annual_attributes", {
            filters: [
                { column: "church_id", op: "eq", value: churchId },
                { column: "year", op: "eq", value: SHOEBOX_UPDATE_YEAR }
            ]
        }).maybeSingle();

        if (fetchError) {
            setError("Error checking for existing data.");
            setLoading(false);
            return;
        }

        const { error: updateError } = await databaseAPI.upsert("church_annual_attributes", [{
            id: existingAttr?.id,
            church_id: churchId,
            year: SHOEBOX_UPDATE_YEAR,
            shoebox_count: numericValue,
            relations_member: existingAttr?.relations_member // Preserve
        }]);
        if (updateError) {
            setError("Error updating shoebox count.");
        } else {
            navigate(`/church/${churchId}`);
        }

        setLoading(false);
    };

    if (checkingAdmin || !isAdmin) return <p className="text-center mt-10">Loading...</p>;
    if (!churchData) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold mb-4 text-center">Edit Shoebox Count</h1>
            <h2 className="text-xl text-gray-700 mb-6 text-center">
                {churchData.church_name.replace(/_/g, " ")}
            </h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label 
                        htmlFor="shoeboxCount" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Shoebox Count for {SHOEBOX_UPDATE_YEAR}
                    </label>
                    <input
                        id="shoeboxCount"
                        type="number"
                        min="0"
                        value={shoeboxCount === null ? '' : shoeboxCount}
                        onChange={handleChange}
                        placeholder="Enter count"
                        className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for no value (NULL).</p>
                </div>

                <div className="flex justify-between gap-4 pt-4">
                    <button
                        type="button"
                        className="flex-1 bg-gray-300 text-black py-3 rounded-lg hover:bg-gray-400 font-medium"
                        onClick={() => navigate(`/church/${churchId}`)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 font-medium"
                    >
                        {loading ? "Saving..." : "Save Count"}
                    </button>
                </div>
            </form>
        </div>
    );
}
