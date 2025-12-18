const { IMPACT_RATIOS } = require('../constants/calculatorConstants');

function calculateEquivalencies(tonsCO2) {
    return {
        trees: round(tonsCO2 * IMPACT_RATIOS.TREES, 1),
        waterLiters: round(tonsCO2 * IMPACT_RATIOS.WATER_LITERS, 0),
        housingM2: round(tonsCO2 * IMPACT_RATIOS.HOUSING_M2, 2),
        textileKg: round(tonsCO2 * IMPACT_RATIOS.TEXTILE_KG, 1)
    };
}

function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

module.exports = { calculateEquivalencies };