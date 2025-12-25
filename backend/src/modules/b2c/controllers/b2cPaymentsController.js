/**
 * B2C Payments Controller - Stripe Integration
 * 
 * Endpoints:
 * - POST /api/b2c/payments/create-checkout    - Crear sesión de pago
 * - POST /api/b2c/payments/webhook            - Webhook de Stripe
 * - GET  /api/b2c/payments/history            - Historial de pagos
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Crear sesión de checkout con Stripe
 * POST /api/b2c/payments/create-checkout
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'clp', flightData, userEmail, userName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto es requerido y debe ser mayor a 0'
      });
    }

    // Validar que Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('⚠️ Stripe no configurado - Modo Demo');
      // Modo demo: retornar éxito simulado
      return res.json({
        success: true,
        mode: 'demo',
        message: 'Stripe no configurado. Simulando pago exitoso.',
        paymentId: `demo_${Date.now()}`,
        certificateId: `CERT-DEMO-${Date.now()}`
      });
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Compensación de Huella de Carbono',
              description: flightData ? 
                `Vuelo ${flightData.origin?.code} → ${flightData.destination?.code} | ${flightData.emissions?.kgCO2e?.toLocaleString()} kg CO₂` :
                'Compensación de emisiones de CO₂',
              images: ['https://compensatuviaje.cl/images/carbon-offset.png'],
              metadata: {
                type: 'carbon_offset',
                origin: flightData?.origin?.code,
                destination: flightData?.destination?.code,
                co2_kg: flightData?.emissions?.kgCO2e?.toString()
              }
            },
            unit_amount: Math.round(amount), // En centavos para USD, en pesos para CLP
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.b2cUser?.id,
        userEmail: userEmail,
        flightData: JSON.stringify(flightData),
        type: 'b2c_compensation'
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/b2c/certificates?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/calculator?payment=cancelled`,
    });

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Si Stripe falla, ofrecer modo demo
    if (error.type === 'StripeAuthenticationError' || error.type === 'StripeInvalidRequestError') {
      return res.json({
        success: true,
        mode: 'demo',
        message: 'Procesando en modo demo',
        paymentId: `demo_${Date.now()}`,
        certificateId: `CERT-DEMO-${Date.now()}`
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al crear sesión de pago',
      error: error.message
    });
  }
};

/**
 * Webhook de Stripe para procesar eventos
 * POST /api/b2c/payments/webhook
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verificar el evento con el webhook secret
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Sin verificación en desarrollo
      event = req.body;
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        console.log('💰 Pago exitoso:', event.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('❌ Pago fallido:', event.data.object.id);
        break;
        
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Procesar checkout completado
 */
const handleCheckoutCompleted = async (session) => {
  console.log('✅ Checkout completado:', session.id);
  
  const metadata = session.metadata;
  const flightData = metadata.flightData ? JSON.parse(metadata.flightData) : null;
  
  // TODO: Crear certificado en base de datos
  // TODO: Enviar email de confirmación
  // TODO: Actualizar estadísticas del usuario
  
  console.log('📋 Datos del vuelo:', flightData);
  console.log('👤 Usuario:', metadata.userEmail);
};

/**
 * Obtener historial de pagos del usuario
 * GET /api/b2c/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    // TODO: Implementar consulta a base de datos
    // Por ahora retornar datos de ejemplo
    
    const payments = [
      {
        id: 'pay_example_1',
        date: new Date().toISOString(),
        amount: 15000,
        currency: 'CLP',
        status: 'completed',
        certificateId: 'CERT-2024-001',
        flightRoute: 'SCL → MIA',
        co2Compensated: 2.45
      }
    ];

    return res.json({
      success: true,
      payments,
      total: payments.length
    });

  } catch (error) {
    console.error('Error getting payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pagos',
      error: error.message
    });
  }
};

/**
 * Verificar estado de un pago
 * GET /api/b2c/payments/:sessionId/status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        success: true,
        mode: 'demo',
        status: 'completed',
        message: 'Pago completado (modo demo)'
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      success: true,
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estado del pago',
      error: error.message
    });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getPaymentStatus
};
