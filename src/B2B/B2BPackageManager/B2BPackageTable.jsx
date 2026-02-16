import { FaEdit } from "react-icons/fa";

export default function B2BPackageTable({ packages, meta, status, onEdit }) {
  return (
    <div className="bg-white border rounded-lg p-4 sm:w-2/5">
      <div className="flex justify-between">
        <h2 className="text-[12px] text-gray-700 font-[600]">B2B Package Details</h2>

        {status === "new" && (
          <button
            onClick={onEdit}
            className="p-2 rounded-full bg-gray-500 text-white hover:opacity-90 transition flex items-center justify-center"
          >
            <FaEdit className="text-[12px]" />
          </button>
        )}
      </div>

      <table className="w-full text-[12px] font-[600] text-gray-700 mt-1">
        <thead className="">
          <tr>
            <th className="py-2 px-3">No. of Boxs</th>
            <th className="py-2 px-3">Weight (kg)</th>
            <th className="py-2 px-3">Length (cm)</th>
            <th className="py-2 px-3">Width (cm)</th>
            <th className="py-2 px-3">Height (cm)</th>
          </tr>
        </thead>

        <tbody>
          {packages.map((p, i) => (
            <tr key={i} className="text-center border-b text-[12px] text-gray-500 font-[600]">
              <td className="py-2 px-3">{p.noOfBox}</td>
              <td className="py-2 px-3">{p.weightPerBox}</td>
              <td className="py-2 px-3">{p.length}</td>
              <td className="py-2 px-3">{p.width}</td>
              <td className="py-2 px-3">{p.height}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4 mt-4">
        <div className="bg-green-100 p-3 font-[600] text-[12px] rounded-lg w-1/2">
          <p className="text-gray-700">Applicable Weight</p>
          <p className="text-gray-500">{meta.applicableWeight} Kg</p>
        </div>

        <div className="bg-green-100 font-[600] p-3 text-[12px] rounded-lg w-1/2">
          <p className="text-gray-700">Volumetric Weight</p>
          <p className="text-gray-500">{meta.volumetricWeight} Kg</p>
        </div>
      </div>
    </div>
  );
}
