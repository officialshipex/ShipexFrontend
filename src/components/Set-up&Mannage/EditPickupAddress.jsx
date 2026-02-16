import React from "react";

const EditPickupAddressModal = ({ isOpen, editData, onClose }) => {
  const [showModal, setShowModal] = useState(false);

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
      <div
        className={`bg-white max-w-3xl w-full mx-4 sm:p-10 p-6 rounded-md shadow-lg transform transition-all duration-300 ease-in-out overflow-y-auto max-h-screen
        ${showModal ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
      >
        <h2 className="text-xl font-bold mb-4">Edit Seller Details</h2>
        <form>
          <div className="grid gap-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium">Seller Name</label>
                <input
                  type="text"
                  defaultValue={editData?.name}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Email</label>
                <input
                  type="email"
                  defaultValue={editData?.email}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Phone Number</label>
                <input
                  type="text"
                  defaultValue={editData?.phone}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium">Display Name</label>
                <input
                  type="text"
                  defaultValue={editData?.displayName}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Address Line 1</label>
                <input
                  type="text"
                  defaultValue={editData?.address1}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Address Line 2</label>
                <input
                  type="text"
                  defaultValue={editData?.address2}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium">City</label>
                <input
                  type="text"
                  defaultValue={editData?.city}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">State</label>
                <input
                  type="text"
                  defaultValue={editData?.state}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block font-medium">ZIP Code</label>
                <input
                  type="text"
                  defaultValue={editData?.zip}
                  className="border rounded px-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="mr-2 bg-red-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#0CBB7D] text-white px-6 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPickupAddressModal;
