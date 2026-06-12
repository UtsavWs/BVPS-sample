import { useRef } from "react";
import { FileText, FileSpreadsheet, File as FileIcon, X, Upload } from "lucide-react";

/**
 * Reusable document uploader — PDF / Excel / Word, multiple files.
 * Parent owns the value array; this collects pending files.
 *
 * Each item: { id, url? (uploaded), file? (pending), name, ext }
 *
 * Props: value, onChange(items), max (default 5), disabled
 */
const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const extOf = (name = "") => name.split(".").pop()?.toLowerCase() || "";

const DocIcon = ({ ext }) => {
  if (ext === "pdf") return <FileText size={16} className="text-red-500" />;
  if (ext === "xls" || ext === "xlsx") return <FileSpreadsheet size={16} className="text-green-600" />;
  if (ext === "doc" || ext === "docx") return <FileText size={16} className="text-blue-600" />;
  return <FileIcon size={16} className="text-gray-500" />;
};

export default function DocumentUploader({ value = [], onChange, max = 5, disabled = false }) {
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const room = max - value.length;
    if (room <= 0) return;
    const items = files.slice(0, room).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      ext: extOf(file.name),
    }));
    onChange([...value, ...items]);
  };

  const remove = (id) => onChange(value.filter((i) => i.id !== id));

  const full = value.length >= max;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        className={`rounded-2xl border-2 border-dashed px-4 py-4 flex flex-col gap-3 ${
          disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-[#E8C8BC] bg-[#FDF8F6]"
        }`}
      >
        {value.length > 0 && (
          <ul className="flex flex-col gap-2">
            {value.map((doc) => {
              const inner = (
                <span className="flex items-center gap-2 min-w-0">
                  <DocIcon ext={doc.ext || extOf(doc.name)} />
                  <span className="text-[12.5px] text-gray-700 truncate">{doc.name}</span>
                </span>
              );
              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2"
                >
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:underline">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => remove(doc.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!disabled ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={full}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#C0441F] hover:bg-[#A63818] text-white text-[13px] font-semibold rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={15} /> Upload Document
            </button>
            <span className="text-[11.5px] text-gray-400">PDF, Excel, Word · {value.length}/{max}</span>
          </div>
        ) : (
          value.length === 0 && <p className="text-[12.5px] text-gray-400">No documents uploaded.</p>
        )}
      </div>
    </div>
  );
}
