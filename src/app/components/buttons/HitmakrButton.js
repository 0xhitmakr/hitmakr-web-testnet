import React from "react";
import LoaderBlackSmall from "../animations/loaders/loaderBlackSmall";
import LoaderWhiteSmall from "../animations/loaders/loaderWhiteSmall";

export default function HitmakrButton({
  buttonFunction,
  isLoading,
  buttonName,
  isDark = false,
  buttonWidth
}) {
  const baseClasses = "flex justify-center items-center rounded-[250px] border-none text-[15px] font-bold h-[40px] transition-transform duration-200 hover:scale-[0.975] hover:cursor-pointer active:animate-[popIn90_0.2s_ease]";
  const colorClasses = isDark ? "bg-[#252525] text-[#dadada]" : "bg-white text-black";

  return (
    <button 
      onClick={buttonFunction}
      className={`${baseClasses} ${colorClasses}`}
      style={{ width: buttonWidth }}
    >
      {isLoading ? (
        isDark ? <LoaderWhiteSmall /> : <LoaderBlackSmall />
      ) : (
        buttonName
      )}
    </button>
  );
}