export const generarUIDMadre = () => {
    return 'MAMÁ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

export const generarUIDFamiliar = () => {
    return 'FAM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
};