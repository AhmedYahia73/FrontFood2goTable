import React from 'react'; // Removed useEffect, useState as they are no longer strictly needed for this pattern
import { PulseLoader } from 'react-spinners';
import { useSelector } from 'react-redux';

const LoaderLogin = () => {
  const mainData = useSelector(state => state.mainData?.data);

  // Determine the logo source
  const logoLink = mainData?.logo_link;

  // Get main color from Redux or use a default
  const mainColor = mainData?.first_color || '#333';

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-white">
      <div className="flex flex-col justify-center items-center">
        {logoLink ? (
          // If logo_link is available, display the image
          <img
            src={logoLink}
            width={250}
            height={250}
            alt="Company Logo"
            className="object-contain mb-5"
            // Optional: Add an onError if you want a local fallback for broken links
            // onError={(e) => { e.target.src = 'path/to/your/fallback/logo.png'; }}
          />
        ) : (
          // If logo_link is NOT available, display a skeleton placeholder
          <div
            className="w-[250px] h-[250px] bg-gray-200 rounded-full flex items-center justify-center mb-5 animate-pulse"
            style={{ width: 250, height: 250 }} // Ensure dimensions match the image
          >
            {/* You can add a simple text or icon inside the placeholder if you want */}
            {/* <span className="text-gray-400 text-lg">Logo</span> */}
          </div>
        )}
        <PulseLoader color={mainColor} size={20} />
      </div>
    </div>
  );
};

export default LoaderLogin;