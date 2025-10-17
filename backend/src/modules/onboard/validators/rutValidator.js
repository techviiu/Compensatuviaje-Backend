import { validateRut } from '@fdograph/rut-utilities';

/**
 * Valadaciones:
 * - Validación formato RUT chileno
 * - Cálculo y validacion de dígito verificado (el último digito es resonsable)
 * - Limpieza y normalizacion RUT
 * - Validacion rangos permitidos
 * 
 * Se usa para:
 * - Registrar empresas (aerolineas) por ahora
 * - Validacion datos fiscales
 */

/**
 *  * Limpia un RUT removiendo puntos, guiones y espacios
 * @param {string} rut - RUT a limpiar
 * @returns {string} RUT limpio
 */
const cleanRut = (rut) =>{
    if (!rut || typeof rut  !== 'string') return '';
    return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

/**
 * Calcula el dígito verificador de un RUT
 * @param {string} rutBase - Los primeros dígitos del RUT sin DV
 * @returns {boolean} - true si es válido 
 */
const calculateDV = (rutBase) =>{
    // utilizamos la biblioteca para validar excepciones
   return  validateRut(rutBase);
}

/**
 * Formatea un RUT limpio al formato estándar XX.XXX.XXX-X
 * @param {string} cleanRut - RUT limpio
 * @returns {string} RUT formateado
 */
const formatRut = (cleanRut) => {
  if (!cleanRut || cleanRut.length < 2) return cleanRut;
  
  const dv = cleanRut.slice(-1);
  const body = cleanRut.slice(0, -1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv}`;
};

/**
 * Valida completamente un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {Object} Resultado de validación
 */

const validateRut = (rut) =>{
    const result = {
        isValid: false,
        errors: [],
        cleaned: '',
        formatted: '',
        rutBase: '',
        dv: ''
    };

    if(!rut || typeof rut !== 'string'){
        result.errors.push('RUT es requerido')
        return result
    }

    // limpiamos RUT
    const cleaned = cleanRut(rut);
    result.cleaned = cleaned;

    // verificamos la longitud minima y maxima
    if(cleaned.length < 8  || cleaned.length > 9){
        result.errors.push("RUT debe tener entre 8 y 9 caracteres");
        return result;
    }

    if (!/^\d+[0-9K]$/.test(cleaned)) {
        result.errors.push('RUT contiene caracteres inválidos');
        return result;
    }

    const rutBase = cleaned.slice(0, -1);
    const providedDV = cleaned.slice(-1);
    result.rutBase = rutBase;
    result.dv  = providedDV

    // Verificar que la base sea numérica
    if (!/^\d+$/.test(rutBase)) {
        result.errors.push('Base del RUT debe ser numérica');
        return result;
    }

    // verificar rango 1.000.000 - 99.999.999
    const rutNumber = parseInt(rutBase);
    if(rutNumber < 1000000 || rutNumber > 99999999){
        result.errors.push('RUT fuera de rango valido')
        return result;
    }
     const validateDV = calculateDV(rutBase);
     if(validateDV == false){
        result.errors.push('Digito verificador invalido');
        return result;
     };

     result.isValid = true
     result.formatted = formatRut(cleaned);
     return result;
}

/**
 * Middleware Express para validar RUT en request body
 * @param {string} fieldName - Nombre del campo que contiene el RUT
 * @returns {Function} Middleware Express
 */

const validateRutMiddleware = (fieldName = 'rut') =>{
    return (req, res, next)=>{
        const rut = req.body[fieldName];
        const validation = validateRut(rut);

        if(!validateRut.isValid){
            return res.status(400).json({
                success: false,
                message: 'RUT inválido',
                errors: validation.errors,
                field: fieldName
            })
        }

        // agregamos el RUT valido al request
        req.validateRut = {
            original: rut,
            cleaned: validation.cleaned,
            formatted: validation.formatted,
            rutBase: validation.rutBase,
            dv: validation.dv
        };
        next();
    }

 

}

/**
 * Valida si un RUT corresponde a una empresa (vs persona natural)
 * @param {string} rut - RUT a validar
 * @returns {boolean} true si es RUT empresarial
 */
const isCompanyRut = (rut) =>{
    const validation = validateRut(rut);
    if(!validation.isValid) return false;
    const rutNumber = parseInt(validation.rutBase);
    // generalmente las empresas sulen tener un RUT mayor a 50000000
    return rutNumber >= 50000000;
}

module.exports = {
    cleanRut,
    calculateDV,
    formatRut,
    validateRut,
    validateRutMiddleware,
    isCompanyRut
};

