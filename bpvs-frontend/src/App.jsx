import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#1f2937",
            boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
          },
          success: { iconTheme: { primary: "#16A34A", secondary: "#fff" } },
          error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
