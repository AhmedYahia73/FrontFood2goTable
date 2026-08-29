import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaHome,
  FaClock,
  FaUtensils,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MdOutlineDirections } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useGet } from '../../Hooks/useGet';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useSelector } from 'react-redux';

const Branch = () => {
  const { t, i18n } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const { refetch: refetchLocations, loading: loadingLocationsData, data: dataLocations } = useGet({
    url: `${apiUrl}/customer/address/lists1?&locale=${selectedLanguage}`,
  });
  const [branches, setBranches] = useState([]);
  const [callCenterPhone, setCallCenterPhone] = useState('');

  useEffect(() => {
    refetchLocations();
  }, [refetchLocations, selectedLanguage]);

  useEffect(() => {
    if (dataLocations && dataLocations.branches && dataLocations.call_center_phone) {
      setBranches(dataLocations.branches);
      setCallCenterPhone(dataLocations.call_center_phone);
    }
  }, [dataLocations]);

  const formatWorkingHours = (hours) => {
    if (!hours) return t('NotAvailable');

    try {
      const hoursObj = typeof hours === 'string' ? JSON.parse(hours) : hours;
      return Object.entries(hoursObj)
        .map(([day, time]) => `${t(day)}: ${time}`)
        .join(', ');
    } catch (e) {
      return hours;
    }
  };

  // Phone number formatter
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format based on length (adjust for your country's format)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    return phone;
  };

  if (loadingLocationsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <StaticSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-mainColor">{t('OurBranches')}</h1>
        <p className="max-w-md mx-auto text-gray-600">{t('FindOurLocationsNearYou')}</p>
      </div>

      {branches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch, index) => {

            // Logic to determine which phone number to use
            const rawPhoneNumber = branch.phone_status === 1 ? branch.phone : callCenterPhone;
            const displayPhoneNumber = formatPhoneNumber(rawPhoneNumber);

            return (
              <div
                key={index}
                className="flex w-full max-w-full p-4 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-md rounded-xl hover:shadow-lg group"
              >
                {/* Image Section - Left Side */}
                <div className="relative flex-shrink-0 w-20 h-20 mr-4 overflow-hidden bg-gray-100 rounded-lg">
                  <img
                    src={branch.image_link || '/api/placeholder/300/200'}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                    alt={branch.name}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YzlkYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iPkJyYW5jaCBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>

                {/* Content Section - Right Side */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  {/* Branch Name and Details */}
                  <div className="flex flex-col gap-2 mb-3">
                    {/* Branch Name */}
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-red-500 flex-shrink-0 mt-0.5 text-sm" />
                      <div className="flex-1 min-w-0">
                        <h2 className="pr-1 text-base font-semibold text-gray-800 truncate line-clamp-1">
                          {branch.name}
                        </h2>
                      </div>
                    </div>

                    {/* Branch Details */}
                    <div className="space-y-1.5 text-gray-600 text-xs leading-tight">
                      {/* Address */}
                      <div className="flex items-start gap-1.5">
                        <FaHome className="text-blue-500 flex-shrink-0 mt-0.5 text-sm" />
                        <p className="flex-1 pr-1 break-words line-clamp-2">
                          {branch.address || t('AddressNotAvailable')}
                        </p>
                      </div>

                      {/* Phone - MODIFIED FOR ONE-CLICK CALL */}
                      {rawPhoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <FaPhoneAlt className="flex-shrink-0 text-sm text-green-500" />
                          <a
                            href={`tel:${rawPhoneNumber.replace(/\D/g, '')}`} // Use tel: scheme with cleaned number
                            className="font-medium truncate text-green-500 hover:text-green-700 transition-colors duration-150"
                            title={`${t('Call')} ${displayPhoneNumber}`}
                          >
                            {displayPhoneNumber}
                          </a>
                        </div>
                      )}

                      {/* Working Hours */}
                      {branch.working_hours && (
                        <div className="flex items-start gap-1.5">
                          <FaClock className="text-purple-500 flex-shrink-0 mt-0.5 text-sm" />
                          <span className="flex-1 pr-1 text-gray-500 break-words line-clamp-2">
                            {formatWorkingHours(branch.working_hours)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* View Products Button */}
                    {/* <Link
                      to={`/products`}
                      className="group/btn flex items-center gap-1.5 px-2.5 py-1.5 bg-mainColor text-white rounded-lg hover:bg-mainColor/90 transition-all duration-200 font-medium text-xs flex-shrink-0 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      title={`${t('ViewProducts')} - ${branch.name}`}
                    >
                      <FaUtensils className="text-xs" />
                      <span className="whitespace-nowrap">{t('ViewProducts')}</span>
                    </Link> */}

                    {/* Directions Button */}
                    {branch.map && (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={branch.map}
                        className="group/btn flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-mainColor hover:text-mainColor transition-all duration-200 font-medium text-xs flex-shrink-0 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        title={`${t('GetDirections')} - ${branch.name}`}
                      >
                        <MdOutlineDirections className="text-sm" />
                        <span className="whitespace-nowrap">{t('Directions')}</span>
                      </a>
                    )}

                    {/* Overflow Menu Button (if no map) */}
                    {!branch.map && (
                      <button className="flex items-center justify-center flex-shrink-0 w-6 h-6 ml-1 text-gray-400 transition-colors duration-200 rounded-full hover:text-gray-600 hover:bg-gray-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center bg-white border border-gray-100 shadow-md rounded-xl">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
            <FaMapMarkerAlt className="text-xl text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">{t('NoBranchesAvailable')}</h3>
          <p className="text-sm text-gray-500">{t('CheckBackLaterForNewLocations')}</p>
        </div>
      )}

      {/* Call Center Information (Already correctly using tel: link) */}
      {callCenterPhone && (
        <div className="p-4 mt-6 text-center border bg-gradient-to-r from-mainColor/10 to-mainColor/5 border-mainColor/10 text-mainColor rounded-xl md:p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-mainColor bg-opacity-10">
              <FaPhoneAlt className="text-sm text-white" />
            </div>
            <h3 className="text-base font-semibold">{t('NeedHelp')}</h3>
          </div>
          <p className="mb-4 text-sm opacity-90">{t('CallOurCustomerService')}</p>
          <a
            href={`tel:${callCenterPhone}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-sm text-mainColor hover:bg-gray-50 hover:shadow-md"
            title={`Call ${formatPhoneNumber(callCenterPhone)}`}
          >
            <FaPhoneAlt className="text-sm" />
            <span className="whitespace-nowrap">{formatPhoneNumber(callCenterPhone)}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default Branch;