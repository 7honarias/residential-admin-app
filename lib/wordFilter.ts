const FORBIDDEN_WORDS = [
  'malparido', 'gonorrea', 'carechimba', 'hp', 'hpta', 'hijueputa', 'pobreton', 'perra', 'puta', 'prostituta',
  'chimba', 'verga', 'pene', 'vagina', 'tetas', 'culo', 'marica', 'guevon', 'güevon', 'pajuo', 'paja',
   'faggot', 'nigger', 'sudaca', 'veneco', 'traba', 'loca', 'perico', 'bazuko',
   'idiota', 'estupido', 'imbecil', 'basura', 'rata', 'ladron', 'corrupto'
  // Agrega aquí todas las variantes que necesites
];

export const containsForbiddenWords = (text: string): boolean => {
  if (!text) return false;

  // Normalizamos: quitamos acentos y pasamos a minúsculas
  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); 

  // Buscamos cada palabra rodeada de límites de palabra (\b) para evitar falsos positivos
  // (ej. "escritorio" no debería bloquearse por contener "ito")
  return FORBIDDEN_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    
    // También detectamos si intentan engañar con puntos o guiones: p.u.t.a
    const trickyRegex = new RegExp(word.split('').join('[\\W_]*'), 'gi');
    
    return regex.test(normalizedText) || trickyRegex.test(normalizedText);
  });
};

export const normalizeForFilter = (text: string): string => {
  return text
    .toLowerCase()
    // Elimina acentos: á -> a, é -> e
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Elimina caracteres especiales y números que reemplazan letras (opcional)
    .replace(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ""); 
};
