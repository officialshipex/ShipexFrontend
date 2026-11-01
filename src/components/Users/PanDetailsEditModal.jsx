import SellerDetailsEditModal from "./SellerDetailsEditModal";

const FIELDS = [
  { key: "number", label: "PAN Number", upper: true, maxLength: 10 },
  { key: "name", label: "Name as on PAN" },
];

export default function PanDetailsEditModal({ isOpen, onClose, onSaved, initial }) {
  return (
    <SellerDetailsEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSaved={onSaved}
      initial={initial}
      section="pan"
      title="Edit PAN Details"
      note="Saved as entered, without an online check. The change is recorded against your account."
      fields={FIELDS}
    />
  );
}
