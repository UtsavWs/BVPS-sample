import { memo } from "react";


const ProfileProgress = ({ progress }) => (
    <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] text-gray-500">Profile Complete</span>
            <span className="text-[13px] font-semibold text-gray-500">
                {progress}%
            </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #1F6EBD, #C94621)",
                }}
            />
        </div>
    </div>
);

export default memo(ProfileProgress);