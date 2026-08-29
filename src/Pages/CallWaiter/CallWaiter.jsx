import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../Hooks/usePost";
import { Bell, CheckCircle, AlertCircle, Users, Clock, Utensils } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

const CallWaiter = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { postData, loadingPost, response } = usePost({
    url: `${apiUrl}/client/call_waiter`,
  });
  const [isCallSent, setIsCallSent] = useState(false);
  const tableId = useSelector((state) => state.table?.data) || localStorage.getItem("table_id");

  // Check for table_id in localStorage on component mount
  //   useEffect(() => {
  //     const storedTableId = localStorage.getItem("table_id");
  //     if (!storedTableId) {
  //       toast.error("Please scan QR table first", {
  //         position: "top-center",
  //         autoClose: 3000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         theme: "colored",
  //       });
  //       setTimeout(() => navigate("/qr_scan"), 3000);
  //     } else {
  //       setTableId(storedTableId);
  //     }
  //   }, [navigate]);

  // Handle response after API call
  useEffect(() => {
    if (!loadingPost && response?.status === 200) {
      setIsCallSent(true);
      toast.success("Waiter called successfully! They'll be with you shortly.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "colored",
      });
      setTimeout(() => setIsCallSent(false), 3000);
    }
  }, [loadingPost, response]);

  // Handle form submission
  const handleCallWaiter = (e) => {
    e.preventDefault();
    if (!tableId) return;

    const formData = new FormData();
    formData.append("table_id", tableId);

    postData(formData);
  };

  return (
    <div className="min-h-screen bg-white flex justify-center p-4 font-sans">
      <ToastContainer />
      <div className=" w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl">
          {/* Header */}
          <div className="bg-[var(--color-main)] px-4 py-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-main)] to-[var(--color-second)] opacity-80"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Bell className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                Call Your Waiter
              </h1>
              <p className="text-white font-sm">
                Prompt service at your fingertips
              </p>
            </div>
          </div>
          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* Table Info */}
            {tableId && (
              <div className="bg-[#F5F5F5] rounded-2xl p-6 transition-all duration-300 hover:bg-[#F4F4F4]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-main)]/10 rounded-full flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-[var(--color-main)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Table Information</h3>
                      <p className="text-sm text-[var(--color-fourth)]">Current table</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--color-main)]">{tableId}</div>
                  </div>
                </div>
              </div>
            )}
            {/* Service Features */}
            <div className="space-y-2">
              <div className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl transition-all duration-300 hover:bg-[#F4F4F4]">
                <div className="w-10 h-10 bg-[var(--color-main)]/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--color-main)]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Personal Service</h4>
                  <p className="text-sm text-[var(--color-fourth)]">Dedicated waiter assistance</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl transition-all duration-300 hover:bg-[#F4F4F4]">
                <div className="w-10 h-10 bg-[var(--color-main)]/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[var(--color-main)]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Quick Response</h4>
                  <p className="text-sm text-[var(--color-fourth)]">Average response time: 2-3 min</p>
                </div>
              </div>
            </div>
            {/* Call Button */}
            <button
              onClick={handleCallWaiter}
              disabled={loadingPost || isCallSent || !tableId}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform flex items-center justify-center gap-2 ${loadingPost || isCallSent || !tableId
                ? "bg-[var(--color-main)] text-white cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-[var(--color-main)] to-[var(--color-second)] text-white hover:from-[var(--color-second)] hover:to-[var(--color-main)] hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                }`}
            >
              {loadingPost ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle stroke="currentColor" strokeWidth="4" fill="none" r="10" cy="12" cx="12" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V1" />
                  </svg>
                  Calling Waiter...
                </>
              ) : isCallSent ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Waiter Called!
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Call Waiter
                </>
              )}
            </button>
            {/* Scan QR Button */}
            {/* <button
              onClick={() => navigate("/qr_scan")}
              className="w-full py-3 px-6 rounded-xl font-medium text-[var(--color-main)] bg-[#ffffff] hover:bg-[#F4F4F4] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Scan QR Code
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallWaiter;