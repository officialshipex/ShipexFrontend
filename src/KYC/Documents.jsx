import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
function Documents(props) {
    // const BACKEND_URL = import.meta.env.NODE_ENV !== "production"
    // ? import.meta.env.VITE_BACKEND_URL
    // : import.meta.env.VITE_PRODUCTION_BACKEND_URL;

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const { setActiveTab, session, companyCategory, setCompanyCategory, panNumber, setPanNumber, panHolderName, setPanHolderName, gstNumber, setGstNumber, gstCompanyName, setGstCompanyName, aadhaarNumber, setAadhaarNumber, aadhaarOtp, setAadhaarOtp, refId, setRefId, isAadhaarOtpSent, setIsAadhaarOtpSent, verificationState, setVerificationState, loadingState, setLoadingState } = props;

    const verifyPAN = async () => {
        if (!panNumber || !panHolderName) {
            // alert("Please enter PAN number and holder name!");
            return;
        }
        // console.log(session)
        const [sessions,token]=session.split("=")
        console.log(token)
        try {
            setLoadingState(prev => ({ ...prev, panVerifying: true }));
            const response = await axios.post(`${BACKEND_URL}/merchant/verfication/pan`, {
                pan: panNumber,
                name: panHolderName
            }, {
                headers: {
                    authorization: `Bearer ${token}`
                }
            })

            console.log(response)

            if (response?.data?.success) {
                setVerificationState(prev => ({ ...prev, isPanVerified: true }));
                //   alert("PAN verified successfully!");
            } else {
                alert(response?.data?.message || "PAN verification failed!");
            }
        } catch (error) {
            console.log("Error verifying PAN", error);
            // alert("PAN verification failed!");
        } finally {
            setLoadingState(prev => ({ ...prev, panVerifying: false }));
        }
    };

    const verifyGST = async () => {
        if (!gstNumber) {
            // alert("Please enter GST number!");
            return;
        }
        const [sessions,token]=session.split("=")
        try {
            setLoadingState(prev => ({ ...prev, gstVerifying: true }));

            const response = await axios.post(`${BACKEND_URL}/merchant/verfication/gstin`, {
                GSTIN: gstNumber,
                businessName: "ShipEx",
            }, {
                headers: {
                    authorization: `Bearer ${token}`
                }
            })

            if (response?.data?.success) {
                setVerificationState(prev => ({ ...prev, isGstVerified: true }));
                setGstCompanyName(prev => ({ ...prev, gstCompanyName: 'Sample Company Name' }));
                // alert("GST verified successfully!");
            } else {
                // alert(response?.data?.message || "GST verification failed!");
            }

        } catch (error) {
            console.log("Error verifying GST", error);
            // alert("GST verification failed!");
        } finally {
            setLoadingState(prev => ({ ...prev, gstVerifying: false }));
        }
    };

    const sendAadhaarOtp = async () => {
        try {
            setLoadingState(prev => ({ ...prev, aadhaarOtpSending: true }));
            const [sessions,token]=session.split("=")
            const response = await axios.post(`${BACKEND_URL}/merchant/verfication/generate-otp`, {
                aadhaarNo: aadhaarNumber,
            }, {
                headers: {
                    authorization: `Bearer ${token}`
                }
            })
            console.log(response.data)

            if (response.data.data.ref_id) {
                setRefId(response.data.data.ref_id)
                setVerificationState(prev => ({ ...prev, isAadhaarOtpSent: true }));
                setIsAadhaarOtpSent(true);
                console.log("aadhaar otp sent successfully")
                // alert("Aadhaar OTP sent successfully!");
            } else {
                console.log("failed to send otp")
                // alert("Failed to send OTP!");
            }

        } catch (error) {
            console.log("Error sending Aadhaar OTP", error);
            // alert(error?.response?.data?.message);
            
        } finally {
            setLoadingState(prev => ({ ...prev, aadhaarOtpSending: false }));
        }
    };

    const verifyAadhaarOtp = async () => {
        try {
            setLoadingState(prev => ({ ...prev, aadhaarVerifying: true }));
            const [sessions,token]=session.split("=")

            const response = await axios.post(`${BACKEND_URL}/merchant/verfication/verify-otp`, {
                otp: aadhaarOtp,
                refId: refId,
                aadhaarNo: aadhaarNumber,
            }, {
                headers: {
                    authorization: `Bearer ${token}`
                }
            })

            if (response?.data?.success) {
                setVerificationState(prev => ({ ...prev, isAadhaarVerified: true }));
                // alert("Aadhaar OTP verified successfully!");
            }

        } catch (error) {
            console.log("Error verifying Aadhaar OTP", error);
            // alert("OTP verification failed!");
        } finally {
            setIsAadhaarOtpSent(false);
            setLoadingState(prev => ({ ...prev, aadhaarVerifying: false }));
        }
    };

    const handleNext = () => {
        if (!verificationState.isPanVerified || !verificationState.isGstVerified || !verificationState.isAadhaarVerified) {
            // alert("Please verify all documents first!");
            return;
        }
        setActiveTab(4);
    }

    return (
        <>
            <div>
                {/* Documents Form */}
                <form className="space-y-7 px-6 sm:px-0">
                    {/* Select Company Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Select your company category
                        </label>
                        <select
                            className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] bg-white"
                            value={companyCategory}
                            onChange={(e) => setCompanyCategory(e.target.value)}
                        >
                            <option>Public Limited Company</option>
                            <option>Sole Proprietorship</option>
                            <option>Partnership</option>
                        </select>
                    </div>

                    {/* PAN Section */}
                    <div className="flex flex-wrap space-y-4 sm:space-x-4 sm:space-y-0">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700">
                                PAN Number
                            </label>
                            <input
                                value={panNumber}
                                type="text"
                                placeholder="PAN number"
                                className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg bg-gray-200"
                                onChange={(e) => setPanNumber(e.target.value)}
                                disabled={loadingState.panVerifying || verificationState.isPanVerified}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700">
                                PAN Holder Name
                            </label>
                            <input
                                placeholder="PAN holder name"
                                value={panHolderName}
                                type="text"
                                onChange={(e) => setPanHolderName(e.target.value)}
                                className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg bg-gray-200"
                                disabled={loadingState.panVerifying || verificationState.isPanVerified}
                            />
                        </div>
                        <div className="flex items-center min-w-[120px]">
                            <button
                                type="button"
                                className={`w-full h-9 sm:w-40 md:mt-5 px-2 py-1 text-sm text-white bg-[#0CBB7D] hover:bg-[#0CBB7D] rounded-lg`}
                                onClick={verifyPAN}
                                disabled={loadingState.panVerifying || verificationState.isPanVerified}
                            >
                                {loadingState.panVerifying ? 'Verifying...' : verificationState.isPanVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                        </div>
                    </div>

                    {/* GST Section */}
                    <div className="flex flex-wrap space-y-4 sm:space-x-4 sm:space-y-0">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700">
                                GST Number
                            </label>
                            <input
                                type="text"
                                placeholder="GST number"
                                value={gstNumber}
                                className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg bg-gray-200"
                                onChange={(e) => setGstNumber(e.target.value)}
                                disabled={loadingState.gstVerifying || verificationState.isGstVerified}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700">
                                Company Name
                            </label>
                            <input
                                placeholder="Company name"
                                type="text"
                                value={gstCompanyName}
                                disabled
                                className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg bg-gray-200"
                            />
                        </div>
                        <div className="flex items-center min-w-[120px]">
                            <button
                                type="button"
                                className="w-full h-9 sm:w-40 md:mt-5 px-2 py-1 text-sm text-white bg-[#0CBB7D] hover:bg-[#0CBB7D] rounded-lg"
                                onClick={verifyGST}
                                disabled={loadingState.gstVerifying || verificationState.isGstVerified}
                            >
                                {loadingState.gstVerifying ? 'Verifying...' : verificationState.isGstVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                        </div>
                    </div>

                    {/* Aadhaar Section */}
                    <div className="flex flex-wrap space-y-4 sm:space-x-4 sm:space-y-0">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700">
                                Aadhaar Card Number
                            </label>
                            <input
                                type="text"
                                id="aadhaarNumber"
                                className="mt-1 md:w-1/2 block w-full text-sm p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] bg-gray-200"
                                onChange={(e) => setAadhaarNumber(e.target.value)}
                                value={aadhaarNumber}
                                disabled={loadingState.aadhaarOtpSending || verificationState.isAadhaarVerified}
                            />
                        </div>
                        {isAadhaarOtpSent && (
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={aadhaarOtp}
                                    onChange={(e) => setAadhaarOtp(e.target.value)}
                                    className="mt-1 block w-full text-sm p-1 border border-gray-300 rounded-lg bg-white"
                                    placeholder="Enter OTP"
                                    disabled={loadingState.aadhaarVerifying || verificationState.isAadhaarVerified}
                                />
                            </div>
                        )}
                        <div className="flex items-center min-w-[120px]">
                            <button
                                type="button"
                                className="w-full h-9 sm:w-40 md:mt-5 px-2 py-1 text-sm text-white bg-[#0CBB7D] hover:bg-[#0CBB7D] rounded-lg"
                                onClick={verificationState.isAadhaarOtpSent ? verifyAadhaarOtp : sendAadhaarOtp}
                                disabled={
                                    (verificationState.isAadhaarOtpSent && loadingState.aadhaarVerifying) ||
                                    (!verificationState.isAadhaarOtpSent && loadingState.aadhaarOtpSending) ||
                                    verificationState.isAadhaarVerified
                                }
                            >
                                {verificationState.isAadhaarVerified
                                    ? 'Verified ✓'
                                    : verificationState.isAadhaarOtpSent
                                        ? loadingState.aadhaarVerifying
                                            ? 'Verifying...'
                                            : 'Verify OTP'
                                        : loadingState.aadhaarOtpSending
                                            ? 'Sending...'
                                            : 'Send OTP'}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 w-full sm:w-auto"
                            onClick={() => setActiveTab(2)}
                        >
                            <span>←</span>
                            <span>Back to General</span>
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2 text-white bg-[#0CBB7D] hover:bg-[#0CBB7D] rounded-lg shadow-sm transition focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] w-full sm:w-auto"
                            onClick={handleNext}
                        >
                            Save & Next →
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Documents.propTypes = {
    session: PropTypes.string.isRequired,
    companyCategory: PropTypes.string.isRequired,
    setCompanyCategory: PropTypes.func.isRequired,
    panNumber: PropTypes.string.isRequired,
    setPanNumber: PropTypes.func.isRequired,
    panHolderName: PropTypes.string.isRequired,
    setPanHolderName: PropTypes.func.isRequired,
    gstNumber: PropTypes.string.isRequired,
    setGstNumber: PropTypes.func.isRequired,
    gstCompanyName: PropTypes.string.isRequired,
    setGstCompanyName: PropTypes.func.isRequired,
    aadhaarNumber: PropTypes.string.isRequired,
    setAadhaarNumber: PropTypes.func.isRequired,
    aadhaarOtp: PropTypes.string.isRequired,
    setAadhaarOtp: PropTypes.func.isRequired,
    refId: PropTypes.string.isRequired,
    setRefId: PropTypes.func.isRequired,
    isAadhaarOtpSent: PropTypes.bool.isRequired,
    setIsAadhaarOtpSent: PropTypes.func.isRequired,
    verificationState: PropTypes.object.isRequired,
    setVerificationState: PropTypes.func.isRequired,
    loadingState: PropTypes.object.isRequired,
    setLoadingState: PropTypes.func.isRequired,
    setActiveTab: PropTypes.func.isRequired,
}
export default Documents;