"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff } from "lucide-react";

interface PlaceToPayConfigFormProps {
  initialConfig?: {
    merchant_id: string;
    public_key: string;
    private_key: string;
  } | null;
  onSave: (config: {
    merchantId: string;
    publicKey: string;
    privateKey: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export default function PlaceToPayConfigForm({
  initialConfig,
  onSave,
  isSaving = false,
}: PlaceToPayConfigFormProps) {
  const [merchantId, setMerchantId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setMerchantId(initialConfig.merchant_id || "");
      setPublicKey(initialConfig.public_key || "");
      setPrivateKey(initialConfig.private_key || "");
    }
  }, [initialConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchantId.trim() || !publicKey.trim() || !privateKey.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    await onSave({
      merchantId: merchantId.trim(),
      publicKey: publicKey.trim(),
      privateKey: privateKey.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Merchant ID
        </label>
        <input
          type="text"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          placeholder="Ingresa el Merchant ID de PlaceToPay"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Public Key
        </label>
        <div className="relative">
          <input
            type={showPublicKey ? "text" : "password"}
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="Ingresa la clave pública"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={() => setShowPublicKey(!showPublicKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPublicKey ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Private Key
        </label>
        <div className="relative">
          <input
            type={showPrivateKey ? "text" : "password"}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Ingresa la clave privada"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={() => setShowPrivateKey(!showPrivateKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPrivateKey ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </form>
  );
}
