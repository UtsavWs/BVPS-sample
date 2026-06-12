import { useRef, useState } from "react";
import { Camera, X, ImagePlus, Eye } from "lucide-react";
import CameraCapture from "./CameraCapture";
import { compressImage } from "../../utils/image";

/**
 * Reusable image uploader — browse (multiple) + in-app camera + client-side
 * compression. Parent owns the value array; this only collects pending files.
 *
 * Each item: { id, url? (already uploaded), file? + preview? (pending), name }
 * Display source = item.url || item.preview.
 *
 * Props:
 *  value, onChange(items)
 *  max (default 10), single (max 1, slot layout)
 *  disabled, enableCamera (default true)
 */
export default function ImageUploader({
  value = [],
  onChange,
  max = 10,
  single = false,
  disabled = false,
  enableCamera = true,
}) {
  const inputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // src to show in the lightbox
  const cap = single ? 1 : max;

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    setBusy(true);
    if (single) {
      const compressed = await compressImage(files[0]);
      value.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
      onChange([
        { id: `${Date.now()}-${Math.random()}`, file: compressed, preview: URL.createObjectURL(compressed), name: compressed.name },
      ]);
    } else {
      const room = cap - value.length;
      if (room > 0) {
        const compressed = await Promise.all(files.slice(0, room).map((f) => compressImage(f)));
        const items = compressed.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        }));
        onChange([...value, ...items]);
      }
    }
    setBusy(false);
  };

  const remove = (id) => {
    const item = value.find((i) => i.id === id);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    onChange(value.filter((i) => i.id !== id));
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple={!single}
      className="hidden"
      onChange={(e) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );

  // Full-size preview lightbox (shared by both layouts)
  const lightbox = preview && (
    <div
      className="fixed inset-0 z-[800] bg-black/80 flex items-center justify-center p-4"
      onClick={() => setPreview(null)}
    >
      <button
        type="button"
        onClick={() => setPreview(null)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none"
      >
        <X size={20} />
      </button>
      <img
        src={preview}
        alt="preview"
        className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );

  // Hover overlay with an eye icon → opens the lightbox.
  const previewOverlay = (src) => (
    <button
      type="button"
      onClick={() => setPreview(src)}
      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer border-none"
      title="Preview"
    >
      <Eye size={18} className="text-white" />
    </button>
  );

  // ── Single-slot layout (visiting card) ──
  if (single) {
    const item = value[0];
    const src = item?.url || item?.preview;
    return (
      <div>
        {hiddenInput}
        {src ? (
          <div className="relative w-full group">
            <img
              src={src}
              alt="upload"
              className="w-full h-40 object-cover rounded-xl border border-stone-200"
            />
            {previewOverlay(src)}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow text-gray-600 hover:text-red-500 transition cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${
              disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-[#E8C8BC] bg-[#FDF8F6]"
            }`}
          >
            <ImagePlus size={22} className="text-[#C0441F]" />
            {!disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-[#C0441F] hover:bg-[#A63818] text-white text-[12px] font-semibold rounded-lg transition cursor-pointer"
                >
                  Browse
                </button>
                {enableCamera && (
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-white border border-[#C0441F] text-[#C0441F] hover:bg-[#FDF3EE] text-[12px] font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Camera size={13} /> Camera
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {showCamera && (
          <CameraCapture onCapture={(file) => addFiles([file])} onClose={() => setShowCamera(false)} />
        )}
        {lightbox}
      </div>
    );
  }

  // ── Multi-image gallery layout ──
  const full = value.length >= cap;
  return (
    <div>
      {hiddenInput}
      <div
        className={`rounded-2xl border-2 border-dashed px-4 py-4 flex flex-col gap-3 ${
          disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-[#E8C8BC] bg-[#FDF8F6]"
        }`}
      >
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {value.map((img) => {
              const src = img.url || img.preview;
              return (
                <div key={img.id} className="relative group">
                  <img
                    src={src}
                    alt={img.name || "image"}
                    className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white"
                  />
                  {previewOverlay(src)}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => remove(img.id)}
                      className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-red-500 transition cursor-pointer"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!disabled && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={full || busy}
              onClick={() => inputRef.current?.click()}
              className="px-5 py-2.5 bg-[#C0441F] hover:bg-[#A63818] text-white text-[13px] font-semibold rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Browse File
            </button>
            {enableCamera && (
              <button
                type="button"
                disabled={full || busy}
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#C0441F] text-[#C0441F] hover:bg-[#FDF3EE] text-[13px] font-semibold rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={15} /> Take Photo
              </button>
            )}
            <span className="text-[12px] text-gray-400 ml-auto">
              {value.length}/{cap}
            </span>
          </div>
        )}
        {disabled && value.length === 0 && (
          <p className="text-[12.5px] text-gray-400">No images uploaded.</p>
        )}
      </div>

      {showCamera && (
        <CameraCapture onCapture={(file) => addFiles([file])} onClose={() => setShowCamera(false)} />
      )}
      {lightbox}
    </div>
  );
}
