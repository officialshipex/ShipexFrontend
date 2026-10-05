import React, { useEffect } from 'react';

// "No access" popup shown to employees who open (or click) something they have no permission for.
function EmployeeAuthModal({
  employeeModalShow = true,
  employeeModalClose,
  title = "Access Denied",
  message = "You don't have access to this page. Please contact your administrator.",
}) {
  useEffect(() => {
    if (!employeeModalShow || !employeeModalClose) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') employeeModalClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [employeeModalShow, employeeModalClose]);

  if (!employeeModalShow) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="employee-auth-title"
      aria-describedby="employee-auth-message"
    >
      {/* Background overlay with blur */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={employeeModalClose}></div>

      {/* Modal box */}
      <div className="relative bg-white rounded-md shadow-xl p-6 w-[95%] max-w-md md:p-10 mx-auto text-center z-10">
        <h2 id="employee-auth-title" className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
          {title}
        </h2>
        <p id="employee-auth-message" className="text-sm md:text-base text-gray-600">
          {message}
        </p>
        <button
          autoFocus
          onClick={employeeModalClose}
          className="mt-6 bg-brand-primary hover:opacity-90 text-white px-8 py-2.5 rounded-md transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default EmployeeAuthModal;
