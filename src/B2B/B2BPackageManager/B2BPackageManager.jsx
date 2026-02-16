import { useEffect, useState } from "react";
import { getB2BPackages, updateB2BPackages } from "./b2bPackage.api";
import B2BPackageTable from "./B2BPackageTable";
import B2BPackageModal from "./B2BPackageModal";
import { Notification } from "../../Notification";


export default function B2BPackageManager({ orderId, status }) {
  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState({
    applicableWeight: 0,
    volumetricWeight: 0,
  });
  


  const [open, setOpen] = useState(false);

  const loadPackages = async () => {
    const res = await getB2BPackages(orderId);
    setPackages(res.data.packages);
    setMeta({
      applicableWeight: res.data.applicableWeight,
      volumetricWeight: res.data.volumetricWeight,
    });
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSave = async (updatedPackages) => {
    await updateB2BPackages(orderId, {
      packages: updatedPackages,
    });
    Notification("B2B packages updated", "success");
    setOpen(false);
    loadPackages();
  };

  return (
    <>
      <B2BPackageTable
        packages={packages}
        meta={meta}
        status={status}
        onEdit={() => setOpen(true)}
      />

      {open && (
        <B2BPackageModal
          initialPackages={packages}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
