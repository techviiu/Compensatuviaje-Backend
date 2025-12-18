const { DISTANCE_THRESHOLDS } = require('../constants/calculatorConstants');

function getHaulType(distanceKm) {
    if (distanceKm < DISTANCE_THRESHOLDS.DOMESTIC_MAX) {
        return 'Domestic';
    }
    if (distanceKm < DISTANCE_THRESHOLDS.SHORT_HAUL_MAX) {
        return 'Short-haul';
    }
    return 'Long-haul';
}

module.exports = { getHaulType };