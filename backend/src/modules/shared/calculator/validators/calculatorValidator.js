const { VALID_CABIN_CODES, VALIDATION_LIMITS } = require('../constants/calculatorConstants');

function validateCalculationRequest(data) {
    const errors = [];

    const originValidation = validateIataCode(data.origin, 'origin');
    if (!originValidation.isValid) errors.push(...originValidation.errors);

    const destValidation = validateIataCode(data.destination, 'destination');
    if (!destValidation.isValid) errors.push(...destValidation.errors);

    if (data.origin && data.destination && 
        data.origin.toUpperCase() === data.destination.toUpperCase()) {
        errors.push('Origen y destino no pueden ser iguales');
    }

    const cabinValidation = validateCabinCode(data.cabinCode);
    if (!cabinValidation.isValid) errors.push(...cabinValidation.errors);

    const paxValidation = validatePassengers(data.passengers);
    if (!paxValidation.isValid) errors.push(...paxValidation.errors);

    if (typeof data.roundTrip !== 'boolean') {
        errors.push('roundTrip debe ser true o false');
    }

    return { isValid: errors.length === 0, errors };
}

function validateIataCode(code, fieldName) {
    const errors = [];
    if (!code) {
        errors.push(`${fieldName} es requerido`);
        return { isValid: false, errors };
    }
    if (typeof code !== 'string' || !/^[A-Za-z]{3}$/.test(code.trim())) {
        errors.push(`${fieldName} debe ser un código IATA válido (3 letras)`);
    }
    return { isValid: errors.length === 0, errors };
}

function validateCabinCode(cabinCode) {
    const errors = [];
    if (!cabinCode) {
        errors.push('cabinCode es requerido');
        return { isValid: false, errors };
    }
    const normalizedCode = cabinCode.toLowerCase().trim();
    if (!VALID_CABIN_CODES.includes(normalizedCode)) {
        errors.push(`cabinCode inválido. Valores permitidos: ${VALID_CABIN_CODES.join(', ')}`);
    }
    return { isValid: errors.length === 0, errors };
}

function validatePassengers(passengers) {
    const errors = [];
    if (passengers === undefined || passengers === null) {
        errors.push('passengers es requerido');
        return { isValid: false, errors };
    }
    const pax = parseInt(passengers, 10);
    if (isNaN(pax)) {
        errors.push('passengers debe ser un número');
        return { isValid: false, errors };
    }
    if (pax < VALIDATION_LIMITS.MIN_PASSENGERS) {
        errors.push(`passengers debe ser al menos ${VALIDATION_LIMITS.MIN_PASSENGERS}`);
    }
    if (pax > VALIDATION_LIMITS.MAX_PASSENGERS) {
        errors.push(`passengers no puede exceder ${VALIDATION_LIMITS.MAX_PASSENGERS}`);
    }
    return { isValid: errors.length === 0, errors };
}

module.exports = {
    validateCalculationRequest,
    validateIataCode,
    validateCabinCode,
    validatePassengers
};