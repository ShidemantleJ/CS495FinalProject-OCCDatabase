import { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../contexts/UserContext";

export default function useLastActivity() {
  const { user, loading } = useUser();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(new Date()); // track last activity on the client side
  const throttleMs = 60 * 1000; // regular throttle (60sec)
  const logoutThreshold = 15 * 60 * 1000; // time (in ms) of inactivity required to log out user

  useEffect(() => {
    if (!user || loading) return;

    // Function to update last_activity in Supabase
    const updateActivity = async () => {
      const { data, error } = await supabase
        .from("users")
        .upsert({ id: user.id, last_activity: new Date() });
      lastActivityRef.current = new Date(); // reset local timer

      if (error) console.error(error);
    };

    const scheduleUpdate = () => {
      const now = new Date();
      const timeSinceLast = now - lastActivityRef.current;
      const timeLeft = logoutThreshold - timeSinceLast;

      // If less than 1 min until logout threshold, update immediately. Otherwise, wait 60s to avoid spamming DB
      const delay = timeLeft <= 60000 ? 0 : throttleMs;

      if (timeoutRef.current) clearTimeout(timeoutRef.current); // reset timeout

      timeoutRef.current = setTimeout(async () => {
        await updateActivity();
        timeoutRef.current = null;
      }, delay); // create new timeout, updating DB with last activity time after delay
    };

    // Update immediately on mount
    updateActivity();

    const events = ["click", "mousemove", "keydown", "scroll"];
    const handleActivity = () => {
      lastActivityRef.current = new Date(); // reset local last activity timestamp
      scheduleUpdate(); // schedule last_activity update in DB
    };

    events.forEach((event) => window.addEventListener(event, handleActivity)); // track click, mouse, keypress, and scroll events as activity

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);
}
