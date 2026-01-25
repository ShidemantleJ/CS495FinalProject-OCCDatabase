import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Mobile() {
  const [isVerified, setIsVerified] = useState(false); // false = Admin Login, true = Registration Form
  const [formData, setFormData] = useState({ name: "", email: "" }); //Can add more fields as needed once we get the actual paper forms
  const [validAdmin, setValidAdmin] = useState({ email: "", password: "" });

  //Handle Admin Login, and so hitting enter doesn't refresh the page
  const handleNextStep = (e) => {
    if (e) e.preventDefault(); 
    
    if (validAdmin.email === "admin@gmail.com" && validAdmin.password === "admin123") { //Can later replace with actual auth from Supabase
      setIsVerified(true);
    } else {
      alert("Invalid credentials. Try: admin@gmail.com / admin123");
    }
  };    

  //If Cancel is clicked, reset everything
  const handleCancel = () => {
    setIsVerified(false);
    setFormData({ name: "", email: "" });
    setValidAdmin({ email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 px-4 flex flex-col items-center">
      
    {/* ADMIN LOGIN / START SCREEN */}
    {!isVerified && (
    <div className="max-w-md w-full bg-white shadow-xl rounded-3xl p-10 border-2 border-slate-200 text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-slate-900">Admin Login</h1>
        
        {/* Form element allows the iPad 'Go' button to work */}
        <form onSubmit={handleNextStep} className="space-y-4">
            <div className="text-left">
                <label className="block text-lg font-bold text-slate-700 mb-1 ml-2">Admin Email</label>
                <input 
                    type="email" 
                    placeholder="admin@gmail.com" 
                    className="w-full p-4 text-xl border-2 border-slate-200 rounded-2xl bg-white text-slate-900"
                    value={validAdmin.email}
                    onChange={(e) => setValidAdmin({...validAdmin, email: e.target.value})}
                    required
                />
            </div>

            <div className="text-left">
                <label className="block text-lg font-bold text-slate-700 mb-1 ml-2">Admin Password</label>
                <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full p-4 text-xl border-2 border-slate-200 rounded-2xl bg-white text-slate-900"
                    value={validAdmin.password}
                    onChange={(e) => setValidAdmin({...validAdmin, password: e.target.value})}
                    required
                />
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
                <p className="text-blue-800 font-bold text-lg">Demo Credentials:</p>
                <p className="text-blue-600 font-medium italic">admin@gmail.com / admin123</p>
            </div>
            
            <button 
                type="submit"
                className="w-full py-6 bg-blue-600 text-white text-3xl font-black rounded-2xl shadow-[0_8px_0_rgb(30,64,175)] active:translate-y-1 active:shadow-none transition-all"
            >
                START HERE
            </button>
        </form>
    </div>
    )}

    {/*REGISTRATION FORM */}
    {isVerified && (
    <>
        <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900">Registration</h1>
        <p className="text-xl text-slate-600 mt-2">Step 1 of 2: Basic Info</p>
        </header>

        {/* Form element allows the iPad 'Go' button to work */}
        <form 
        onSubmit={(e) => {
            e.preventDefault(); // Prevents the page from refreshing
            console.log("Saving data:", formData);
            // This is where we will call Supabase later
        }} 
        className="max-w-md w-full space-y-8"
        >
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-200">
            <div className="mb-8">
            <label className="block text-2xl font-bold text-slate-800 mb-3">Person's Name</label>
            <input 
                type="text" 
                placeholder="Example: John Smith"
                className="w-full p-5 text-2xl border-4 border-blue-100 rounded-2xl focus:border-blue-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required // Simple validation for older users
            />
            </div>

            <div className="mb-8">
            <label className="block text-2xl font-bold text-slate-800 mb-3">Email Address</label>
            <input 
                type="email" 
                placeholder="name@email.com"
                className="w-full p-5 text-2xl border-4 border-blue-100 rounded-2xl focus:border-blue-500 outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
            />
            </div>

            <button 
                type="submit" 
                className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-3xl font-black rounded-2xl shadow-[0_8px_0_rgb(22,101,52)] active:translate-y-1 active:shadow-none transition-all"
            >
                SAVE INFORMATION
            </button>
        </div>

        <button 
            type="button" // Use type="button" so it doesn't submit the form
            onClick={handleCancel} 
            className="w-full py-4 text-xl text-slate-400 font-semibold hover:text-red-500"
        >
            Cancel and Go Back
        </button>
        </form>
    </>
    )}
    </div>
  );
}