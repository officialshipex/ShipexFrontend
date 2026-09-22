import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../Notification";

const AdminAgreement = () => {
  const [agreements, setAgreements] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchAgreements = async () => {
    try {
      const token = Cookies.get("session");
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/admin/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAgreements(res.data.agreements);
      }
    } catch (error) {
      console.error("Fetch agreements error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!versionName.trim()) {
      Notification("Please enter version name", "error");
      return;
    }
    if (!selectedFile) {
      Notification("Please select a file", "error");
      return;
    }

    setUploading(true);
    try {
      const token = Cookies.get("session");
      const formData = new FormData();
      formData.append("agreementFile", selectedFile);
      formData.append("versionName", versionName);

      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/agreement/admin/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        Notification("Agreement uploaded successfully", "success");
        setShowUploadModal(false);
        setVersionName("");
        setSelectedFile(null);
        fetchAgreements();
      }
    } catch (error) {
      console.error("Upload error:", error);
      Notification("Failed to upload agreement", "error");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="md:p-2">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[12px] md:text-[14px] font-[600] text-gray-700">Agreements</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-brand-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-[600] hover:bg-opacity-90 transition-all shadow-sm"
        >
          + Upload Agreement
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-auto">
        <table className="min-w-full bg-white">
          <thead className="sticky top-0 z-20">
            <tr className="text-[12px]">
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">S.No</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">Version Name</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">File Name</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">Created At</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-center">Download</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-20 font-bold">Loading...</td>
              </tr>
            ) : agreements.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center font-bold py-20">No agreements uploaded yet</td>
              </tr>
            ) : (
              agreements.map((ag, index) => (
                <tr key={ag._id} className="hover:bg-gray-50/80 transition-all duration-200">
                  <td className="border-b border-gray-300 px-3 py-2 text-left">{index + 1}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-left font-bold">{ag.versionName}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-left text-gray-500">{ag.fileName}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-left text-gray-500">{formatDate(ag.createdAt)}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-center">
                    <a
                      href={ag.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary text-[10px] font-bold hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 pb-2">
        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500">Loading...</div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-10 rounded-lg border">
            <p className="text-gray-500 font-bold">No agreements uploaded yet</p>
          </div>
        ) : (
          agreements.map((ag, index) => (
            <div key={ag._id} className="bg-white border rounded-lg shadow-sm overflow-visible animate-popup-in">
              <div className="bg-brand-primary px-3 py-1.5 flex justify-between items-center rounded-t-lg">
                <span className="text-white font-bold text-[10px]">#{index + 1} - {ag.versionName}</span>
                <a
                  href={ag.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-primary"
                >
                  Download
                </a>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">File Name</span>
                  <span className="text-[10px] font-medium text-gray-700 text-right max-w-[60%] truncate">{ag.fileName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">Created At</span>
                  <span className="text-[10px] text-gray-500">{formatDate(ag.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[999] flex items-center justify-center p-4"
          onClick={() => {
            if (!uploading) {
              setShowUploadModal(false);
              setVersionName("");
              setSelectedFile(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-popup-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[12px] md:text-[14px] font-[600] text-gray-700">Upload Agreement</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setVersionName("");
                  setSelectedFile(null);
                }}
                disabled={uploading}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-[12px] transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-[600] text-gray-700 mb-1">Version Name</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g. v1.0, June 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[12px] font-[600] text-gray-700 mb-1">Upload Word File</label>
                <input
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand-primary file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-white file:text-[10px] file:font-[600]"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-brand-primary text-white py-2 rounded-lg font-[600] text-[12px] hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgreement;
