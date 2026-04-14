import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import OtpVerificationPage from "./pages/auth/OtpVerificationPage";
import SplashScreen from "./pages/onboarding/SplashScreen";
import Onboarding from "./pages/onboarding/Onboarding";
import UserDashboard from "./pages/UserDashboard";
import MyProfile from "./pages/MyProfile";
import ContactInfo from "./pages/ContactInfo";
import BusinessInfo from "./pages/BusinessInfo";
import OtherInfo from "./pages/OtherInfo";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/auth/ResetPassword";
import AboutUs from "./pages/AboutUs";
import BvpsMembers from "./pages/BvpsMembers";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AddB2B from "./pages/AddB2b";
import AddVisitor from "./pages/AddVisitor";
import AddReferral from "./pages/AddReferral";
import AddThankYouSlip from "./pages/AddThankyouSlip";
import ActivityLog from "./pages/ActivityLog";
import AddTestimonial from "./pages/AddTestimonial";
import PendingApproval from "./pages/PendingApproval";
import AdminManageMembers from "./pages/AdminManageMembers";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Protected routes — require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/contact-info" element={<ProtectedRoute><ContactInfo /></ProtectedRoute>} />
        <Route path="/business-info" element={<ProtectedRoute><BusinessInfo /></ProtectedRoute>} />
        <Route path="/other-info" element={<ProtectedRoute><OtherInfo /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />
        <Route path="/about-us" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><BvpsMembers /></ProtectedRoute>} />
        <Route path="/add-b2b" element={<ProtectedRoute><AddB2B /></ProtectedRoute>} />
        <Route path="/add-visitor" element={<ProtectedRoute><AddVisitor /></ProtectedRoute>} />
        <Route path="/add-referral" element={<ProtectedRoute><AddReferral /></ProtectedRoute>} />
        <Route path="/add-thankyouslip" element={<ProtectedRoute><AddThankYouSlip /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
        <Route path="/add-testimonial" element={<ProtectedRoute><AddTestimonial /></ProtectedRoute>} />

        {/* Admin-only route */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminManageMembers /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

