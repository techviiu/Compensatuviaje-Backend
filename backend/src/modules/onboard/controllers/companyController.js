
/**
 * 
 * Endpoints:
 * POST /api/onboard/companies - Registrar empresa
 * GET /api/onboard/companies/:id - Obtener empresa
 * PUT /api/onboard/companies/:id - Actualizar empresa
 * PUT /api/onboard/companies/:id/status - Cambiar estado
 * GET /api/onboard/companies - Listar empresas (admin)
 */

const companyService = require('../services/companyService');
const emailService = require('../services/emailService');
const {
        validateCompanyRegistration,
    validateCompanyUpdate,
    validateCompanyStatusChange,
    handleValidationErrors
} = require('../validators/onboardValidator')   
const logger = require('../../../utils/logger');

// Registrar nueva empresa con usuario administrador

const registerCompany = [
    ...validateCompanyRegistration,
    handleValidationErrors,
    async (req, res) =>{
        try{
            const {adminUser, ...companyData} = req.body;
            console.log('password a hashear:', typeof adminUser.password);

            // crear empresa con usuario admin
            const result = await companyService.createCompany(companyData, adminUser);

            // eviar email de vienvenida
            emailService.sendWelcomeEmail(result.company, result.user)
                .catch(error => {
                    logger.error('Error enviadno email de bienvenida', {
                        error: error.message,
                        companyId: result.company.id
                    });
                });
            res.status(201).json({
                success: true,
                message: 'Empresa registrada exitosamente',
                data: {
                    company: {
                        id: result.company.id,
                        razonSocial: result.company.razonSocial,
                        rut: result.company.rut,
                        slugPublico: result.company.status,
                        createAt: result.company.createAt
                    },
                    user: result.user,
                    nextSteps: [
                        'Verificar emial de bievenida',
                        'Completar documetacion legar',
                        'Verificar dominio coporativo',
                        'Esprera aprobacion de equipo'
                    ]
                }
            });

        }
        catch(error){
            logger.error('Error en registro de empresa', {
                error: error.message,
                body: req.body
            })

            if(error.message.includes('RUT inválido')){
                return res.status(400).json({
                    success: false,
                    message: 'RUT inválido',
                    error: error.message
                });
            }
            if(error.message.includes('ya existe')){
                return res.status(409).json({
                    success: false,
                    message: 'Empresa o usuario ya existe',
                    error: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        }
        
    }
];


/**
 * Obtener empresa por ID
 */

const getCompany = async (req, res) =>{
    try {
        const {id} = req.params;
        const includeUsers = req.query.includeUsers === 'true';

        const company = await companyService.getCompanyById(id, includeUsers)

        res.json({
            success: true,
            data: company
        })
        
    } catch (error) {
        logger.error('Error obteniendo empresa', { 
        error: error.message,
        companyId: req.params.id 
        });

        if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
            success: false,
            message: 'Empresa no encontrada'
        });
        }

        res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
        });
            
    }
}

// actualizar datos de empresa
// PUT /api/onboard/companies/:id

const updateCompany = [
    ...validateCompanyUpdate,
    handleValidationErrors,

    async(req, res) => {
        try {
            const {id} = req.params;
            const updateData = req.body;
            // esto biene del middleware 
            const userId = req.user.id;

            const updateCompany = await companyService.updateCompany(
                id,
                updateData,
                userId
            )

            res.json({
                success: true,
                message: 'Empresa actualizada exitosamente',
                data: updateCompany
            })

        } catch (error) {
            logger.error('Error actualizando empresa', { 
            rror: error.message,
            companyId: req.params.id 
            });

            if (error.message === 'Empresa no encontrada') {
                return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
                });
            }

            if (error.message.includes('slug')) {
                return res.status(409).json({
                success: false,
                message: 'El slug público ya está en uso'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
            
        }
    }
]


/**
 * Cambiar estado de empresa (solo admin)
 * PUT /api/onboard/companies/:id/status
 */

const changeCompanyStatus = [
    ...validateCompanyStatusChange,
    handleValidationErrors,

    async (req, res) =>{
        try {
            const {id} = req.params;
            const {toStatus, note} = req.body;
            const userId = req.user.id;
            
            // obtenemos la empresa
            const company = companyService.getCompanyById(id);
            const fromStatus = company.status;

            // cambiar estado
            const updateCompany = await companyService.changeCompanyStatus(
                id,
                toStatus,
                userId,
                note
            );

            // enviar notificación por email (async)
            emailService.sendStatusChangeEmail(company, fromStatus, toStatus, note)
                .catch(error => {
                    logger.error('Error envienado email de cambio de estado', {
                        error: error.message,
                        companyId: id
                    });
                });

                res.json({
                    success: true,
                    message: `Estado cambiado a ${toStatus}`,
                    data: {
                        company: updateCompany,
                        transition: {
                            from: fromStatus,
                            to: toStatus,
                            note
                        }

                    }
                })
            
        } catch (error) {

            logger.error('Error cambiando estado de empresa', { 
                error: error.message,
                companyId: req.params.id 
            });

            if (error.message === 'Empresa no encontrada') {
                return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada'
                });
            }

            if (error.message.includes('Transición')) {
                return res.status(400).json({
                success: false,
                message: 'Transición de estado inválida',
                error: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
]

/**
 * Lista empresass con filtros (solo superAdmin)
 * GET /api/omboard/companies
 */

const listCompanies = async (req, res) =>{
    try {
        const filters = {
            status: req.query.status,
            search: req.query.search,
            tamanoEmpresa: req.query.tamanoEmpresa
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        if(pagination.limit > 100){
            pagination.limit = 100;
        }

        const result = await companyService.getCompanies(filters, pagination);
        res.json({
            success: true,
            data: result.companies,
            pagination: result.pagination,
            filters: filters
        })
    } catch (error) {
        logger.error('Error listando empresas', { 
        error: error.message,
        query: req.query 
        });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
    }
}

/**
 * Obtener estadísticas de onboarding (solo suuperadmin)
 * GET api/onboard/companies/stats
 */

const getOnboardingStats = async (req, res) => {
    try {
        const stats = await companyService.getCompanies({}, {page:1, limit: 1000});

        // calculando estadísticas
        const statusCounts = stats.companies.reduce((acc, company) => {
            acc[company.stats] = (acc[company.status] || 0) + 1;

        }, {});

        const sizeDistribution = stats.companies.reduce((acc, company) => {
            const size = company.tamanoEmpresa || 'no_especificado';
            acc[size] = (acc[size] || 0) + 1;
            return acc;
        }, {})

        // empressa registradas por mes (ultimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const recentCompanies = stats.companies.filters(
            company => new Date(company.createAt)>= sixMonthsAgo
        );
        const monthlyRegistrations = recentCompanies.reduce((acc, company) =>{
            const month = new Date(company.createAt).toISOString().substring(0,7);
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {})

        res.json({
            success: true,
            data: {
                total: stats.pagination.totalRecords,
                byStatus: statusCounts,
                bySize: sizeDistribution,
                monthlyRegistrations,
                conversionFunner: {
                    registered: statusCounts.registered || 0,
                    pendingContract: statusCounts.pending_contract || 0,
                    signed: statusCounts.signed || 0,
                    active: statusCounts.active || 0,
                    suspended:  statusCounts.suspended || 0
                }
            }
        });

    } catch (error) {
        logger.error('Error obteniendo estadísticas', { error: error.message });

        res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
        });  
    }
}


module.exports = {
    registerCompany,
  getCompany,
  updateCompany,
  changeCompanyStatus,
  listCompanies,
  getOnboardingStats
}