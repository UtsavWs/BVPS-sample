import { Pencil } from "lucide-react";

export default function FabButton({ isEditing, onClick, className = "" }) {
  if (isEditing) return null;

  return (
    <button
      onClick={onClick}
      className={`
        w-11 h-11 bg-[#D64B2A] rounded-[13px]
        flex items-center justify-center
        shadow-lg shadow-orange-200
        hover:scale-105 active:scale-95
        transition-all
        ${className}
      `}
    >
      <Pencil size={17} color="white" strokeWidth={2.2} />
    </button>
  );
}
