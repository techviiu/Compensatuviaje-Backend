/**
 * Valida código IATA (3 letras)
 * @param {string} code - Código a validar
 * @returns {Object} { isValid: boolean, errors: string[] }
 * 
 */

function validateIataCode(code){
    const errors = [];

    if(!code || typeof code !== 'string'){
        errors.push('Codigo IATA es requerido');
        return {isValid: false, errors};
    }

    const cleanCode = code.trim();

    if(cleadnCode.length !== 3){
        errors.push('Código IATA deve tener 3 caracteres');
    }

    if (!/^[A-Za-z]{3}$/.test(cleanCode)) {
        errors.push('Código IATA solo puede contener letras (ej: SCL, LIM, JFK)');
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalized: cleanCode
    }
}

/**
 * Valida query de búsqueda
 * @param {string} query - Texto de búsqueda
 * @returns {Object} { isValid: boolean, errors: string[], sanitized: string }
 */
function validateSearchQuery(query){
    const errors = [];
    if(!query){
        return {isValid: true, errors: [], sanitized: ''};
    }

    const strQuery = String(query).trim();

    if(strQuery.length > 0 && strQuery.length < 2){
        errors.push('La busqueda debe tener al menos 2 caracteristicas');
    }

    if(strQuery.length > 50 ){
        errors.push('Son exesedio la cantidad maxima de caracteres');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: strQuery
    };
}

/**
 * Valida límite de resultados
 * @param {any} limit - Límite a validar
 * @returns {Object} { isValid: boolean, value: number }
 */
function validateLimit(limit){
    if(!limit){
        return {isValid: true, value: 15};
    }

    const numLimit = parseInt(limit, 10);

    if(isNaN(numLimit) || numLimit < 1){
        return {isValid: false, value: 15};
    }

    const finalLimit = Math.min(numLimit, 15)
    return {isValid: true, value: finalLimit};

}

module.exports = {
    validateIataCode,
    validateSearchQuery,
    validateLimit
}