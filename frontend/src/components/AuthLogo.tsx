import { useState } from "react";
import telehealthLogo from "../assets/telehealth-logo.svg";

function AuthLogo() {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <div className="mb-5 flex justify-center">
      {showFallback ? (
        <div
          aria-label="Telehealth logo placeholder"
          className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#DDEEDD] bg-[#EAFFE0] text-3xl font-extrabold text-[#0C9A3D]"
          role="img"
        >
          +
        </div>
      ) : (
        <img
          alt="Telehealth logo"
          className="h-20 w-20"
          src={telehealthLogo}
          onError={() => setShowFallback(true)}
        />
      )}
    </div>
  );
}

export default AuthLogo;
