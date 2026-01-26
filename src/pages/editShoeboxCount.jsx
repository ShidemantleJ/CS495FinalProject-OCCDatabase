import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditShoeboxCount() {
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/");
                return;
            }

            const { data: memberData } = await supabase
                .from("team_members")
                .select("admin_flag")
                .eq("id", user.id)
                .single();

            const adminStatus = memberData?.admin_flag === true || memberData?.admin_flag === "true";
            setIsAdmin(adminStatus);
            setCheckingAdmin(false);

            if (!adminStatus) {
                navigate(`/church/${churchId}`);
            }
        };

        checkAdminStatus();
    }, [churchId, navigate]);

    useEffect(() => {
        if (!isAdmin || checkingAdmin) return;

        const fetchChurch = async () => {
            const { data, error } = await supabase
                .from("church2")
                .select(`id, church_name, ${shoeboxFieldName}`)
                .eq("id", churchId)
                .maybeSingle();

            if (!error && data) {
                setChurchData(data);
                setShoeboxCount(data[shoeboxFieldName] || '');
            } else {
                setError("Error loading church details.");
            }
        };

        fetchChurch();
    }, [churchId, shoeboxFieldName, isAdmin, checkingAdmin]);

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

        const updatePayload = {
            [shoeboxFieldName]: numericValue,
        };

        if (!churchData || !churchData.id) {
            setError("Error: Church data not loaded.");
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase
            .from("church2")
            .update(updatePayload)
            .eq("id", churchData.id);

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