import React, { useState } from 'react';
import AddChurch from '../pages/addChurch';

const ChurchDropdown = ({ churches, selectedName, onSelect, isAddingNew, setIsAddingNew }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
  
    // Filter logic: Search by name OR city (Keep your existing working logic)
    const filtered = churches.filter(c => 
      c.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.church_physical_city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div className="relative w-full">
        {!isAddingNew ? (
          <>
            {/* SEARCHABLE DROPDOWN */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search church or church city..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                // Show the search term while typing, otherwise show the saved name
                value={isOpen ? searchTerm : (selectedName || "")}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
  
              {isOpen && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
                  {filtered.length > 0 ? (
                    filtered.map((church, i) => (
                      <div 
                        key={i}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                        onClick={() => {
                          onSelect(church.church_name); // Select the church
                          setSearchTerm(church.church_name); // Update local search text
                          setIsOpen(false); // Close dropdown
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{church.church_name}</span>
                          <span className="text-gray-400 text-xs italic">{church.church_physical_city}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-400 text-sm italic text-center font-bold">No results found</div>
                  )}
  
                  {/* THE "ADD NEW" BUTTON (Triggers the pop-up) */}
                  <div 
                    className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer text-sm font-bold text-blue-700 border-t sticky bottom-0 text-center"
                    onClick={() => {
                      setIsAddingNew(true); // Switch to "Add Mode"
                      setIsOpen(false);
                    }}
                  >
                    + Add "{searchTerm || 'New Church'}" to System
                  </div>
                </div>
              )}
              {/* Click away overlay to close the list */}
              {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
            </div>
          </>
        ) : (
          /* "POP-UP" SCREEN (Using AddChurch.jsx) */
          <div className="mt-2 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-blue-300 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <span className="text-xs font-black text-blue-800 uppercase tracking-widest">
                Quick Church Registration
              </span>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-gray-400 underline font-bold hover:text-red-600"
              >
                Cancel & Go Back
              </button>
            </div>
  
            <AddChurch 
              isEmbedded={true} 
              onSaved={(newChurchName) => {
                onSelect(newChurchName); 
                setIsAddingNew(false);   
                setSearchTerm(newChurchName); 
              }} 
            />
          </div>
        )}
      </div>
    );
  };

export default ChurchDropdown;