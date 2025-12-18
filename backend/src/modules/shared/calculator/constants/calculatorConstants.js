const PRECIO_TONELADA_CLP = 15990;
const USD_CLP_RATE = 980;

const IMPACT_RATIOS = {
    TREES: 1.0,
    WATER_LITERS: 800.0,
    HOUSING_M2: 0.08,
    TEXTILE_KG: 9.0
};

const CABIN_CODE_TO_UUID = {
    'economy': 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122',
    'premium_economy': '1bd32cf8-98f2-4e32-9565-1afa9d5c7dc6',
    'business': '02ede58b-8830-42bf-977b-2231f8e08900',
    'first': '3aec2d36-640b-4c0d-8d71-114d0f9a3993'
};

const VALID_CABIN_CODES = Object.keys(CABIN_CODE_TO_UUID);

const EMISSION_FACTORS = {
    'Domestic': {
        'economy': 0.22928,
        'premium_economy': 0.22928,
        'business': 0.22928,
        'first': 0.22928
    },
    'Short-haul': {
        'economy': 0.12576,
        'premium_economy': 0.18863,
        'business': 0.18863,
        'first': 0.18863
    },
    'Long-haul': {
        'economy': 0.11704,
        'premium_economy': 0.18726,
        'business': 0.33940,
        'first': 0.46814
    }
};

const DISTANCE_THRESHOLDS = {
    DOMESTIC_MAX: 500,
    SHORT_HAUL_MAX: 3700
};

const VALIDATION_LIMITS = {
    MIN_PASSENGERS: 1,
    MAX_PASSENGERS: 50
};

module.exports = {
    PRECIO_TONELADA_CLP,
    USD_CLP_RATE,
    IMPACT_RATIOS,
    CABIN_CODE_TO_UUID,
    VALID_CABIN_CODES,
    EMISSION_FACTORS,
    DISTANCE_THRESHOLDS,
    VALIDATION_LIMITS
};
