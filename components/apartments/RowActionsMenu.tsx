"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

interface RowActionsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onEditOwner: () => void;
  onEditResident: () => void;
}

export default function RowActionsMenu({
  isOpen,
  onToggle,
  onEditOwner,
  onEditResident,
}: RowActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 🔹 Calcular posición cuando se abre
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 208 + window.scrollX, // 208 = ancho del menú
      });
    }
  }, [isOpen]);

  // 🔹 Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 hover:bg-slate-200 rounded-md transition"
      >
        <MoreVertical className="w-5 h-5 text-slate-400" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="absolute z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl w-52"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              onClick={onEditOwner}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition"
            >
              ✏️ Modificar propietario
            </button>

            <button
              onClick={onEditResident}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition"
            >
              👤 Modificar residente
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
