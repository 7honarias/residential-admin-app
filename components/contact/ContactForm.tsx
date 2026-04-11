'use client'

import { useRef, useTransition } from 'react'
import { submitLead } from '@/actions/contacts' 
export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  // Esta función envuelve tu Server Action de manera segura
  const clientAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await submitLead(formData)
      
      if (result?.error) {
        alert(result.error) // Puedes cambiarlo por un Toast elegante luego
      } else {
        alert('¡Gracias! Hemos recibido tus datos. Te contactaremos en breve.')
        formRef.current?.reset() // Limpia el formulario automáticamente
      }
    })
  }

  return (
    <form ref={formRef} action={clientAction} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Tu Nombre</label>
          <input type="text" name="name" placeholder="Ej. Juan Pérez" required disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition disabled:opacity-50" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Nombre del Conjunto</label>
          <input type="text" name="complexName" placeholder="Ej. Torres del Parque" required disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition disabled:opacity-50" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
        <input type="email" name="email" placeholder="juan@ejemplo.com" required disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition disabled:opacity-50" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Teléfono / WhatsApp</label>
        <input type="tel" name="phone" placeholder="+57 300 000 0000" required disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition disabled:opacity-50" />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full mt-4 px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isPending ? 'Enviando...' : 'Agendar videollamada'}
      </button>
      <p className="text-xs text-center text-slate-500 mt-4">
        No compartimos tu información con terceros.
      </p>
    </form>
  )
}
