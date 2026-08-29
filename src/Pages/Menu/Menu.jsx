import React, { useState, useEffect } from "react";
import { AiOutlineClose, AiOutlineLeft, AiOutlineRight } from "react-icons/ai"; // Importing icons
import { useTranslation } from 'react-i18next'; // <-- Importing useTranslation hook
import { useGet } from "../../Hooks/useGet";
import StaticSpinner from "../../Components/Spinners/StaticSpinner";

const Menu = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const { t, i18n } = useTranslation(); // <-- use i18n to change language
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { refetch: refetchMenu, loading: loadingMenuData, data: dataMenu } = useGet({
    url: `${apiUrl}/customer/home/menue`,
  });
  const [menuImages, setMenuImages] = useState([]);

  useEffect(() => {
    refetchMenu();
  }, [refetchMenu]);

  // Update state with fetched Menu data
  useEffect(() => {
    if (dataMenu && dataMenu.menue_images) {
      setMenuImages(dataMenu.menue_images)
    }
  }, [dataMenu]);
  const handlePrev = () => {
    setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : menuImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prevIndex) => (prevIndex < menuImages.length - 1 ? prevIndex + 1 : 0));
  };

  if (loadingMenuData) {
    return (
      <div className="flex h-screen justify-center items-center">
        <StaticSpinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      {menuImages.length === 0 ? (
        <div className="flex h-screen justify-center items-center">
        <p className="text-center text-gray-500">No menu images available.</p>
        </div>
      ) : (
        menuImages.map((src, index) => (
          <div key={index} className="overflow-hidden rounded-lg">
            <img
              src={src.image_link}
              alt={`menu-item-${index}`}
              className="w-full lg:h-[520px] h-auto cursor-pointer transition-transform duration-300 hover:scale-110"
              onClick={() => setSelectedIndex(index)}
            />
          </div>
        ))
      )}

      {/* Fullscreen Image View */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black bg-opacity-80 md:p-8">
          {/* Close Button */}
          <button
            className="absolute p-2 text-black transition bg-white rounded-full shadow-lg top-5 right-5 hover:bg-gray-300"
            onClick={() => setSelectedIndex(null)}
          >
            <AiOutlineClose size={24} className="text-mainColor" />
          </button>

          {/* Previous Button */}
          <button
            className="absolute p-1 text-black transition bg-white rounded-full shadow-lg left-1 xl:left-24 hover:bg-gray-300"
            onClick={handlePrev}
          >
            <AiOutlineLeft size={20} className="text-mainColor" />
          </button>

          {/* Display Image */}
          <img src={menuImages[selectedIndex].image_link} className="max-w-full max-h-full rounded-lg" alt="Enlarged" />

          {/* Next Button */}
          <button
            className="absolute p-1 text-black transition bg-white rounded-full shadow-lg right-1 xl:right-24 hover:bg-gray-300"
            onClick={handleNext}
          >
            <AiOutlineRight size={20} className="text-mainColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;
