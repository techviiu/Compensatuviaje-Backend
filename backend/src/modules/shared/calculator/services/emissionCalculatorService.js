const { PrismaClient } = require('@prisma/client');
const { calculateHaversine } = require('../utils/distanceCalculator');
const { getHaulType } = require('../utils/haulTypeClassifier');
const { calculateEquivalencies } = require('../utils/equivalenciesCalculator');
const { PRECIO_TONELADA_CLP, USD_CLP_RATE, EMISSION_FACTORS } = require('../constants/calculatorConstants');
const prisma = new PrismaClient();
class EmissionCalculatorService {
    constructor() {
        this.airportsCache = null;
    }

    async calculate({ origin, destination, cabinCode, passengers, roundTrip }) {
        const airports = await this.getAirportsCoordinates(origin, destination);

        const distanceOneWay = calculateHaversine(
            airports.origin.lat,
            airports.origin.lon,
            airports.destination.lat,
            airports.destination.lon
        );

        const distanceTotal = roundTrip ? distanceOneWay * 2 : distanceOneWay;
        const haulType = getHaulType(distanceOneWay);
        const emissionFactor = this.getEmissionFactor(haulType, cabinCode);

        const kgCO2 = distanceTotal * emissionFactor * passengers;
        const tonsCO2 = kgCO2 / 1000;

        const priceCLP = Math.round(tonsCO2 * PRECIO_TONELADA_CLP);
        const priceUSD = Number((priceCLP / USD_CLP_RATE).toFixed(2));

        const equivalencies = calculateEquivalencies(tonsCO2);

        return {
            status: 'success',
            meta: {
                tripType: roundTrip ? 'round_trip' : 'one_way',
                distanceKmOneWay: Number(distanceOneWay.toFixed(2)),
                distanceKmTotal: Number(distanceTotal.toFixed(2)),
                haulType: haulType,
                route: {
                    origin: {
                        code: airports.origin.code,
                        city: airports.origin.city,
                        country: airports.origin.country
                    },
                    destination: {
                        code: airports.destination.code,
                        city: airports.destination.city,
                        country: airports.destination.country
                    }
                }
            },
            emissions: {
                kgCO2e: Number(kgCO2.toFixed(2)),
                tonCO2e: Number(tonsCO2.toFixed(4)),
                factorUsed: emissionFactor,
                passengers: passengers
            },
            pricing: {
                currency: 'CLP',
                totalPriceCLP: priceCLP,
                totalPriceUSD: priceUSD,
                pricePerTonCLP: PRECIO_TONELADA_CLP,
                exchangeRateUsed: USD_CLP_RATE
            },
            equivalencies: equivalencies
        };
    }

    async getAirportsCoordinates(originCode, destCode) {
        if (!this.airportsCache) {
            await this.loadAirportsCache();
        }

        const origin = this.airportsCache[originCode.toUpperCase()];
        const destination = this.airportsCache[destCode.toUpperCase()];

        if (!origin) throw new Error(`Aeropuerto de origen "${originCode}" no encontrado`);
        if (!destination) throw new Error(`Aeropuerto de destino "${destCode}" no encontrado`);

        return { origin, destination };
    }

    async loadAirportsCache() {
        const airports = await prisma.airport.findMany({
            select: { id: true, code: true, name: true, city: true, country: true, lat: true, lon: true }
        });

        this.airportsCache = {};
        airports.forEach(airport => {
            this.airportsCache[airport.code] = {
                ...airport,
                lat: Number(airport.lat),
                lon: Number(airport.lon)
            };
        });
    }

    getEmissionFactor(haulType, cabinCode) {
        const normalizedCabin = cabinCode.toLowerCase().trim();
        const factors = EMISSION_FACTORS[haulType];
        
        if (!factors) throw new Error(`Tipo de vuelo "${haulType}" no reconocido`);

        const factor = factors[normalizedCabin];
        if (!factor) throw new Error(`Factor no encontrado para ${haulType}/${normalizedCabin}`);

        return factor;
    }

    async saveCalculation(userId, calculationResult, requestData) {
        try {
            await prisma.b2cCalculation.create({
                data: {
                    b2cUserId: userId,
                    originIata: requestData.origin.toUpperCase(),
                    destinationIata: requestData.destination.toUpperCase(),
                    distanceKm: calculationResult.meta.distanceKmTotal,
                    emissionsKg: calculationResult.emissions.kgCO2e,
                    serviceClass: requestData.cabinCode,
                    passengers: requestData.passengers,
                    isRoundTrip: requestData.roundTrip,
                    isCompensated: false,
                    calculationData: calculationResult
                }
            });
        } catch (error) {
            console.error('Error guardando cálculo:', error);
        }
    }
}

module.exports = new EmissionCalculatorService();