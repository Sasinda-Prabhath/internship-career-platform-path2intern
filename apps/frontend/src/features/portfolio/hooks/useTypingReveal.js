import { useState, useEffect } from "react";

/** Reveals text gradually for a “typing” effect */
export function useTypingReveal(fullText, active, speed = 18) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!active || !fullText) {
      setShown(fullText || "");
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [fullText, active, speed]);

  return shown;
}
