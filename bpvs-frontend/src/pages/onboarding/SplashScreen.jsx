import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <>
      <div
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(165deg, #c8d4de 0%, #d8c5be 55%, #e0c4bc 100%)",
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {/* Logo Badge */}
          <div className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto">
            <img
              src="/assets/logos/BPVS Logo.svg"
              alt="BPVS Logo"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;
