import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PrintBill from "./components/PrintBill";
import Toasts from "./components/Toasts";
import Admin from "./pages/Admin";
import Billing from "./pages/Billing";
import History from "./pages/History";
import Reports from "./pages/Reports";
import { AppProvider, useApp } from "./store/AppContext";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="no-print h-dvh">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Billing />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </div>
        <Toasts />
        <PrintHost />
      </AppProvider>
    </BrowserRouter>
  );
}

function PrintHost() {
  const { printBill, printNonce } = useApp();
  useEffect(() => {
    if (!printNonce || !printBill) return undefined;
    const timer = setTimeout(() => window.print(), 90);
    return () => clearTimeout(timer);
  }, [printNonce, printBill]);

  return (
    <div id="print-root" aria-hidden="true">
      <PrintBill />
    </div>
  );
}
