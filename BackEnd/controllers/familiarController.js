import Familiar from "../models/Familiar.js";
import Madre from "../models/Madre.js";
import Bebe from "../models/Bebe.js";
import { generarUIDFamiliar } from "../utils/generateUID.js";
import { validateEmail } from "../utils/validators.js";

export const registerFamiliar = async (req, res) => {
    const { nombre, apellido, parentezco, email, uid_madre, confirmacion_uid, telefono } = req.body;

    // Validaciones de campos requeridos
    if (!nombre || !apellido || !parentezco || !email || !uid_madre || !confirmacion_uid) {
        return res.status(400).json({
            success: false,
            message: "Todos los campos son requeridos"
        });
    }

    // Validar formato del UID de la madre
    if (!uid_madre.startsWith('MAMÁ-')) {
        return res.status(400).json({
            success: false,
            message: "El UID de la madre no es válido. Debe comenzar con 'MAMÁ-'"
        });
    }

    // Validar que coincidan UID y confirmación
    if (uid_madre !== confirmacion_uid) {
        return res.status(400).json({
            success: false,
            message: "El UID de la madre y la confirmación no coinciden"
        });
    }

    // Validar formato de email
    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Correo electrónico no válido"
        });
    }

    try {
        // Verificar que la madre existe y está ACTIVA
        const madreExists = await Madre.findByUid(uid_madre, false); // false = solo activas

        if (!madreExists) {
            return res.status(404).json({
                success: false,
                message: "No se encontró una madre activa con ese UID. Verifica el código proporcionado por el hospital."
            });
        }

        // Verificar que la madre está activa
        if (!madreExists.activo) {
            return res.status(400).json({
                success: false,
                message: "La madre ha sido dada de alta del hospital. No se pueden registrar nuevos familiares."
            });
        }

        // Verificar si el email ya está registrado
        const emailExists = await Familiar.checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Este correo electrónico ya está registrado"
            });
        }

        // Generar UID único para el familiar
        let uidFamiliar;
        let uidUnico = false;
        
        while (!uidUnico) {
            uidFamiliar = generarUIDFamiliar();
            const existe = await Familiar.checkUidExists(uidFamiliar);
            if (!existe) {
                uidUnico = true;
            }
        }

        // Crear el familiar
        const result = await Familiar.create(
            uidFamiliar, 
            uid_madre, 
            nombre, 
            apellido, 
            parentezco, 
            email, 
            telefono || null
        );

        console.log(`✅ Familiar registrado exitosamente: ${email} asociado a madre ${uid_madre}`);

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

        // Verificar si el familiar tiene acceso (madre activa)
        const acceso = await Familiar.verificarAcceso(familiar.email);
        
        if (!acceso.tiene_acceso) {
            return res.status(403).json({
                success: false,
                message: acceso.motivo || "No tienes acceso actualmente"
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