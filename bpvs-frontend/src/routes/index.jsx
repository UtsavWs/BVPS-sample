import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import PublicRoutes from "./public/PublicRoutes";
import ProtectedRoutes from "./protected/ProtectedRoutes";
import AdminRoutes from "./protected/AdminRoutes";
import { PUBLIC_PATHS, PROTECTED_PATHS, ADMIN_PATHS } from "./paths";
import LoadingScreen from "../components/LoadingScreen";

// ─── Lazy Page Imports ────────────────────────────────────────────────────────

const SplashScreen = lazy(() => import("../pages/onboarding/SplashScreen"));
const Onboarding = lazy(() => import("../pages/onboarding/Onboarding"));

const SignUp = lazy(() => import("../pages/auth/SignUp"));
const Login = lazy(() => import("../pages/auth/Login"));
const OtpVerificationPage = lazy(() => import("../pages/auth/OtpVerificationPage"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));

const UserDashboard = lazy(() => import("../pages/UserDashboard"));
const MyProfile = lazy(() => import("../pages/MyProfile"));
const EditProfile = lazy(() => import("../pages/EditProfile"));
const ContactInfo = lazy(() => import("../pages/ContactInfo"));
const BusinessInfo = lazy(() => import("../pages/BusinessInfo"));
const OtherInfo = lazy(() => import("../pages/OtherInfo"));
const Settings = lazy(() => import("../pages/Settings"));
const BvpsMembers = lazy(() => import("../pages/BvpsMembers"));
const ActivityLog = lazy(() => import("../pages/ActivityLog"));
const PendingApproval = lazy(() => import("../pages/PendingApproval"));
const AboutUs = lazy(() => import("../pages/AboutUs"));
const AddB2B = lazy(() => import("../pages/AddB2b"));
const AddVisitor = lazy(() => import("../pages/AddVisitor"));
const AddReferral = lazy(() => import("../pages/AddReferral"));
const AddThankYouSlip = lazy(() => import("../pages/AddThankyouSlip"));
const AddTestimonial = lazy(() => import("../pages/AddTestimonial"));

const AdminManageMembers = lazy(() => import("../pages/admin/AdminManageMembers"));

// ─── Route Config ─────────────────────────────────────────────────────────────

const openRoutes = [
  { path: PUBLIC_PATHS.SPLASH, element: <SplashScreen /> },
  { path: PUBLIC_PATHS.ONBOARDING, element: <Onboarding /> },
];

const authRoutes = [
  { path: PUBLIC_PATHS.LOGIN, element: <Login /> },
  { path: PUBLIC_PATHS.SIGNUP, element: <SignUp /> },
  { path: PUBLIC_PATHS.VERIFY_OTP, element: <OtpVerificationPage /> },
  { path: PUBLIC_PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
  { path: PUBLIC_PATHS.RESET_PASSWORD, element: <ResetPassword /> },
];

const privateRoutes = [
  { path: PROTECTED_PATHS.DASHBOARD, element: <UserDashboard /> },
  { path: PROTECTED_PATHS.MY_PROFILE, element: <MyProfile /> },
  { path: PROTECTED_PATHS.EDIT_PROFILE, element: <EditProfile /> },
  { path: PROTECTED_PATHS.CONTACT_INFO, element: <ContactInfo /> },
  { path: PROTECTED_PATHS.BUSINESS_INFO, element: <BusinessInfo /> },
  { path: PROTECTED_PATHS.OTHER_INFO, element: <OtherInfo /> },
  { path: PROTECTED_PATHS.SETTINGS, element: <Settings /> },
  { path: PROTECTED_PATHS.MEMBERS, element: <BvpsMembers /> },
  { path: PROTECTED_PATHS.ACTIVITY, element: <ActivityLog /> },
  { path: PROTECTED_PATHS.PENDING_APPROVAL, element: <PendingApproval /> },
  { path: PROTECTED_PATHS.ABOUT_US, element: <AboutUs /> },
  { path: PROTECTED_PATHS.ADD_B2B, element: <AddB2B /> },
  { path: PROTECTED_PATHS.ADD_VISITOR, element: <AddVisitor /> },
  { path: PROTECTED_PATHS.ADD_REFERRAL, element: <AddReferral /> },
  { path: PROTECTED_PATHS.ADD_THANKYOU_SLIP, element: <AddThankYouSlip /> },
  { path: PROTECTED_PATHS.ADD_TESTIMONIAL, element: <AddTestimonial /> },
];

const adminRoutes = [
  { path: ADMIN_PATHS.ADMIN_MEMBERS, element: <AdminManageMembers /> },
];

const renderRoutes = (routes) =>
  routes.map(({ path, element }) => (
    <Route key={path} path={path} element={element} />
  ));

// ─── App Routes ───────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {renderRoutes(openRoutes)}

        <Route element={<PublicRoutes />}>{renderRoutes(authRoutes)}</Route>

        <Route element={<ProtectedRoutes />}>
          {renderRoutes(privateRoutes)}
          <Route element={<AdminRoutes />}>{renderRoutes(adminRoutes)}</Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
