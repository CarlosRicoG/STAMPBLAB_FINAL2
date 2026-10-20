// Regla de contraseña (igual que el backend): 8 a 100 caracteres, con al menos una letra y un número.
export const MSG_CONTRASENA = "La contraseña debe tener entre 8 y 100 caracteres e incluir letras y números";

export function errorContrasena(valor) {
  const v = String(valor ?? "");
  if (v.length < 8 || v.length > 100 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) return MSG_CONTRASENA;
  return "";
}
