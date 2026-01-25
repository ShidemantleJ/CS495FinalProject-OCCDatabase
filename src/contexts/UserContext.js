import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Always get fresh session from Supabase
      const {
        data: { user },
      } = await auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Subscribe to login/logout changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
