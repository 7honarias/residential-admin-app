// actions/contact.ts
'use server'

import { supabase } from '@/lib/supabaseClient'

export async function submitLead(formData: FormData) {

  // Extraer los datos del formulario
  const name = formData.get('name') as string
  const complexName = formData.get('complexName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  // Validación básica
  if (!name || !complexName || !email || !phone) {
    return { error: 'Por favor, completa todos los campos.' }
  }

  // Insertar en la base de datos
  const { error } = await supabase
    .from('leads')
    .insert([
      { name, complex_name: complexName, email, phone }
    ])

  if (error) {
    console.error('Error insertando lead:', error)
    return { error: 'Hubo un error al enviar tu solicitud. Intenta de nuevo.' }
  }

  // Opcional: Aquí podrías conectar un servicio para que te llegue un correo a ti avisando del nuevo lead (ej. Resend o SendGrid)

  return { success: true }
}
