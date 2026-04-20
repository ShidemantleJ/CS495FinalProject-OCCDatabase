import React from 'react';

export default function ReassignChurchesModal({ isOpen, churches, activeMembers, reassignments, onChange, onConfirm, onCancel, currentYear, isProcessing, actionLabel = "Retire" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Reassign Churches</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        This member is the Church Relations Point of Contact for the following churches in {currentYear}.
                        Since they are being marked as inactive, please reassign these churches.
                    </p>
                </div>
                <div className="px-6 py-4 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        {churches.map((attr) => (
                            <div key={attr.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border rounded-lg">
                                <div className="font-medium text-gray-800 mb-2 sm:mb-0">
                                    {attr.church2?.church_name?.replace(/_/g, " ")}
                                </div>
                                <select
                                    value={reassignments[attr.id] || ""}
                                    onChange={(e) => onChange(attr.id, e.target.value)}
                                    className="border rounded-md px-3 py-1.5 text-sm bg-white min-w-[200px]"
                                >
                                    <option value="">-- Unassigned (None) --</option>
                                    {activeMembers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.first_name} {m.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors font-medium"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium"
                        disabled={isProcessing}
                    >
                        {isProcessing ? `${actionLabel}ing...` : `Confirm & ${actionLabel} Member`}
                    </button>
                </div>
            </div>
        </div>
    );
}