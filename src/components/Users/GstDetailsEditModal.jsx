import SellerDetailsEditModal from "./SellerDetailsEditModal";

const FIELDS = [
  { key: "gstin", label: "GSTIN", upper: true, maxLength: 15 },
  { key: "businessName", label: "Business Name" },
  { key: "address", label: "Registered Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode", numeric: true, maxLength: 6 },
];

export default function GstDetailsEditModal({ isOpen, onClose, onSaved, initial }) {
  return (
    <SellerDetailsEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSaved={onSaved}
      initial={initial}
      section="gst"
      title="Edit GST Details"
      note="Saved as entered, without an online check. The change is recorded against your account."
      fields={FIELDS}
    />
  );
}
