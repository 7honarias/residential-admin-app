"use client";

import { useState } from "react";
import { X, HelpCircle, ListPlus, Trash2, Plus, Info, Loader2 } from "lucide-react";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; majority_type: string; options: string[] }) => void;
  isProcessing: boolean;
}

export default function CreatePollModal({ isOpen, onClose, onSubmit, isProcessing }: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [majorityType, setMajorityType] = useState("SIMPLE");
  
  // Iniciamos siempre con 2 opciones vacías por defecto
  const [options, setOptions] = useState<string[]>(["", ""]);

  if (!isOpen) return null;

  // Funciones para manejar las opciones dinámicas
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (indexToRemove: number) => {
    // Mantenemos al menos 2 opciones siempre
    if (options.length > 2) {
      setOptions(options.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtramos opciones que estén completamente vacías por seguridad
    const cleanOptions = options.map(opt => opt.trim()).filter(opt => opt !== "");
    
    if (cleanOptions.length < 2) {
      alert("Debes proporcionar al menos 2 opciones válidas.");
      return;
    }

    onSubmit({
      question,
      majority_type: majorityType,
      options: cleanOptions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" /> Crear Nueva Pregunta
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1. Pregunta */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Pregunta o Decisión a Tomar *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ej: ¿Aprueba la contratación de la empresa de seguridad VIGILANCIA LTDA?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 resize-none"
            />
          </div>

          {/* 2. Tipo de Mayoría */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Tipo de Aprobación Legal *
            </label>
            <select
              value={majorityType}
              onChange={(e) => setMajorityType(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            >
              <option value="SIMPLE">Mayoría Simple</option>
              <option value="QUALIFIED">Mayoría Calificada</option>
            </select>
            
            {/* Mensaje de ayuda contextual */}
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                {majorityType === "SIMPLE" 
                  ? "Requiere la mitad más uno de los coeficientes PRESENTES en la asamblea." 
                  : "Requiere el 70% o más de los coeficientes de TODO el conjunto residencial (Asistan o no)."}
              </p>
            </div>
          </div>

          {/* 3. Opciones Dinámicas */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <ListPlus className="w-4 h-4" /> Opciones de Respuesta
            </label>
            
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <input
                  type="text"
                  required
                  placeholder={`Opción ${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2 || isProcessing}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  title="Eliminar opción"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addOption}
              disabled={isProcessing}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar otra opción
            </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!question.trim() || isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Guardando..." : "Guardar Pregunta"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}