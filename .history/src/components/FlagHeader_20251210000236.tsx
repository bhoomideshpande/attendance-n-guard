import React from "react";

const IndianFlag = () => (
  <div className="w-16 h-24 flex flex-col overflow-hidden rounded-sm shadow-lg animate-wave-flag">
    <div className="flex-1 bg-[#FF9933]"></div>
    <div className="flex-1 bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#000080] rounded-full flex items-center justify-center">
        <div className="w-5 h-5 border border-[#000080] rounded-full">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-2 bg-[#000080] origin-bottom"
              style={{
                transform: `rotate(${i * 15}deg) translateY(-0.5rem)`,
                left: "50%",
                top: "50%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
    <div className="flex-1 bg-[#138808]"></div>
  </div>
);

const ArmyFlag = () => (
  <div className="w-16 h-24 bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center overflow-hidden rounded-sm shadow-lg animate-wave-flag">
    <div className="text-yellow-400 text-center">
      <div className="text-2xl font-bold">⚔️</div>
      <div className="text-[8px] font-semibold mt-1">INDIAN</div>
      <div className="text-[8px] font-semibold">ARMY</div>
    </div>
  </div>
);

export const FlagHeader = () => {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArmyFlag />
            <div className="text-primary-foreground">
              <h1 className="text-xl font-bold tracking-wide">NCC Attendance Portal</h1>
              <p className="text-xs opacity-90">Unity and Discipline</p>
            </div>
          </div>
          <IndianFlag />
        </div>
      </div>
      {/* Spacer to push content below fixed header */}
      <div className="h-[120px]"></div>
    </>
  );
};
