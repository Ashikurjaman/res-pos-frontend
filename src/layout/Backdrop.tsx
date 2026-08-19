import { useSidebar } from "../context/SidebarContext";
import { useEffect, useState } from "react";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isMobileOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileOpen) {
        toggleMobileSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, toggleMobileSidebar]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
        isMobileOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={toggleMobileSidebar}
      role="button"
      aria-label="Close sidebar"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleMobileSidebar();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
    </div>
  );
};

export default Backdrop;
