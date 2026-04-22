

export default function FabButton({ isEditing, onClick, className = "" }) {
  if (isEditing) return null;

  return (
    <button
      onClick={onClick}
      className={`
        w-13 h-13 bg-[#D64B2A] rounded-[13px]
        flex items-center justify-center
        shadow-lg shadow-orange-200
        transition-all
        ${className}
      `}
    >
      <img src="/assets/logos/pencil.svg" alt="pencil" />
    </button>
  );
}
