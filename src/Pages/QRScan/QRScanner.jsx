import React, { useState, useRef, useEffect } from "react";
import QrReader from "react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTableId } from "../../Store/Slices/tableSlice"; // We'll create this slice

const QRScanner = () => {
  const [data, setData] = useState("No result");
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [error, setError] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const qrReaderRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (err) {
        setHasCameraPermission(false);
        setError("Camera access is required to scan QR codes");
      }
    };

    checkCameraPermission();
  }, []);

  const handleScan = (result) => {
    if (result) {
      const scannedData = result.text;
      setData(scannedData);
      setIsScanning(false);
      setError("");

      // Save to localStorage
      localStorage.setItem("table_id", scannedData);

      // Save to Redux store
      dispatch(setTableId(scannedData));

      // Navigate to products page
      navigate("/products");

      // Add to scan history if not a duplicate
      setScanHistory(prev => {
        if (!prev.includes(scannedData)) {
          return [scannedData, ...prev.slice(0, 4)]; // Keep last 5 scans
        }
        return prev;
      });
    }
    // else {
    //   localStorage.setItem("table_id", '8');
    //   // Save to Redux store
    //   dispatch(setTableId('8'));
    //   navigate("/products");
    // }
  };

  const handleError = (err) => {
    console.error(err);
    setError("Failed to access camera. Please check permissions.");
    setIsScanning(false);
  };

  const toggleScan = () => {
    if (hasCameraPermission === false) {
      setError("Camera access denied. Please enable camera permissions in your browser settings.");
      return;
    }

    setIsScanning(!isScanning);
    setError("");
    if (!isScanning) {
      setData("No result");
    }
  };

  const copyToClipboard = () => {
    if (data && data !== "No result") {
      navigator.clipboard.writeText(data)
        .then(() => {
          // Show temporary success message
          const originalText = document.querySelector('.copy-btn').textContent;
          document.querySelector('.copy-btn').textContent = 'Copied!';
          setTimeout(() => {
            document.querySelector('.copy-btn').textContent = originalText;
          }, 2000);
        })
        .catch(err => {
          setError('Failed to copy to clipboard');
        });
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const retryScan = () => {
    setError("");
    if (hasCameraPermission) {
      setIsScanning(true);
      setData("No result");
    }
  };

  const previewStyle = {
    height: 400,
    width: 400,
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-red-100">
      <div className="rounded-2xl p-6 shadow-2xl max-w-md w-full bg-white">
        <h1 className="text-3xl font-bold text-center mb-2 text-red-600">
          Table QR Scanner
        </h1>
        <p className="text-center text-gray-600 mb-6">Scan your table QR code to get started</p>

        <div className="relative flex justify-center">
          {isScanning ? (
            <div style={previewStyle}>
              <QrReader
                ref={qrReaderRef}
                delay={300}
                onError={handleError}
                onScan={handleScan}
                constraints={{
                  video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                }}
                style={{ height: "100%", width: "100%", objectFit: "cover" }}
              />

              {/* Scanning overlay with improved animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-transparent rounded-lg relative">
                  {/* Corner markers */}
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-6 h-6 border-4 animate-pulse ${i === 0 ? "top-0 left-0 border-t-red-500 border-l-red-500 rounded-tl" :
                          i === 1 ? "top-0 right-0 border-t-red-500 border-r-red-500 rounded-tr" :
                            i === 2 ? "bottom-0 left-0 border-b-red-500 border-l-red-500 rounded-bl" :
                              "bottom-0 right-0 border-b-red-500 border-r-red-500 rounded-br"
                        }`}
                    ></div>
                  ))}

                  {/* Scanning line */}
                  <div className="absolute top-1/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-scan">
                    <style>
                      {`
                        @keyframes scan {
                          0% { transform: translateY(0); }
                          100% { transform: translateY(200px); }
                        }
                        .animate-scan {
                          animation: scan 2s linear infinite;
                        }
                      `}
                    </style>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-1 px-2 text-sm">
                Point your camera at a table QR code
              </div>
            </div>
          ) : (
            <div
              style={previewStyle}
              className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300"
            >
              {hasCameraPermission === false ? (
                <div className="text-center p-4">
                  <div className="text-red-500 text-5xl mb-2">📷</div>
                  <p className="font-medium text-gray-700">Camera access required</p>
                  <p className="text-sm text-gray-500 mt-2">Please enable camera permissions to scan QR codes</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-5xl mb-2 text-gray-400">🔍</div>
                  <p className="font-medium text-gray-500">Press Start to Scan</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
            {error.includes("camera") && (
              <button
                onClick={retryScan}
                className="ml-auto text-red-800 underline text-xs"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Scan controls */}
        <div className="flex mt-6 gap-3">
          <button
            onClick={toggleScan}
            className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              backgroundColor: isScanning ? "#5E5E5E" : "#dc2626",
            }}
            disabled={hasCameraPermission === false}
          >
            {isScanning ? (
              <>
                <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                Scanning...
              </>
            ) : (
              "Start Scan"
            )}
          </button>

          {data && data !== "No result" && (
            <button
              onClick={copyToClipboard}
              className="copy-btn py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors duration-200 flex items-center"
            >
              📋 Copy
            </button>
          )}
        </div>

        {/* Scan result */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-center text-sm font-medium text-gray-600 mb-1">
            Scanned Result:
          </p>
          <div className="break-words p-3 bg-white rounded border border-gray-200 text-center font-semibold text-red-700">
            {data}
          </div>

          {data && data !== "No result" && (
            <button
              onClick={() => {
                localStorage.setItem("table_id", data);
                dispatch(setTableId(data));
                navigate("/products");
              }}
              className="block mt-3 w-full text-center py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            >
              Proceed to Menu
            </button>
          )}
        </div>

        {/* Scan history */}
        {scanHistory.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Recent Scans</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-2">
              {scanHistory.map((item, index) => (
                <li
                  key={index}
                  className="p-2 bg-gray-50 rounded text-sm break-words cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                  onClick={() => {
                    setData(item);
                    localStorage.setItem("table_id", item);
                    dispatch(setTableId(item));
                    navigate("/products");
                  }}
                >
                  <span>{item.length > 40 ? `${item.substring(0, 40)}...` : item}</span>
                  <span className="text-xs text-blue-500">Use</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;