import { useState, useEffect, useRef } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Building2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { ArrowRight } from "lucide-react";
import kycimage1 from "../assets/Illustration.png"
import Cookies from "js-cookie";
import { CheckCircleIcon, ClockIcon } from "lucide-react";
import ThreeDotLoader from "../Loader"
import VerifyPhoneEmail from "./VerifyPhoneEmail";



// import { toast } from "react-toastify";
import { Notification } from "../Notification"
import Aggrement from "./Aggreement";
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const steps = [
  "Billing Information",
  "Document Verification"
];
const BusinessTypeSelection = () => {
  const [selectedType, setSelectedType] = useState("individual");
  const [currentStep, setCurrentStep] = useState(0);
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [isAadharVerified, setIsAadharVerified] = useState(false);
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [isBillingVerified, setIsBillingVerified] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [aadhaar, setAadhaar] = useState({});
  const [pan, setPan] = useState({});
  const [bank, setBank] = useState({});
  const [gst, setGst] = useState({});
  const [aadhaarNo, setAadhaarNo] = useState("")
  const [showAgreement, setShowAgreement] = useState(false);
  const [isOtpPopupOpen, setIsOtpPopupOpen] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [companyAddress, setCompanyAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  // const [isOtpPopupOpen, setIsOtpPopupOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef([]);



  const [billingInfo, setBillingInfo] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [bankDetails, setBankDetails] = useState({
    refId: "",
    branchName: "",
    city: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });
  const [documentDetails, setDocumentDetails] = useState({
    aadharNo: "",
    otp: "",
    name: "",
    guardianName: "",
    address: "",
    state: "",
    pan: "",
    panName: "",
    panType: "",
  });

  const [otp, setOtp] = useState(""); // State for OTP input
  const [isOtpSent, setIsOtpSent] = useState(false); // To track if OTP was sent
  const [isOtpVerified, setIsOtpVerified] = useState(false); // To track OTP verification status
  const [errors, setErrors] = useState({});
  const [session, setSession] = useState("");
  const [otpTimer, setOtpTimer] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);

  const [next, setNext] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [checked, setChecked] = useState(false)
  const payload = {
    selectedType,
    billingInfo,
    bankDetails,
    documentDetails,
    gstNumber,
    isVerified,
  };
  useEffect(() => {
    const token = document.cookie;
    // console.log(token)
    //   const token=getTokens()
    if (token) {
      setSession(token);
    }
    if (isAadharVerified && isPanVerified && isBankVerified) {
      setIsVerified(true)
    }
  });

  const handleChecked = (e) => {
    setChecked(e.target.checked);
  }
  useEffect(() => {
    const fetchUserData = async () => {
      const token = Cookies.get("session");
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/user/getUserDetails`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setChecked(res.data.user.isVerified)
    }
    fetchUserData();
  }, [])

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only numbers allowed
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1);
    setOtpDigits(newOtpDigits);

    // ✅ Move to next input when digit entered
    if (value && index < otpDigits.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  const allKycVerified =
    isBillingVerified &&
    (selectedType === "company" ? isGstinVerified : true) &&
    isAadharVerified &&
    isPanVerified &&
    isBankVerified;

  useEffect(() => {
    // Only auto-set step on initial load
    if (allKycVerified) {
      setCurrentStep(1); // Document Verification step
    } else {
      setCurrentStep(0); // Billing / GST step
    }
  }, [
    isBillingVerified,
    isGstinVerified,
    isAadharVerified,
    isPanVerified,
    isBankVerified,
    selectedType
  ]);

  const canSubmitKyc =
    isPhoneVerified &&
    isEmailVerified &&
    allKycVerified &&
    checked;


  const handlePincodeChange = (e) => {
    const newPincode = e.target.value;

    // ✅ Allow only numbers and max 6 digits
    if (!/^\d{0,6}$/.test(newPincode)) return;

    // Always use functional update to prevent stale state issues
    setBillingInfo(prev => ({
      ...prev,
      postalCode: newPincode
    }));

    if (newPincode.length === 6) {
      // Fetch city/state
      (async () => {
        try {
          const token = Cookies.get("session");
          const response = await axios.get(
            `${REACT_APP_BACKEND_URL}/order/pincode/${newPincode}`,
            { headers: { authorization: `Bearer ${token}` } }
          );

          if (response.data) {
            setBillingInfo(prev => ({
              ...prev,
              city: response.data.city,
              state: response.data.state
            }));
          } else {
            setBillingInfo(prev => ({
              ...prev,
              city: "",
              state: ""
            }));
            Notification("Pincode not found!", "error");
          }
        } catch (error) {
          console.error("Error fetching city and state:", error);
          setBillingInfo(prev => ({
            ...prev,
            city: "",
            state: ""
          }));
        }
      })();
    } else {
      // Clear city/state if not 6 digits
      setBillingInfo(prev => ({
        ...prev,
        city: "",
        state: ""
      }));
    }
  };





  const handleBiling = async () => {
    if (validateBillingInfo()) {
      setNext(true)

      try {
        // console.log("hiii")
        const token = Cookies.get("session");
        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/merchant/verfication/billing-info`,
          { billingInfo },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Notification("Billing info saved successfully!", "success")
        setIsBillingVerified(true)
        // setCurrentStep(prev => prev + 1);
        console.log("biling", response.data);
      } catch (error) {
        console.log("Error in billing info", error)
      }


      console.log("billing info", billingInfo);
    }
  }


  const handleSendOtp = async () => {
    setIsLoading(true); // Start loading
    setIsOtpPopupOpen(true);
    setOtpError('');
    setOtpDigits(new Array(6).fill(''));
    setOtpTimer(180); // 3 minutes = 180 seconds
    setTimerActive(true);
    try {
      await sendAadhaarOtp(); // Call the actual API function
    } catch (error) {
      console.error("Error sending OTP:", error);
    }

    setIsLoading(false); // Stop loading after API call
  };

  const handleVerify = async (value) => {
    if (value === "pan") {
      setIsVerifying(true);
      try {
        await verifyPAN(); // Call the actual API function
      } catch (error) {
        console.error("Error verifying PAN:", error);
      }

      setIsVerifying(false); // Stop loading after API call
    }
    else if (value === "aadhar") {
      console.log("aadhar")
      setIsVerifying(true);
      try {
        await verifyAadhaarOtp(); // Call the actual API function
      } catch (error) {
        console.error("Error verifying Aadhar:", error);
      }

      setIsVerifying(false); // Stop loading after API call
    }
    else if (value === "bank") {
      setIsVerifying(true);
      try {
        await verifyBank(); // Call the actual API function
      } catch (error) {
        console.error("Error verifying Bank:", error);
      }

      setIsVerifying(false); // Stop loading after API call
    }
    else if (value === "gst") {
      setIsVerifying(true);
      try {
        await verifyGstin(); // Call the actual API function
      } catch (error) {
        console.error("Error verifying GSTIN:", error);
      }

      setIsVerifying(false);
    }

  }



  useEffect(() => {
    // this is for Aadhaar
    const fetchAllData = async () => {
      try {
        const token = Cookies.get("session");
        //billing
        const response_billing = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getBillingInfo`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        // console.log(response_billing.status)
        setBillingInfo({
          ...billingInfo,
          address: response_billing.data.address || "", // Ensure a fallback if undefined
          city: response_billing.data.city || "",
          state: response_billing.data.state || "",
          postalCode: response_billing.data.postalCode || "",
        })
        if (response_billing.data.address) {
          setIsBillingVerified(true)
        }
        //aadhar
        const response_a = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getAadhaar`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // console.log(response_a.data.data)

        setDocumentDetails((prevDetails) => ({
          ...prevDetails,
          aadharNo: response_a.data.data.aadhaarNumber || "",
          guardianName: response_a.data.data.sonOf || "",
          name: response_a.data.data.name || "",
          address: response_a.data.data.address || "",
          state: response_a.data.data.state || "",
          city: response_a.data.data.city || "",
        }));
        setIsOtpVerified(true);
        setAadhaar(response_a.data.data);
        // setAadhaarNo(response_a.data.aadhaarNumber)
        console.log("document details", documentDetails)
        // console.log(aadhaar)
        if (response_a.data.data.aadhaarNumber) {
          setIsAadharVerified(true)
        }
        //pan
        const response_p = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getPan`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // console.log(response_p.data)
        setDocumentDetails((prevDetails) => ({
          ...prevDetails,
          pan: response_p.data.pan || "",
          panName: response_p.data.nameProvided || "",
          panType: response_p.data.panType || "",
        }));
        setPan(response_p.data);

        if (response_p.data.pan) {
          setIsPanVerified(true)
        }
        //bank account

        const response_b = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getBankAccount`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // console.log(response_b.data)
        setBank(response_b.data);
        setBankDetails({
          ...bankDetails,
          bankName: response_b.data.bank || "", // Ensure a fallback if undefined
          branchName: response_b.data.branch || "",
          city: response_b.data.city || "",
          nameAtBank: response_b.data.nameAtBank || "",
          accountNumber: response_b.data.accountNumber || "", // Fix here
          ifsc: response_b.data.ifsc || "", // Fix here
        });

        if (response_b.data.accountNumber) {
          setIsBankVerified(true)
        }

        //GST
        const response_g = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getGST`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setGst(response_g.data);
        setGstNumber(response_g.data.gstin || "");
        setCompanyAddress(response_g.data.address || "");
        setCity(response_g.data.city || "");
        setState(response_g.data.state || "");
        setPincode(response_g.data.pincode || "");
        if (response_g.data.gstin) {
          setIsGstinVerified(true)
        }
        console.log(response_g.data)
      } catch (error) {
        Notification("it getting some error to fetching data", "error")

      }
    };
    fetchAllData();
  }, []);

  const handleNext = async () => {
    setNext(true);

    if (currentStep === 0 && !isBillingVerified && !isGstinVerified) {
      // Wait for billing verification before allowing next step
      return;
    }

    if (currentStep === 1) {
      // In final verification + agreement step
      if (!isBankVerified || !isAadharVerified || !isPanVerified) {
        // Wait for bank and documents verification
        return;
      }

      if (!checked) {
        Notification("Please check your agreement before proceeding!", "warning");
        return;
      }

      // All validations passed - submit KYC
      try {
        // Prepare payload from your form state
        console.log({ selectedType, billingInfo, bankDetails, documentDetails });
        const token = Cookies.get("session");
        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/merchant/verfication/kyc`,
          { payload },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          Notification("KYC details submitted successfully!", "success");
          navigate("/dashboard");
        } else {
          // Handle failure gently
          Notification(response.data.message || "Failed to submit KYC details!", "error");
        }
      } catch (error) {
        Notification(error.response?.data?.message || "Failed to submit KYC details!", "error");
      }
      return; // No step increment after submission
    }

    // Move to next step if not last
    if (currentStep < 1) { // only 2 steps: 0 or 1
      setCurrentStep(currentStep + 1);
    }
  };

  const validateBillingInfo = () => {
    let newErrors = {};
    {
      Object.keys(newErrors).map((key) => (
        <p key={key} className="text-red-500 text-[12px] font mt-1">
          {newErrors[key]}
        </p>
      ))
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  useEffect(() => {
    let interval;
    if (timerActive && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    } else if (otpTimer === 0 && timerActive) {
      setIsOtpPopupOpen(false);  // This closes the popup
      setTimerActive(false);
      setIsOtpSent(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, otpTimer]);


  useEffect(() => {
    if (otpDigits.every(digit => digit.length === 1)) {
      const enteredOtp = otpDigits.join('');
      verifyAadhaarOtp(enteredOtp);
    }
  }, [otpDigits]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const verifyAadhaarOtp = async (otp) => {
    setIsVerifying(true);
    try {
      const token = Cookies.get("session");
      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/verify-otp`,
        { otp, aadhaarNo: documentDetails.aadharNo, refId: documentDetails.refId },
        { headers: { authorization: `Bearer ${token}` } }
      );
      console.log("aadhar", res.data)
      if (res.data.success) {
        // Update documentDetails state with fetched Aadhaar data
        setDocumentDetails(prev => ({
          ...prev,
          aadhaarNo: res.data.data.aadhaarNo || "",
          name: res.data.data.name || "",
          guardianName: res.data.data.sonOf || "",
          address: res.data.data.address || "",
          city: res.data.data.city || "",
          state: res.data.data.state || "",
          // Add more fields if available
        }));

        setIsAadharVerified(true);
        setIsOtpVerified(true);
        setIsVerifying(false);
        setIsOtpSent(false);
        setOtp(""); // reset otp input
        setIsOtpVerified(true);
        setIsOtpVerified(true);
        setIsOtpVerified(true);

        // Close OTP modal
        setIsOtpPopupOpen(false);

        Notification("Aadhaar OTP verified successfully!", "success");
      } else {
        Notification("OTP verification failed!", "error");
      }
    } catch (error) {
      console.log("error", error)
      Notification(error.response.data.message || "OTP verification failed!", "error");
    } finally {
      setIsVerifying(false);
    }
  };


  const sendAadhaarOtp = async () => {
    setIsVerifying(true);
    try {
      // setLoadingState(prev => ({ ...prev, aadhaarOtpSending: true }));
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/generate-otp`,
        {
          aadhaarNo: documentDetails.aadharNo,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);

      if (response.data.data.ref_id) {
        setIsOtpSent(true);
        setDocumentDetails({
          ...documentDetails,
          refId: response.data.data.ref_id,
        });
        // setVerificationState(prev => ({ ...prev, isAadhaarOtpSent: true }));
        // setIsAadhaarOtpSent(true);
        // console.log("aadhaar otp sent successfully");
        Notification(response.data.message, "success")
      } else {
        console.log(response.data.message);
        setIsOtpPopupOpen(false);
        Notification(response.data.message, "error")
      }
    } catch (error) {
      setIsOtpPopupOpen(false);
      console.log("Error sending Aadhaar OTP", error);
      Notification(error?.response?.data?.message, "error")

    } finally {
      setIsVerifying(false);
    }
  };

  const verifyGstin = async () => {
    if (!gstNumber) {
      Notification("Please enter GST number!", "info")

      return;
    }

    const token = Cookies.get("session");
    try {
      // setLoadingState(prev => ({ ...prev, gstVerifying: true }));

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/gstin`,
        {
          GSTIN: gstNumber,
          // businessName: "ShipEx",
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success) {
        console.log(response.data);
        setIsGstinVerified(true);
        setCompanyAddress(response.data.data.address);
        setCity(response.data.data.city);
        setState(response.data.data.state);
        setPincode(response.data.data.pincode);
        // setCurrentStep(prev => prev + 1); // <--- Add this line
        Notification("GST Verified Successfully", "success")
      } else {

        Notification(response?.data?.message || "GST verification failed!", "error")
      }
    } catch (error) {
      console.log("Error verifying GST", error);
      Notification(error.response.data.message, "error")

    } finally {
      // setLoadingState(prev => ({ ...prev, gstVerifying: false }));
    }
  };

  const verifyBank = async () => {
    // e.preventDefault();

    const token = Cookies.get("session");
    if (!bankDetails.accountNumber || !bankDetails.ifsc) {
      Notification("Please enter account number and IFSC code!", "info")
      return
    }

    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/bank-account`,
        {
          accountNo: bankDetails.accountNumber,
          ifsc: bankDetails.ifsc,
          // name: bankDetails.beneficiaryName,
          // phone: bankDetails.mobileNo,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log("Account verification response", response.data);

      if (response.data.success) {
        console.log(response.data.data);
        setBankDetails({
          ...bankDetails,
          bankName: response.data.data.bank,
          branchName: response.data.data.branch,
          city: response.data.data.city,
          nameAtBank: response.data.data.nameAtBank
        });

        setIsBankVerified(true);
        // setCurrentStep(prev => prev + 1); // <--- Add this line
        Notification("bank account is verified", "success")

        // setMessage({ account: response.data.message });
      } else {
        // setMessage({ account: response.data.message });
      }
    } catch (error) {
      Notification("Error verifying account", "error")
      console.log("Error verifying account", error);
    }
    // setIsVerifying(false);
  };

  const verifyPAN = async () => {
    if (!documentDetails.pan) {
      Notification("Please enter PAN number and holder name!", "info")

      return;
    }
    // console.log(session)
    const token = Cookies.get("session");
    // console.log(token)
    try {
      // setLoadingState(prev => ({ ...prev, panVerifying: true }));
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/pan`,
        {
          pan: documentDetails.pan,
          // name: panHolderName
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success) {
        console.log(response.data);

        setDocumentDetails({
          ...documentDetails,
          panName: response.data.data.nameProvided,
          panType: response.data.data.panType,
        });
        setIsPanVerified(true);
        // setCurrentStep(prev => prev + 1); // <--- Add this line
        // setIsVerified(true);
        // setVerificationState(prev => ({ ...prev, isPanVerified: true }));
        Notification("PAN verified successfully!", "success")

      } else {
        // alert(response?.data?.message || "PAN verification failed!");
      }
    } catch (error) {
      console.log("Error verifying PAN", error);
      Notification("PAN verification failed!", "error")

    } finally {
      // setLoadingState(prev => ({ ...prev, panVerifying: false }));
    }
  };




  return (
    <div>
      {/* Step Progress Bar */}
      <div className="flex flex-col sm:flex-row justify-start sm:justify-center items-start sm:items-center font-semibold gap-6 sm:gap-24 h-auto p-4 sm:p-8 w-full max-w-lg mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex sm:flex-col items-center sm:items-center w-full relative"
          >
            {/* Circle + line wrapper */}
            <div className="relative flex items-center sm:flex-col w-full sm:w-auto">
              {/* Circle indicator */}
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-semibold transition-colors duration-500 ease-in-out z-10
            ${index === currentStep
                    ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                    : index < currentStep
                      ? "bg-[#0CBB7D] border-[#0CBB7D] text-white"
                      : "bg-white border-gray-300 text-gray-400"}
          `}
              >
                {index < currentStep ? <FaCheck /> : index + 1}
              </div>

              {/* Line for desktop (circle to circle only) */}
              {index !== steps.length - 1 && (
                <div className="hidden sm:block absolute left-[150px] top-1/2 transform -translate-y-1/2 w-24 h-0.5 bg-[#0CBB7D]"></div>
              )}

              {/* Line for mobile (circle to circle only) */}
              {index !== steps.length - 1 && (
                <div className="sm:hidden absolute top-full left-4 transform -translate-x-1/2 w-0.5 h-6 bg-[#0CBB7D]"></div>
              )}

              {/* Label for mobile (to the right of circle) */}
              <span
                className={`ml-3 sm:ml-0 sm:mt-3 text-[12px] sm:text-[14px] font-semibold transition-colors duration-500 ease-in-out text-left sm:text-center
            ${index === currentStep ? "text-[#0CBB7D]" : "text-gray-500"}
          `}
              >
                {step}
              </span>
            </div>
          </div>
        ))}
      </div>





      <div
        className={`w-full flex flex-col justify-center text-[14px] font-bold items-center ${currentStep === 1 ? "p-2 sm:p-2" : "p-2 sm:p-2 lg:p-2"
          } gap-6`}
      >
        <div className="w-full max-w-full rounded-lg">


          {currentStep === 0 && (
            <div className="w-full">
              {/* Business Type Selection - Always render */}
              <>
                <VerifyPhoneEmail
                  onVerificationChange={({ phone, email }) => {
                    setIsPhoneVerified(phone);
                    setIsEmailVerified(email);
                  }}
                />
                <h2 className="sm:text-[14px] text-[12px] font-[600] mb-4 text-gray-700 text-center sm:text-left">
                  Please Confirm Your Business Type
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center sm:justify-start items-start">
                  {[
                    { label: "Individual", value: "individual", icon: <User size={18} /> },
                    { label: "Company", value: "company", icon: <Building2 size={18} /> },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 border-2 rounded-lg px-4 py-2 w-full sm:w-60 cursor-pointer transition duration-150 ${selectedType === option.value
                        ? "border-[#0CBB7D] bg-green-50"
                        : "border-gray-300 hover:border-[#0CBB7D]"
                        }`}
                      onClick={() => setSelectedType(option.value)}
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={option.value}
                        checked={selectedType === option.value}
                        onChange={() => setSelectedType(option.value)}
                        className="accent-[#0CBB7D] cursor-pointer outline-none ring-0 appearance-none w-3 h-3 border-2 border-gray-300 checked:border-[#0CBB7D] checked:bg-[#0CBB7D] rounded-full"
                      />

                      <div className="flex items-center gap-2 text-gray-700 font-[600] sm:text-[14px] text-[12px]">
                        <span className="text-[#0CBB7D]">{option.icon}</span>
                        {option.label}
                      </div>
                    </label>
                  ))}
                </div>



              </>

              {/* Billing Info - Individual */}
              {(selectedType === "individual" && !isGstinVerified) && (
                <div className="lg:w-full max-w-full bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h2 className="sm:text-[14px] text-[12px] text-[#0CBB7D] font-[600] sm:mb-2">Billing Information</h2>
                  <div className="grid grid-cols-2 md:grid-cols-6 sm:gap-2 gap-2 sm:px-4 md:px-0 items-end">
                    {/* Address */}
                    <div className="flex flex-col col-span-2 gap-1">
                      <label className="font-[500] sm:text-[14px] text-[12px] text-gray-500 mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={billingInfo.address}
                        onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                        readOnly={isBillingVerified}
                        disabled={isBillingVerified}
                        className={`w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0CBB7D] text-gray-500 ${isBillingVerified ? "cursor-not-allowed" : ""
                          }`}
                      />
                      {errors.address && <span className="text-red-500 text-[12px] mt-1">{errors.address}</span>}
                    </div>

                    {/* Postal Code */}
                    <div className="flex flex-col">
                      <label className="font-[500] sm:text-[14px] text-[12px] text-gray-500 mb-1">Pin Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={billingInfo.postalCode}
                        maxLength={6}   // 👈 restricts to 6 characters
                        onChange={(e) => handlePincodeChange(e)}
                        readOnly={isBillingVerified}
                        disabled={isBillingVerified}
                        className={`w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg outline-none 
    focus:ring-1 focus:ring-[#0CBB7D] text-gray-500 
    ${isBillingVerified ? "cursor-not-allowed" : ""}`}
                      />

                      {errors.postalCode && <span className="text-red-500 text-[12px] mt-1">{errors.postalCode}</span>}
                    </div>

                    {/* City */}
                    <div className="flex flex-col">
                      <label className="font-[500] sm:text-[14px] text-[12px] text-gray-500 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={billingInfo.city}
                        onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                        readOnly={isBillingVerified}
                        disabled={isBillingVerified}
                        className={`w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0CBB7D] text-gray-500 ${isBillingVerified ? "cursor-not-allowed" : ""
                          }`}
                      />
                      {errors.city && <span className="text-red-500 text-[12px] mt-1">{errors.city}</span>}
                    </div>

                    {/* State */}
                    <div className="flex flex-col">
                      <label className="font-[500] sm:text-[14px] text-[12px] text-gray-500 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={billingInfo.state}
                        onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                        readOnly={isBillingVerified}
                        disabled={isBillingVerified}
                        className={`w-full px-3 py-2 text-[12px] border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0CBB7D] text-gray-500 ${isBillingVerified ? "cursor-not-allowed" : ""
                          }`}
                      />
                      {errors.state && <span className="text-red-500 text-[12px] mt-1">{errors.state}</span>}
                    </div>



                    {/* Submit button in last column */}
                    <div className="flex justify-start">
                      {isBillingVerified ? (
                        <div className="flex items-center gap-2 mb-1.5 text-[#0CBB7D]">
                          <CheckCircleIcon />
                          <span className="font-[600] text-[12px]">Submitted</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleBiling}
                          disabled={isBillingVerified}
                          className="text-white mb-0.5 sm:text-[12px] text-[10px] py-2 px-3 rounded-lg bg-[#0CBB7D] hover:bg-[#0aa66c] transition-all duration-200"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}


              {/* Billing Info - Company */}
              {(selectedType === "company" && !isBillingVerified) && (
                <div className="w-full">
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full">
                      <div className="bg-white sm:p-6 p-3 rounded-lg max-w-full shadow-md relative">
                        {/* {(isLoading || isVerifying) && (
                          <div className="absolute inset-0 bg-opacity-50 flex justify-center items-center z-10 rounded-lg">
                            <ThreeDotLoader/>
                          </div>
                        )} */}

                        <h3 className="sm:text-[14px] text-[12px] text-[#0CBB7D] font-[600] sm:mb-3 mb-2">
                          GSTIN Verification
                        </h3>

                        {/* ✅ All Fields in Responsive Grid */}
                        {/* ✅ All Fields in Responsive Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
                          {/* GST Number */}
                          <div className="flex flex-col gap-1 w-full md:col-span-2">
                            <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500">
                              GST Number
                            </label>
                            <input
                              type="text"
                              placeholder="GSTIN"
                              className="w-full px-3 py-2 text-gray-600 text-[12px] font-[600] border border-gray-300 rounded-lg outline-none 
      focus:ring-2 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(e.target.value)}
                              readOnly={isGstinVerified}
                              disabled={isGstinVerified}
                            />
                          </div>

                          {/* Verify Button */}
                          <div className="flex flex-col justify-end w-auto">
                            {isGstinVerified ? (
                              <div className="flex items-center gap-1 mb-2 text-[#0CBB7D] font-semibold text-[12px]">
                                <CheckCircleIcon className="w-6 h-6" />
                                Verified
                              </div>
                            ) : (
                              <button
                                onClick={() => handleVerify("gst")}
                                disabled={isGstinVerified}
                                className="bg-[#0CBB7D] text-white text-[12px] px-3 py-2 rounded-lg 
      hover:bg-[#0aa66c] transition focus:outline-none w-auto"
                              >
                                Verify
                              </button>
                            )}
                          </div>


                          {/* Company Address */}
                          <div className="flex flex-col gap-1 w-full md:col-span-4">
                            <label className="sm:text-[14px] text-[12px] text-gray-500">
                              Company Address
                            </label>
                            <input
                              type="text"
                              placeholder="Company address"
                              className="w-full px-3 py-2 text-gray-600 text-[12px] border border-gray-300 rounded-lg outline-none 
      focus:ring-2 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                              value={companyAddress}
                              readOnly
                              disabled
                            />
                          </div>

                          {/* City */}
                          <div className="flex flex-col gap-1 w-full md:col-span-2">
                            <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500">
                              City
                            </label>
                            <input
                              type="text"
                              placeholder="City"
                              className="w-full px-3 py-2 text-gray-600 text-[12px] border border-gray-300 rounded-lg outline-none 
      focus:ring-2 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                              value={city}
                              readOnly
                              disabled
                            />
                          </div>

                          {/* State */}
                          <div className="flex flex-col gap-1 w-full md:col-span-2">
                            <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500">
                              State
                            </label>
                            <input
                              type="text"
                              placeholder="State"
                              className="w-full px-3 py-2 text-gray-600 text-[12px] border border-gray-300 rounded-lg outline-none 
      focus:ring-2 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                              value={state}
                              readOnly
                              disabled
                            />
                          </div>

                          {/* Pincode */}
                          <div className="flex flex-col gap-1 w-full md:col-span-1">
                            <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500">
                              Pincode
                            </label>
                            <input
                              type="text"
                              placeholder="Pincode"
                              className="w-full px-3 py-2 text-gray-600 text-[12px] border border-gray-300 rounded-lg outline-none 
      focus:ring-2 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                              value={pincode}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}




          {currentStep === 1 && (
            <div className="w-full max-w-full rounded-lg">
              {/* Aadhaar Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4 w-full">
                <div className="p-6 rounded-lg shadow-md bg-white w-full">
                  <h3 className="font-[600] text-[#0CBB7D] text-[14px] mb-2">Aadhaar Verification</h3>

                  {/* 🔹 Row 1: Aadhaar + Send OTP */}
                  <div className="grid sm:grid-cols-5 grid-cols-2 gap-2 w-full items-end">
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Aadhaar Number</label>
                      <input
                        type="text"
                        placeholder="Aadhaar Number"
                        className="w-full px-3 py-2 text-gray-500 text-[12px] font-[600] border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        value={documentDetails.aadharNo}
                        onChange={(e) =>
                          setDocumentDetails({ ...documentDetails, aadharNo: e.target.value })
                        }
                        disabled={isLoading || isAadharVerified}
                      />
                    </div>

                    <div className="flex items-end">
                      {!isAadharVerified ? (
                        <button
                          onClick={() => {
                            handleSendOtp();
                            setIsOtpPopupOpen(true);
                            setOtpError("");
                            setOtpDigits(new Array(6).fill(""));
                          }}
                          className="bg-[#0CBB7D] text-white px-3 py-2 text-[12px] rounded-lg w-auto"
                          disabled={isAadharVerified || isLoading || timerActive}
                        >
                          {isOtpSent ? "OTP Sent" : "Send OTP"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 mb-1.5 text-[#0CBB7D] font-semibold text-[12px]">
                          <p className="w-6 h-6 flex items-center justify-center">
                            <CheckCircleIcon />
                          </p>
                          <p>Verified</p>
                        </div>

                      )}
                    </div>
                  </div>


                  {/* 🔹 Aadhaar result info (Row 2 onwards) */}
                  <div className="grid sm:grid-cols-6 gap-2 mt-2 w-full">
                    {/* Name + Guardian Name (2 cols) */}
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Name</label>
                        <input
                          type="text"
                          value={documentDetails.name}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Guardian Name</label>
                        <input
                          type="text"
                          value={documentDetails.guardianName}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    {/* Address (takes 2 cols) */}
                    <div className="col-span-2 flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Address</label>
                      <input
                        type="text"
                        value={documentDetails.address}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                      />
                    </div>

                    {/* State + City (1 col span but inside split) */}
                    <div className="grid grid-cols-2 col-span-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">State</label>
                        <input
                          type="text"
                          value={documentDetails.state}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">City</label>
                        <input
                          type="text"
                          value={documentDetails.city}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>


                {/* OTP Modal Popup */}
                {isOtpPopupOpen && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-black"
                        onClick={() => {
                          setIsOtpPopupOpen(false);
                          setOtpError("");
                          setOtpDigits(new Array(6).fill(""));
                        }}
                      >
                        <FaTimes size={16} />
                      </button>
                      <h2 className="text-[14px] font-[600] mb-3 text-[#0CBB7D] text-center">Verify Aadhaar OTP</h2>
                      <div className="flex justify-center gap-2 mb-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !digit && idx > 0) {
                                // ✅ Move focus to previous input when deleting empty box
                                otpRefs.current[idx - 1]?.focus();
                              } else if (e.key === "ArrowLeft" && idx > 0) {
                                otpRefs.current[idx - 1]?.focus();
                              } else if (e.key === "ArrowRight" && idx < otpDigits.length - 1) {
                                otpRefs.current[idx + 1]?.focus();
                              }
                            }}
                            ref={(el) => (otpRefs.current[idx] = el)}
                            className="w-10 h-10 text-center text-[14px] border text-gray-700 border-gray-300 rounded 
      focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D] outline-none"
                            autoFocus={idx === 0}
                          />
                        ))}

                      </div>
                      {timerActive && (
                        <div className="text-center my-2 text-gray-700 font-[400] text-[12px]">
                          Resend OTP in {otpTimer} sec
                        </div>
                      )}

                      {otpError && (
                        <p className="text-red-500 text-[12px] mt-1 text-center">{otpError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PAN Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                <div className="p-6 rounded-lg shadow-md bg-white">
                  <h3 className="font-[600] text-[#0CBB7D] text-[14px] mb-2">PAN Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    {/* PAN Number + Verify Button together */}
                    <div className="flex flex-row md:flex-row gap-2 col-span-1">
                      <div className="flex flex-col gap-1 w-full">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">PAN Number</label>
                        <input
                          type="text"
                          placeholder="PAN Number"
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                          value={documentDetails.pan}
                          onChange={(e) => setDocumentDetails({ ...documentDetails, pan: e.target.value })}
                          readOnly={isPanVerified}
                          disabled={isPanVerified}
                        />
                      </div>

                      {/* Verify Button (no empty grid space now) */}
                      <div className="flex items-center gap-2">
                        {isPanVerified ? (
                          <>
                            <CheckCircleIcon className="text-[#0CBB7D] mt-5" />
                            <span className="text-[#0CBB7D] font-semibold mt-5 text-[12px]">Verified</span>
                          </>
                        ) : (
                          <button
                            onClick={() => handleVerify("pan")}
                            className="px-3 py-2 text-[12px] mt-6 rounded-lg text-white bg-[#0CBB7D] hover:bg-[#0aa66c]"
                            disabled={false /* or your condition */}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">PAN Type</label>
                        <input
                          type="text"
                          value={documentDetails.panType}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Name</label>
                        <input
                          type="text"
                          value={documentDetails.panName}
                          readOnly
                          disabled
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                  </div>

                </div>


              </div>



              {/* Bank Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                <div className="p-6 rounded-lg shadow-md bg-white">
                  <h3 className="font-[600] text-[#0CBB7D] text-[14px] mb-2">Bank Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-x-2 gap-y-2 mt-2 items-end">
                    {/* Account Number */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Account Number</label>
                      <input
                        type="text"
                        placeholder="Account no"
                        className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        readOnly={isBankVerified}
                        disabled={isBankVerified}
                      />
                    </div>
                    {/* IFSC Code + Verify */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">IFSC Code</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="IFSC Code"
                          className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none"
                          value={bankDetails.ifsc}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                          readOnly={isBankVerified}
                          disabled={isBankVerified}
                        />
                        {isBankVerified ? (
                          <div className="flex items-center gap-1 text-[#0CBB7D] font-semibold text-[12px]">
                            <CheckCircleIcon />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerify("bank")}
                            className="text-white text-[12px] px-3 py-2 rounded-lg bg-[#0CBB7D] hover:bg-[#0aa66c]"
                            disabled={false}
                          >
                            Verify
                          </button>
                        )}
                      </div>

                    </div>
                    {/* Beneficiary Name */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Beneficiary Name</label>
                      <input type="text" placeholder="Beneficiary Name" className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none" value={bankDetails.nameAtBank} readOnly disabled />
                    </div>
                    {/* Bank Name */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Bank Name</label>
                      <input type="text" placeholder="Bank Name" className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none" value={bankDetails.bankName} readOnly disabled />
                    </div>
                    {/* Branch Name */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">Branch Name</label>
                      <input type="text" placeholder="Branch Name" className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none" value={bankDetails.branchName} readOnly disabled />
                    </div>
                    {/* City */}
                    <div className="flex flex-col">
                      <label className="text-[12px] sm:text-[14px] font-[500] text-gray-500">City</label>
                      <input type="text" placeholder="City" className="w-full px-3 py-2 text-gray-500 text-[12px] border border-gray-300 rounded-lg outline-none" value={bankDetails.city} readOnly disabled />
                    </div>
                  </div>
                </div>

              </div>


              {/* Agreement Section */}
              <div className="flex items-start gap-2 mb-4">
                <input
                  type="checkbox"
                  id="agree"
                  className="h-4 w-4 accent-[#0CBB7D] border-[#0CBB7D] rounded focus:ring-[#0CBB7D]"
                  checked={checked}
                  onChange={handleChecked}
                />
                <label htmlFor="agree" className="text-[12px] text-gray-600 font-normal leading-snug">
                  By submitting this form, you agree to Shipex&apos;s User Privacy Statement. <span
                    className="text-[#0CBB7D] underline font-[600] cursor-pointer text-[12px]"
                    onClick={() => setShowAgreement((prev) => !prev)}
                  >
                    View
                  </span>
                </label>

              </div>

              {/* Agreement Modal or Block */}
              {showAgreement && (
                <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
                  <div className="bg-white max-w-5xl w-full rounded-lg p-6 shadow-lg relative">
                    <button
                      className="absolute top-2 right-2 text-gray-700 z-10"
                      onClick={() => setShowAgreement(false)}
                    >
                      {/* Replace with your favorite icon */}
                      <FaTimes size={20} />
                    </button>
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                      <Aggrement
                        documentDetails={documentDetails}
                        companyAddress={companyAddress}
                        gstNumber={gstNumber}
                        billingInfo={billingInfo}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

          )}

          <div className="flex justify-between items-center mt-4 w-full">
            {/* Back Button (align left) */}
            {currentStep > 0 ? (
              <button
                className="bg-gray-500 hover:bg-gray-600 font-[600] text-white py-2 px-3 sm:text-[12px] text-[10px] rounded-lg transition flex items-center gap-1"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {/* Next / Submit Button */}
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !(isBillingVerified || isGstinVerified)) ||
                (currentStep === 1 && !canSubmitKyc)
              }
              className={`py-2 px-3 sm:text-[12px] text-[10px] rounded-lg font-[600]
    flex items-center gap-1 transition
    ${(currentStep === 0 && !(isBillingVerified || isGstinVerified)) ||
                  (currentStep === 1 && !canSubmitKyc)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0CBB7D] hover:bg-[#09946A] text-white"
                }`}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                "Submit KYC"
              )}
            </button>

          </div>
        </div>
      </div>
      {isVerifying && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-50">
          <ThreeDotLoader />
        </div>
      )}
    </div >
  );
};

export default BusinessTypeSelection;