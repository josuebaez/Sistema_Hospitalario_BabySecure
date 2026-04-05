import Familiar from "../models/Familiar.js";
import Madre from "../models/Madre.js";
import Bebe from "../models/Bebe.js";
import { generarUIDFamiliar } from "../utils/generateUID.js";
import { validateEmail } from "../utils/validators.js";

export const registerFamiliar = async (req, res) => {
    const { nombre, apellido, parentezco, email, telefono, uid_madre, confirmacion_uid } = req.body;

    if (!nombre || !apellido || !parentezco || !email || !uid_madre || !confirmacion_uid) {
        return res.status(400).json({
            success: false,
            message: "Todos los campos son requeridos"
        });
    }

    if (!uid_madre.startsWith('MAMÁ-')) {
        return res.status(400).json({
            success: false,
            message: "El UID de la madre no es válido"
        });
    }

    if (uid_madre !== confirmacion_uid) {
        return res.status(400).json({
            success: false,
            message: "El UID de la madre y la confirmación no coinciden"
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Correo electrónico no válido"
        });
    }

    try {
        const madreExists = await Madre.findByUid(uid_madre);

        if (!madreExists) {
            return res.status(404).json({
                success: false,
                message: "No se encontró una madre con ese UID. Verifica el código proporcionado por el hospital."
            });
        }

        const emailExists = await Familiar.checkEmailExists(email);

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Este correo electrónico ya está registrado"
            });
        }

        let uidFamiliar;
        let uidUnico = false;
        
        while (!uidUnico) {
            uidFamiliar = generarUIDFamiliar();
            const existe = await Familiar.checkUidExists(uidFamiliar);
            if (!existe) {
                uidUnico = true;
            }
        }

        const result = await Familiar.create(
            uidFamiliar, uid_madre, nombre, apellido, parentezco, email, telefono || null
        );

        res.status(201).json({
            success: true,
            message: "Registro completado exitosamente",
            usuario: result,
            uid_acceso: uidFamiliar
        });

    } catch (error) {
        console.error("Error en registro de familiar:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor. Intenta más tarde."
        });
    }
};

export const getFamiliarData = async (req, res) => {
    try {
        if (req.user.rol !== 'familiar') {
            return res.status(403).json({
                success: false,
                message: "Acceso no autorizado"
            });
        }

        const familiar = await Familiar.findById(req.user.id);

        if (!familiar) {
            return res.status(404).json({
                success: false,
                message: "Familiar no encontrado"
            });
        }

        const bebes = await Bebe.findByMadreUid(familiar.madre_uid);

        res.json({
            success: true,
            familiar: familiar,
            bebes: bebes
        });

    } catch (error) {
        console.error("Error al obtener datos del familiar:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor"
        });
    }
};