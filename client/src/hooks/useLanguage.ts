import { useState, useEffect } from "react";
import type { Language } from "@/lib/language";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("krishihealth-lang") as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("krishihealth-lang", language);
  }, [language]);

  return { language, setLanguage };
}
