const { PrismaClient } = require('@prisma/client');
const Fuse = require('fuse.js');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();



 /**
     * Buscar aeropuertos (fuzzy search)
     * @param {string} query - Texto de búsqueda @
     * @param {number} limit - Máximo de resultados
     * @returns {Promise<Array>} Lista de aeropuertos
*/
class AirportSearchService{
    constructor(){
        this.airportsCache = null;
        this.fuseInstance = null;
    }
    async loadCacheOneTime(){
        if(this.airportsCache !== null){
            return 
        }
        logger.info('Cargando aeropuesto en cache... (memoria)');

        const airports = await prisma.airport.findMany({
            select : {
                id: true,
                code: true,
                name: true,
                city: true,
                country: true,
                lat: true,
                lon: true
            },
            orderBy: {code: 'asc'}
        });

        logger.info('ya estoy en los airports');

        this.airportsCache = airports.map(airport => ({
            ...airport,
            lat: Number(airport.lat),
            lon: Number(airport.lon),
            label: `${airport.city} (${airport.code}) - ${airport.country}`
        }));

        this.fuseInstance = new Fuse(this.airportsCache, {
            keys: [
                {name: 'code', weight: 3},
                {name: 'city', weight: 2},
                {name: 'country', weight: 1},
                {name: 'name', weight: 0.5}
            ],
            threshold: 0.4,
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 2
        });
        logger.info(`Cache listo: ${this.airportsCache.length} aeropuetos`)
    }

    async searchAirports(query, limit = 15){
        await this.loadCacheOneTime();

        if(!query || query.trim().length < 2){
            return this.airportsCache.slice(0, limit);
        }

        const cleanQuery = query.trim();
        if (cleanQuery.length === 3 && /^[A-Za-z]{3}$/.test(cleanQuery)) {
            const upperQuery = cleanQuery.toUpperCase();
        
        // Buscar código exacto primero
        const exactMatch = this.airportsCache.find(a => a.code === upperQuery);
        
        if (exactMatch) {
            // Si encontramos match exacto, devolver solo ese
            return [exactMatch];
        }
    }

        const results = this.fuseInstance.search(cleanQuery, {limit});

        return results.map(result => result.item);
    }

    /**
     * Obtener aeropuerto por código IATA exacto
     * @param {string} code - Código IATA (ej: "SCL")
     * @returns {Promise<Object|null>}
     */
    async getAirportByCode(code) {
        await this.loadCache();

        const upperCode = code.trim().toUpperCase();
        return this.airportsCache.find(a => a.code === upperCode) || null;
    }



    /**
     * Obtener aeropuerto por código IATA exacto
     * @param {string} code - Código IATA (ej: "SCL")
     * @returns {Promise<Object|null>}
     */

    async reloadCache(){
        this.airportsCache = null;
        this.fuseInstance = null;
        await this.loadCacheOneTime();
    }

}

module.exports = new AirportSearchService();