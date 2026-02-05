import { useState, useEffect } from "react";
// import { databaseAPI } from "../api";
// import { useNavigate } from "react-router-dom";

export default function Mobile() {
  const [isVerified, setIsVerified] = useState(false); // false = Admin Login, true = Registration Form
  const [validAdmin, setValidAdmin] = useState({ email: "", password: "" });
  const [view, setView] = useState("selection"); // "selection", "Individuals Drop-Off", "Church/Group Drop-Off", "NCW Short-Term", "PLW"
  const [formData, setFormData] = useState({ //All the types of data that can be entered in the various forms
    // Header Info
    locationCode: "",
    date: "", 
    numOfShoeboxes: "", 

    // Church/Group Info
    churchOrGroupName: "", //Church/Group Drop-Off
    churchOrGroupMailingAddress: "", //Church/Group Drop-Off
    churchOrGroupPhone: "", //Church/Group Drop-Off
    churchOrGroupCity: "",
    representingGroup: "",    //NCW Short-Term
    projectLeader: "", //Church/Group Drop-Off

    // Personal Info
    title: "", //NCW Short-Term
    gender: "",
    ageGroup: "", //NCW Short-Term
    firstName: "", 
    lastName: "",
    
    // Contact & Location
    mailingAddress: "", // Individuals Drop-Off
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",

    // Preferences
    interestedInServing: "", //NCW Short-Term

    //Questions
    referralSource: "", // "How did you hear about this event?"
    supportNeeds: ""    // "How can the West Alabama OCC team support you..."
  }); //Fields of the 3 forms we got sent by the sponsor
  

  //Prevent Back Navigation & URL changes
  useEffect(() => {
    sessionStorage.setItem("kioskMode", "true");

    window.history.pushState(null, null, window.location.pathname);

    const handleBackButton = () => {
      window.history.pushState(null, null, window.location.pathname);
    };
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  //Handle Admin Login, and so hitting enter doesn't refresh the page
  const handleNextStep = (e) => {
    if (e) e.preventDefault();

    if (
      validAdmin.email === "admin@gmail.com" &&
      validAdmin.password === "admin123"
    ) {
      //Can later replace with actual auth from Supabase
      setIsVerified(true);
    } else {
      alert("Invalid credentials. Try: admin@gmail.com / admin123");
    }
  };

  //If Cancel is clicked, reset everything
  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure? This will return to the Admin Login and clear the form.",
      )
    ) {
      setIsVerified(false);
      setFormData({ name: "", email: "" });
      setValidAdmin({ email: "", password: "" });
    }
  };

  //When Switch Form is selected wipes the data previously entered in the form (Can be removed if we decide that we don't want the switch form option)
  const resetForm = () => {
    setFormData({
      // Header Info
      locationCode: "",
      date: "", 
      numOfShoeboxes: "", 
  
      // Church/Group Info
      churchOrGroupName: "", 
      churchOrGroupMailingAddress: "", 
      churchOrGroupPhone: "", 
      churchOrGroupCity: "",
      representingGroup: "",    
      projectLeader: "", 
  
      // Personal Info
      title: "", 
      gender: "",
      ageGroup: "", 
      firstName: "", 
      lastName: "",
      
      // Contact & Location
      mailingAddress: "", 
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
  
      // Preferences
      interestedInServing: "", 

      //Questions
      referralSource: "",
      supportNeeds: "" 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-10 pb-10 px-4 flex flex-col items-center font-sans">
      
      {/* 1. ADMIN LOGIN SECTION */}
      {!isVerified && (
        <div className="max-w-md w-full bg-white shadow-2xl shadow-slate-200/50 rounded-[2rem] p-12 border border-slate-100 text-center space-y-8 mt-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Log In</h1>
          </div>
  
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="text-left space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Admin Email</label>
              <input
                type="email"
                placeholder="email@address.com"
                className="w-full p-4 text-lg border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                value={validAdmin.email}
                onChange={(e) => setValidAdmin({ ...validAdmin, email: e.target.value })}
                required
              />
            </div>
  
            <div className="text-left space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Admin Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 text-lg border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                value={validAdmin.password}
                onChange={(e) => setValidAdmin({ ...validAdmin, password: e.target.value })}
                required
              />
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-dashed border-blue-300">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Demo Credentials:</p>
              <p className="text-slate-700 font-mono text-sm">admin@gmail.com / admin123</p>
            </div>
  
            <button
              type="submit"
              className="w-full py-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xl font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      )}
  
      {/* 2. SELECTION SCREEN (Shown only after login) */}
      {isVerified && view === "selection" && (
        <div className="max-w-2xl w-full flex flex-col items-center space-y-12 px-4 mt-10">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Welcome</h1>
            <p className="text-xl text-slate-500 font-medium">Select a form to begin registration</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 w-full">
            {/* Individual Drop-Off */}
            <button 
              onClick={() => setView("individual")} 
              className="group relative h-32 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center px-10 active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#2563EB]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Individuals Form</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">Individual Shoebox Drop-Off</span>
              </div>
              <span className="ml-auto text-4xl group-hover:translate-x-2 transition-transform opacity-20 group-hover:opacity-100 text-blue-600">→</span>
            </button>

            {/* Church/Group Drop-Off */}
            <button 
              onClick={() => setView("church")} 
              className="group relative h-32 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center px-10 active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#10B981]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">Church/Group Form</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">Church/Group Shoebox Drop-Off</span>
              </div>
              <span className="ml-auto text-4xl group-hover:translate-x-2 transition-transform opacity-20 group-hover:opacity-100 text-emerald-600">→</span>
            </button>

            {/* NCW Short-Term */}
            <button 
              onClick={() => setView("ncw")} 
              className="group relative h-32 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center px-10 active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#6366F1]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">National Collection Week Form</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">NCW Short-Term Volunteer</span>
              </div>
              <span className="ml-auto text-4xl group-hover:translate-x-2 transition-transform opacity-20 group-hover:opacity-100 text-indigo-600">→</span>
            </button>

            {/* PLW Short-Term */}
            <button 
              onClick={() => setView("plw")} 
              className="group relative h-32 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center px-10 active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#F43F5E]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-rose-600 uppercase tracking-widest mb-1">Project Leader Workshop Form</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">PLW Registration</span>
              </div>
              <span className="ml-auto text-4xl group-hover:translate-x-2 transition-transform opacity-20 group-hover:opacity-100 text-indigo-600">→</span>
            </button>
          </div>
        </div>
      )}
  
      {/* 3. REGISTRATION FORM (Shown after a selection is made) */}
      {isVerified && view !== "selection" && (
        <div className="w-full max-w-3xl mt-10">
          <header className="flex flex-col md:flex-row justify-between items-center mb-10 px-2 space-y-4 md:space-y-0">
            <div className="text-left">
              <p className="text-blue-600 font-bold text-sm uppercase tracking-[0.2em] mb-1">Registration Portal</p>
              <h1 className="text-4xl font-black text-slate-900">
                {view === "individual" && "Individual"}
                {view === "church" && "Church/Group"}
                {view === "ncw" && "NCW"}
                {view === "plw" && "PLW"}
                {" Registration"}
              </h1>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setView("selection")
              }}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              ← Switch Form
            </button>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log(`Saving ${view} data:`, formData);
            }}
            className="w-full space-y-6"
          >
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
              
              {/* HEADER DATA (LOCATION & DATE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Location Code not in PLW*/}
                {view !== "plw" && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Location Code</label>
                    <input
                      type="text"
                      placeholder="|_|_|_|_|_|_|"
                      className="w-full p-5 text-xl font-mono bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all tracking-[0.3em]"
                      value={formData.locationCode}
                      onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
                    />
                  </div>
                )}

                {/* Date for Individual and Church */}
                {(view === "individual" || view === "church") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">DATE</label>
                    <input
                      type="date"
                      placeholder="MM/DD/YY"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/*PRIMARY IDENTITY (NAME & EMAIL) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">FIRST NAME / <span className="text-slate-300">NOMBRE</span></label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">LAST NAME / <span className="text-slate-300">APELLIDO</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Smith"
                    className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">EMAIL ADDRESS / <span className="text-slate-300">CORREO ELECTRÓNICO</span></label>
                <input
                  type="email"
                  placeholder="john.smith@example.com"
                  className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* LOCATION DETAILS (CITY, STATE, ZIP) */}
              <div className="space-y-8 mb-8">
                {/* Address only for PLW/NCW */}
                {(view === "plw" || view === "ncw") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Main St"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">CITY / <span className="text-slate-300">CIUDAD</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Tuscaloosa"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">STATE / <span className="text-slate-300">ESTADO</span></label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="e.g. AL"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">ZIP CODE / <span className="text-slate-300">CÓD. POST.</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      placeholder="e.g. 35401"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* CONDITIONAL SPECIFIC QUESTIONS */}

              {/* INDIVIDUAL: 18+ Acknowledgment */}
              {view === "individual" && (
                <div className="space-y-8 border-t border-slate-100 pt-8 mb-8">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                    <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                      IF YOU ARE DROPPING OFF SHOEBOX GIFTS ON BEHALF OF A CHURCH OR GROUP, 
                      PLEASE ASK FOR A CHURCH/GROUP FORM. / <span className="text-slate-500">SI ESTAS ENTREGANDO 
                      CAJAS DE REGALOS A NOMBRE DE UNA IGLESIA O GRUPO, POR FAVOR SOLICITA UN FORMULARIO PARA IGLESIA O GRUPO.</span>
                    </p>
                    <div className="h-px bg-slate-200 w-1/2 mx-auto" />
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      BY FILLING OUT THIS FORM, I ACKNOWLEDGE I AM 18 YEARS OF AGE OR OLDER. / <span className="text-slate-600">AL LLENAR ESTE FORMULARIO, ADMITO TENER POR LO MENOS 18 AÑOS DE EDAD.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* CHURCH && PLW Common Fields */}
              {(view === "church" || view === "plw") && (
                <div className="space-y-8 border-t border-slate-100 pt-8 mb-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1 text-center">
                      ARE YOU THE PROJECT LEADER OF YOUR CHURCH OR GROUP? / <span className="text-slate-300">¿ERES EL LÍDER DE PROYECTO DE TU IGLESIA O GRUPO?</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, projectLeader: "Yes" })}
                        className={`flex-1 py-5 text-2xl font-black rounded-2xl border-2 transition-all ${
                          formData.projectLeader === "Yes" 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner" 
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, projectLeader: "No" })}
                        className={`flex-1 py-5 text-2xl font-black rounded-2xl border-2 transition-all ${
                          formData.projectLeader === "No" 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner" 
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">CHURCH/GROUP NAME</label>
                      <input
                        type="text"
                        placeholder="e.g. 1st Baptist"
                        className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                        value={formData.churchOrGroupName}
                        onChange={(e) => setFormData({ ...formData, churchOrGroupName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">CHURCH/GROUP CITY</label>
                      <input
                        type="text"
                        placeholder="e.g. Tuscaloosa"
                        className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                        value={formData.churchOrGroupCity}
                        onChange={(e) => setFormData({ ...formData, churchOrGroupCity: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NCW: Serving Interest */}
              {view === "ncw" && (
                <div className="space-y-8 border-t border-slate-100 pt-8 mb-8">
                  <div className="space-y-4 text-center">
                    <label className="block text-lg font-bold text-slate-800">
                      Local volunteer teams serve throughout the year. Are you interested in learning more?
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, interestedInServing: "Yes" })}
                        className={`flex-1 py-5 text-2xl font-black rounded-2xl border-2 transition-all ${
                          formData.interestedInServing === "Yes" 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner" 
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, interestedInServing: "No" })}
                        className={`flex-1 py-5 text-2xl font-black rounded-2xl border-2 transition-all ${
                          formData.interestedInServing === "No" 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner" 
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PLW: Feedback and Support */}
              {view === "plw" && (
                <div className="space-y-8 border-t border-slate-100 pt-8 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">How did you hear about this event?</label>
                    <input
                      type="text"
                      placeholder="e.g. Church bulletin, Friend"
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                      value={formData.referralSource}
                      onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1 leading-relaxed">How can we support your OCC ministry?</label>
                    <textarea
                      rows={4}
                      className="w-full p-5 text-xl bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                      value={formData.supportNeeds}
                      onChange={(e) => setFormData({ ...formData, supportNeeds: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-6 bg-slate-900 hover:bg-black text-white text-2xl font-bold rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all tracking-tight"
              >
                Complete Registration
              </button>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-4 text-lg text-slate-400 font-bold hover:text-red-500 transition-colors"
            >
              Reset Terminal and Exit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}



