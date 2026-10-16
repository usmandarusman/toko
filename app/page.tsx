/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import AuthGate from "./components/AuthGate";
import Dashboard from "./Dashboard";





// AuthGate memastikan dashboard baru dimuat setelah login Google berhasil.
export default function Home() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
