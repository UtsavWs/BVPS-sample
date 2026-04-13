export default function LoadingScreen({ bg = "bg-[#F9EDE8]" }) {
  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <div className="w-10 h-10 rounded-full border-4 border-[#C94621]/20 border-t-[#C94621] animate-spin" />
    </div>
  );
}
