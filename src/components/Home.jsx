import React, { use, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import noPickupImage from "../assets/nopickups.svg";
import neworders from "../assets/neworders.svg";
import unprocessorders from "../assets/unprocessorders.svg";
import { getSession } from "../utils/session"


const Home = () => {
  const [kyc, setKyc] = useState(false)



  async function checkKyc() {
    const session = await getSession()
    // console.log(session)
    if (session) {
      // console.log(session)
      if (session.kyc) {
        setKyc(true)
      } else {
        setKyc(false)
      }
    } else {
      console.log("no session")
    }
  }
  checkKyc()



  const navigate = useNavigate();

  const steps = [
    {
      step: "Step 1",
      description: "Complete your KYC to start processing your orders",
      title: "Unlocks all feature restrictions",
      status: `${kyc ? "Done" : "Pending"}`,
      statusColor: `${kyc ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`,
      navigateTo: `${kyc ? "/step1" : "/kyc"}`,
    },
    {
      step: "Step 2",
      description: "Update profile details in Company Profile settings",
      title: "Update for seamless shipping experience!",
      status: "Pending",
      statusColor: "bg-red-100 text-red-700",
      navigateTo: "/step2",
    },
    {
      step: "Step 3",
      description: "Make your first recharge!",
      title: "Let's start shipping...",
      status: "Done",
      statusColor: "bg-green-100 text-green-700",
      navigateTo: "/step3",
    },
    {
      step: "Step 4",
      description: "Add a default pickup address",
      title: "Help us with your favorite pickup location",
      status: "Done",
      statusColor: "bg-green-100 text-green-700",
      navigateTo: "/step4",
    },
    {
      step: "Step 5",
      description: "Configure carrier priorities",
      title: "Let us know your courier partner preferences",
      status: "Done",
      statusColor: "bg-green-100 text-green-700",
      navigateTo: "/step5",
    },
    {
      step: "Step 6",
      description: "Integrate your marketplace accounts with Shipex",
      title: "Manage all your accounts from one place",
      status: "Pending",
      statusColor: "bg-red-100 text-red-700",
      navigateTo: "/step6",
    },
    {
      step: "Step 7",
      description: "Provide as your packaging option",
      title: "Let's say no to weight discrepancies!",
      status: "Pending",
      statusColor: "bg-red-100 text-red-700",
      navigateTo: "/step7",
    },
    {
      step: "Step 8",
      description: "Create your first order!",
      title: "Happy shipping...",
      status: "Done",
      statusColor: "bg-green-100 text-green-700",
      navigateTo: "/step8",
    },
  ];

  // Simulate the download of a file
  const handleDownload = (type) => {
    const data = new Blob([`This is a dummy ${type} file.`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type.toLowerCase()}_dummy.txt`; // Name of the file
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="hidden lg:flex items-center border border-dashed border-red-500 rounded-lg bg-red-50 px-6 py-4 mb-6 shadow-lg">
        <span className="text-yellow-400 text-xl mr-3">💡</span>
        <p className="text-gray-700 text-sm">
          Complete your KYC to Start Shipping
        </p>
        <a href="/Kyc" className="ml-auto text-purple-600 text-sm font-medium hover:underline">
          Click Here ›
        </a>
      </div>


      <div className="bg-white p-10 rounded shadow-lg flex flex-col lg:flex-row">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 pr-4 border-b lg:border-r">
          <h2 className="text-md font-semibold mb-6 ">
            Get started in a few easy steps:
          </h2>
          <div className="space-y-4">
            {steps.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-6 cursor-pointer flex-col sm:flex-row hover:bg-gray-100"
                onClick={() => navigate(item.navigateTo)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full">
                  <p className="font-medium text-lg sm:text-base whitespace-nowrap">
                    {item.step}
                  </p>
                  <div className="flex flex-col w-full">
                    <p className="text-sm text-gray-600 font-semibold mb-2 sm:mb-4">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-500">{item.title}</p>
                  </div>
                </div>
                <span
                  className={`text-sm w-full sm:w-20 text-center px-3 py-1 rounded mt-2 sm:mt-0 ${item.statusColor}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 pl-4 mt-6 lg:mt-0">
          <h3 className="text-sm font-semibold mb-4 -ml-4 sm:ml-0">
            Actions Needing Your Attention Today
          </h3>

          <div className="mb-4 px-4 -ml-8 sm:ml-0">
            {/* Unprocessable Orders */}
            <div
              className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between mb-4 p-2 sm:p-8 border rounded-lg cursor-pointer bg-white shadow hover:shadow-lg w-[104%] gap-4 sm:gap-8"
              onClick={() => (window.location.href = "/unprocessable-orders")}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 sm:gap-8 w-full">
                <div className="">
                  <img src={unprocessorders} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm">Unprocessable Orders</p>
                  <span className="font-bold">{0}</span>
                </div>
              </div>
            </div>


            {/* New Orders to be Processed */}
            <div
              className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between p-2 sm:p-8 border rounded-lg cursor-pointer bg-white shadow hover:shadow-lg w-full gap-4 sm:gap-8 w-[104%]"
              onClick={() => (window.location.href = "/new-orders")}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 sm:gap-8 w-full">
                <div className="">
                  <img src={neworders} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm">New Orders to be Processed</p>
                  <span className="font-bold">{0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Upcoming Pickups */}
          <h3 className="text-sm font-semibold mb-4 -ml-5 sm:ml-0">
            Your Upcoming Pickups
          </h3>

          <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center mb-6 -ml-8 sm:ml-0">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <span className="text-sm text-gray-600">Date :</span>
              <div className="flex items-center px-2 py-2 bg-white-200 border-2 rounded-lg">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-l-md hover:bg-gray-300">
                  Jan 14, 2025
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-r-md hover:bg-gray-300">
                  Jan 15, 2025
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center mt-4 lg:mt-0">
              <span className="text-sm text-gray-600">Download :</span>
              <div className="flex gap-4 flex-wrap justify-center">
                {/* Labels Button */}
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border-2 bg-white-500 hover:bg-gray-100"
                  onClick={() => handleDownload("Labels")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-7-4v6m-4-6l4 4m0 0l4-4m-4-4v10"
                    />
                  </svg>
                  Labels
                </button>

                {/* Invoices Button */}
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white-500 border-2 hover:bg-gray-100"
                  onClick={() => handleDownload("Invoices")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-7-4v6m-4-6l4 4m0 0l4-4m-4-4v10"
                    />
                  </svg>
                  Invoices
                </button>
              </div>
            </div>
          </div>

          {/* Pickup Image and Text */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <img src={noPickupImage} alt="No Pickup" className="w-40 h-40" />
            <span className="text-sm font-semibold text-gray-800 sm:text-xl md:text-sm -ml-5 sm:ml-0">
              No Pickup Scheduled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
