const emissionCalculatorService = require('../services/emissionCalculatorService');
const { validateCalculationRequest } = require('../validators/calculatorValidator');

async function calculateEstimate(req, res) {
    try {
        const { origin, destination, cabinCode, passengers, roundTrip, userId } = req.body;

        const validation = validateCalculationRequest({ origin, destination, cabinCode, passengers, roundTrip });

        if (!validation.isValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Datos de entrada inválidos',
                errors: validation.errors
            });
        }

        const result = await emissionCalculatorService.calculate({
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            cabinCode: cabinCode.toLowerCase(),
            passengers: parseInt(passengers, 10),
            roundTrip: Boolean(roundTrip)
        });

        if (userId) {
            emissionCalculatorService.saveCalculation(userId, result, {
                origin, destination, cabinCode, passengers, roundTrip
            }).catch(err => console.error('Error saving:', err));
        }

        return res.json(result);

    } catch (error) {
        console.error('Error en calculadora:', error);
        
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ status: 'error', message: error.message });
        }

        return res.status(500).json({ status: 'error', message: 'Error interno al calcular emisiones' });
    }
}

module.exports = { calculateEstimate };