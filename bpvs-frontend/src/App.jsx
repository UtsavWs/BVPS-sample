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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        {/* Protected routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/contact-info" element={<ContactInfo />} />
        <Route path="/business-info" element={<BusinessInfo />} />
        <Route path="/other-info" element={<OtherInfo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/members" element={<BvpsMembers />} />
        <Route path="/add-b2b" element={<AddB2B />} />
        <Route path="/add-visitor" element={<AddVisitor />} />
        <Route path="/add-referral" element={<AddReferral />} />
        <Route path="/add-thankyouslip" element={<AddThankYouSlip />} />
        <Route path='/activity' element={<ActivityLog />} />
        <Route path='/add-testimonial' element={<AddTestimonial />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/admin" element={<AdminManageMembers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
