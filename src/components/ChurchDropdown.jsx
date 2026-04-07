import React, { useState } from 'react';
import AddChurch from '../pages/addChurch';

const ChurchDropdown = ({ churches, selectedName, onSelect, isAddingNew, setIsAddingNew }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
  
    const filtered = churches.filter(c => 
      c.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.church_physical_city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div className="relative w-full">
        {/* DROPDOWN INPUT AREA */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search church or church city..."
            className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={isOpen ? searchTerm : (selectedName || "")}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* THE ARROW ICON */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isOpen && (
            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((church, i) => (
                  <div 
                    key={i}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                    onClick={() => {
                      onSelect(church.church_name);
                      setSearchTerm(church.church_name);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-gray-900">{church.church_name}</span>
                      <span className="text-gray-400 text-xs italic">{church.church_physical_city}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-400 text-sm italic text-center font-bold">No results found</div>
              )}

              <div 
                className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer text-sm font-bold text-blue-700 border-t sticky bottom-0 text-center"
                onClick={() => {
                  setIsAddingNew(true); 
                  setIsOpen(false);
                }}
              >
                + Add "{searchTerm || 'New Church'}" to System
              </div>
            </div>
          )}
          {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>

        {/* THE MODAL "WINDOW" */}
        {isAddingNew && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Dark Backdrop Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddingNew(false)} />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              {/* Sticky Header inside Modal */}
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <span className="text-xs font-black text-blue-800 uppercase tracking-widest">
                  Quick Church Registration
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsAddingNew(false)}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto">
                <AddChurch 
                  isEmbedded={true} 
                  onSaved={(newChurchName) => {
                    onSelect(newChurchName); 
                    setIsAddingNew(false);   
                    setSearchTerm(newChurchName); 
                  }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default ChurchDropdown;