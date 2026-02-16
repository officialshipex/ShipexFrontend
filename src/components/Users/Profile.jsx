import React from 'react';
import { NavLink, Routes, Route, useParams, useLocation } from 'react-router-dom';
import UserDetails from './UserDetails';
import OrderTab from '../../Order/OrderPage';
import NdrTab from '../../NDR/ndr';
import BillingTab from '../Billings/Billing';
import WeightDiscrepancy from '../../component/Toolss/WeightDiscrepancy/WeightDiscrepancy';

function Profile() {
  const { id } = useParams();

  const basePath = `/dashboard/Setup&Manage/User/Profile/${id}`;

  const tabs = [
    // { label: 'Profile', path: '' },
    // { label: 'Order', path: 'order' },
    // { label: 'NDR', path: 'ndr' },
    // { label: 'Billings', path: 'billings' },
    // { label: "Weight Discrepancy", path: 'weight_discrepancy' }
  ];

  return (
    <div>
      {/* <h1 className="sm:text-[18px] text-[14px] sm:px-2 px-1 font-[600] mb-2 text-left text-gray-700">Profile</h1> */}
      {/* <hr className="mb-2 border-gray-300" /> */}

      <div className="flex sm:px-2 px-1 flex-wrap justify-left gap-2 text-[12px]">
        {tabs.map(({ label, path }) => (
          <NavLink
            key={label}
            to={path ? `${basePath}/${path}` : `${basePath}`}
            end
            className={({ isActive }) =>
              `px-3 py-2 text-[12px] font-[600] rounded-lg transition duration-200 ${isActive
                ? 'bg-[#0CBB7D] text-white'
                : 'bg-white text-gray-700 hover:bg-green-200'
              }`
            }
          >
            {label}
          </NavLink>
        ))}

      </div>

      <div className="text-sm text-gray-700">
        <Routes>
          <Route index element={<UserDetails />} />
          {/* <Route path="order" element={<OrderTab />} /> */}
          {/* <Route path="ndr" element={<NdrTab />} /> */}
          {/* <Route path="billings" element={<BillingTab />} /> */}
          {/* <Route path="weight_discrepancy" element={<WeightDiscrepancy />} /> */}
        </Routes>

      </div>
    </div>
  );
}

export default Profile;
