// utils/generateUID.js

// Opción 1: Con timestamp corto (los últimos 5 dígitos del timestamp)
export const generarUIDMadre = () => {
    const timestamp = Date.now().toString().slice(-5);  // últimos 5 dígitos: "17756"
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();  // "ABC"
    return `MAMÁ-${timestamp}-${random}`;
};

export const generarUIDFamiliar = () => {
    const timestamp = Date.now().toString().slice(-6);  // últimos 6 dígitos
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `FAM-${timestamp}-${random}`;
};