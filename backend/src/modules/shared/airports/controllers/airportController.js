const { log, error } = require('console');
const airportSearchService = require('../services/airportsSearchService');
const airportValidator = require('../validators/airportValidator');

/**
 * Buscar aeropuertos (fuzzy search)
 * GET /api/public/airports/search?q=santiago&limit=10
 */

async function searchAirports(req, res){
   try {
        const queryValidation = airportValidator.validateSearchQuery(req.query.q);
        if(!queryValidation.isValid){
            return res.status(400).json({
                success: false,
                errors: queryValidation.errors
            }
            );
        }
        const limitValidationi = airportValidator.validateLimit(req.query.limit);
        const limit = limitValidationi.valueOf;

        const airports = await airportSearchService.searchAirports(queryValidation.sanitized, limit);

        res.json({
            success: true,
            count: airports.count,
            query: queryValidation.sanitized,
            data: airports
        });
   } catch (error) {
        console.log('Error buscando aeropuestos');
        res.status(500).json({
            success: false,
            message: 'Error en el servidor buscando aeropuertos'
        });
   } 
}

/**
 * Obtener aeropuerto por código
 * GET /api/public/airports/:code
 */

async function getByCode(req, res){
    try {
       const validation = airportValidator.validateIataCode(req.params.code);
       if(!validation.isValid){
        return res.status(400).json({
            success: false,
            errors: validation.errors
        })
       }

       const airport = await airportSearchService.getAirportByCode(validation.sanitized);


       if(!airport){
        return res.status(404).json({
            success: false,
            message: `Aeropuerto "${req.params.code.toUpperCase()} " no econtrado`
        })
       }

       res.json({
        success: true,
        data: airport,
       })
    } catch (error) {
        
    }
}

module.exports = {
    searchAirports,
    getByCode
}