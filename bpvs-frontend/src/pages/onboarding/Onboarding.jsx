import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingData from '../../static-data/onboardingData.json';
import { AuthContext } from '../../context/AuthContext';


export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/login');
    }
  };

  const handleSkip = () => {
    // Jump directly to the last slide (Get Started)
    setCurrentStep(onboardingData.length - 1);
  };

  const data = onboardingData[currentStep];

  return (
    <div className="flex items-center justify-center h-[100dvh] md:h-screen bg-white md:bg-gray-50 font-sans overflow-hidden">
      {/* Card wrapper — full screen on mobile, centered card on tablet/desktop */}
      <div className="flex flex-col items-center w-full h-full md:h-[90vh] md:max-w-lg lg:max-w-xl md:bg-white md:rounded-3xl md:shadow-xl px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-4 lg:px-14 lg:py-8">

        {/* Top Header / Back Button */}
        <div className="w-full flex justify-start shrink-0 h-7 md:h-9">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-[#1B3A5C] text-xl md:text-2xl hover:opacity-70 transition-opacity"
            >
              ←
            </button>
          )}
        </div>

        {/* Content Area — grows to fill available space */}
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm md:max-w-md lg:max-w-lg px-2 flex-1 min-h-0 overflow-hidden">
          <img
            src={data.image}
            alt="Onboarding"
            className="w-44 h-44 sm:w-52 sm:h-52 md:max-h-[25vh] md:w-auto md:h-auto mb-4 sm:mb-5 md:mb-3 object-contain shrink-0"
            style={{ maxHeight: 'min(25vh, 220px)' }}
          />

          <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-4xl font-bold text-[#1B3A5C] leading-tight shrink-0">
            {data.title}{' '}
            <span className="text-[#C1512D]">{data.highlight}</span>
          </h1>

          <p className="mt-2 sm:mt-3 md:mt-2 text-gray-500 text-sm md:text-sm lg:text-base leading-relaxed px-2 md:px-4 shrink-0">
            {data.description}
          </p>

          {/* Progress Indicators (Dots) */}
          <div className="flex gap-2 md:gap-2.5 mt-4 sm:mt-5 md:mt-3 shrink-0">
            {onboardingData.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep ? 'w-8 bg-[#C1512D]' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="w-full max-w-sm md:max-w-md flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-5 md:mb-0 px-2 md:px-4 mt-4 md:mt-3 shrink-0">
          <button
            onClick={handleNext}
            className="w-full bg-[#C1512D] text-white py-3 sm:py-3.5 md:py-3 lg:py-4 rounded-xl font-semibold text-base sm:text-lg md:text-base lg:text-xl hover:bg-[#A8432A] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            {data.buttonText}
          </button>

          {currentStep < onboardingData.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-gray-400 font-medium text-sm sm:text-base md:text-sm lg:text-base hover:text-gray-500 transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}