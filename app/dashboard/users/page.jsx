'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelImporter() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Obtenemos la primera hoja
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convertimos a JSON (los encabezados del Excel serán las llaves)
        const data = XLSX.utils.sheet_to_json(ws);

        // Envío a tu Lambda en AWS
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/massUserOnboarding?complexId=e88e36d6-b8fd-4bb1-af31-697e695b41d6`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ users_to_import: data }),
        });

        const resData = await response.json();
        setResults(resData);
      } catch (error) {
        console.error("Error importando datos:", error);
        alert("Hubo un error al procesar el archivo. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Cargar Residentes</h2>
      <p className="text-sm text-gray-500 mb-6">Sube tu archivo .xlsx con los datos de los nuevos residentes.</p>
      
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="space-y-2">
          <p className="text-gray-600 font-medium">
            {loading ? "Procesando..." : "Haz clic o arrastra el archivo aquí"}
          </p>
          <p className="text-xs text-gray-400">Solo archivos Excel (.xlsx)</p>
        </div>
      </div>

      {/* Resultados del procesamiento */}
      {results && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center p-4 bg-green-50 border-l-4 border-green-500 rounded text-green-700">
            <span className="font-bold mr-2">✅ Éxitos:</span> {results.success.length}
          </div>
          
          {results.errors.length > 0 && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
              <p className="font-bold mb-2 underline">❌ Errores detectados ({results.errors.length}):</p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {results.errors.map((err, i) => (
                    <li key={i}>
                      <span className="font-semibold">{err.email}:</span> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}