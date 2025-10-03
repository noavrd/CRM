import { type PropsWithChildren, useEffect, useState } from "react";
import { onAuth } from "@/lib/firebase";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => onAuth(u => { setUser(u); setReady(true); }), []);

  // TODO maybe add spinner
  if (!ready) return null; 
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
