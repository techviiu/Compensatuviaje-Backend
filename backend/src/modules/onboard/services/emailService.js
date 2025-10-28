/**
 * 
 * Funciones:
 * - Notificaciones proceso onboarding
 * - Templates dinámicos de email
 * - Seguimiento de envíos
 * - Configuración SMTP
 */

const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

// Configuración SMTP
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  from: {
    name: process.env.FROM_NAME || 'CompensaTuViaje',
    address: process.env.FROM_EMAIL || 'noreply@compensatuviaje.com'
  }
};

// Crear transporter de nodemailer
let transporter = null;

/**
 * Inicializar transporter de email
 */
const initializeTransporter = () => {
  if (!transporter) {
     transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure === 'true',
      auth: {
           user: EMAIL_CONFIG.auth.user,
          pass: EMAIL_CONFIG.auth.pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Error verificando conexión SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar correos");
  }
});
  return transporter;
};

/**
 * Enviar email de bienvenida tras registro
 * @param {Object} company - Datos de la empresa
 * @param {Object} adminUser - Datos del usuario administrador
 * @returns {Object} Resultado del envío
 */
const sendWelcomeEmail = async (company, adminUser) => {
  try {
    const emailData = {
      to: adminUser.email,
      subject: '¡Bienvenido a CompensaTuViaje! - Registro Exitoso',
      template: 'welcome',
      data: {
        companyName: company.razonSocial,
        adminName: adminUser.name,
        companyRut: company.rut,
        nextSteps: [
          'Completa la documentación legal requerida',
          'Verifica tu dominio corporativo',
          'Espera la aprobación de nuestro equipo'
        ],
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: 'soporte@compensatuviaje.com'
      }
    };
    console.log("❌ ESto lo que que tengo en sendWelcomeEmail", emailData);
    
    return await sendEmail(emailData);

  } catch (error) {
    logger.error('Error enviando email de bienvenida', { 
      error: error.message, 
      companyId: company.id 
    });
    throw error;
  }
};

/**
 * Enviar notificación de cambio de estado
 * @param {Object} company - Datos de la empresa
 * @param {string} fromStatus - Estado anterior
 * @param {string} toStatus - Nuevo estado
 * @param {string} note - Nota adicional
 * @returns {Object} Resultado del envío
 */
const sendStatusChangeEmail = async (company, fromStatus, toStatus, note = null) => {
  try {
    // Obtener emails de admins de la empresa
    const adminUsers = await prisma.companyUser.findMany({
      where: {
        companyId: company.id,
        isAdmin: true,
        status: 'active'
      },
      include: {
        user: true
      }
    });

    const statusMessages = {
      'pending_contract': {
        subject: 'Documentos Recibidos - Revisión en Proceso',
        message: 'Hemos recibido tu documentación y está siendo revisada por nuestro equipo.'
      },
      'signed': {
        subject: '¡Contrato Aprobado! - Casi Listos',
        message: 'Tu documentación ha sido aprobada. Procesaremos la activación de tu cuenta.'
      },
      'active': {
        subject: '🎉 ¡Cuenta Activada! - Ya Puedes Usar CompensaTuViaje',
        message: 'Tu cuenta está activa. Ya puedes comenzar a cargar manifiestos y calcular emisiones.'
      },
      'suspended': {
        subject: 'Cuenta Suspendida - Acción Requerida',
        message: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.'
      }
    };

    const statusInfo = statusMessages[toStatus];
    if (!statusInfo) {
      logger.warn('Estado desconocido para email', { toStatus });
      return;
    }

    const emailPromises = adminUsers.map(companyUser => {
      const emailData = {
        to: companyUser.user.email,
        subject: statusInfo.subject,
        template: 'status-change',
        data: {
          companyName: company.razonSocial,
          userName: companyUser.user.name,
          fromStatus,
          toStatus,
          message: statusInfo.message,
          note,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          supportEmail: 'soporte@compensatuviaje.com'
        }
      };

      return sendEmail(emailData);
    });

    const results = await Promise.allSettled(emailPromises);
    
    logger.info('Emails de cambio de estado enviados', { 
      companyId: company.id, 
      toStatus, 
      emailsSent: results.filter(r => r.status === 'fulfilled').length 
    });

    return results;

  } catch (error) {
    logger.error('Error enviando emails de cambio de estado', { 
      error: error.message, 
      companyId: company.id, 
      toStatus 
    });
    throw error;
  }
};

/**
 * Enviar recordatorio de documentos faltantes
 * @param {Object} company - Datos de la empresa
 * @param {Array} missingDocuments - Lista de documentos faltantes
 * @returns {Object} Resultado del envío
 */
const sendDocumentReminderEmail = async (company, missingDocuments) => {
  try {
    const adminUsers = await prisma.companyUser.findMany({
      where: {
        companyId: company.id,
        isAdmin: true,
        status: 'active'
      },
      include: {
        user: true
      }
    });

    const emailPromises = adminUsers.map(companyUser => {
      const emailData = {
        to: companyUser.user.email,
        subject: 'Documentos Pendientes - CompensaTuViaje',
        template: 'document-reminder',
        data: {
          companyName: company.razonSocial,
          userName: companyUser.user.name,
          missingDocuments: missingDocuments.map(doc => doc.name),
          uploadUrl: `${process.env.FRONTEND_URL}/onboard/documents`,
          supportEmail: 'soporte@compensatuviaje.com'
        }
      };

      return sendEmail(emailData);
    });

    await Promise.allSettled(emailPromises);
    
    logger.info('Recordatorios de documentos enviados', { 
      companyId: company.id,
      missingCount: missingDocuments.length
    });

  } catch (error) {
    logger.error('Error enviando recordatorios de documentos', { 
      error: error.message, 
      companyId: company.id 
    });
    throw error;
  }
};

/**
 * Función base para enviar emails
 * @param {Object} emailData - Datos del email
 * @returns {Object} Resultado del envío
 */
const sendEmail = async (emailData) => {
  try {
    console.log("❌ Esto lo que tengo en sendEmail", emailData);
    
    const transport = initializeTransporter();

    // Generar HTML desde template
    const html = generateEmailTemplate(emailData.template, emailData.data);

    const mailOptions = {
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.address}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: html,
      text: stripHtmlTags(html) // Versión texto plano
    };

    const result = await transport.sendMail(mailOptions);

    logger.info('Email enviado exitosamente', { 
      to: emailData.to, 
      subject: emailData.subject,
      messageId: result.messageId
    });

    return {
      success: true,
      messageId: result.messageId,
      to: emailData.to
    };

  } catch (error) {
    logger.error('Error enviando email', { 
      error: error.message, 
      to: emailData.to 
    });
    
    return {
      success: false,
      error: error.message,
      to: emailData.to
    };
  }
};

/**
 * Generar HTML desde templates
 * @param {string} templateName - Nombre del template
 * @param {Object} data - Datos para el template
 * @returns {string} HTML generado
 */
const generateEmailTemplate = (templateName, data) => {
  const templates = {
    'welcome': generateWelcomeTemplate,
    'status-change': generateStatusChangeTemplate,
    'document-reminder': generateDocumentReminderTemplate
  };

  console.log("👌 Esto es lo que tengo en generateEmailTemplate:", templateName, data);

  const selectedTemplate = templates[templateName] || generateDefaultTemplate;
  return selectedTemplate(data);
};


/**
 * Template de bienvenida
 * (se va cambiar por templates mjml)
 */


const generateWelcomeTemplate = (data) => {


  console.log("este es dato de email wecome: ", data);
  


  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bienvenido a CompensaTuViaje</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2E8B57;">¡Bienvenido a CompensaTuViaje!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2>Hola ${data.adminName},</h2>
            <p>¡Gracias por registrar <strong>${data.companyName}</strong> en CompensaTuViaje!</p>
            <p>Tu registro ha sido exitoso con RUT: <strong>${data.companyRut}</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3>Próximos pasos:</h3>
            <ol>
               ${(data.nextSteps || []).map(step => `<li>${step}</li>`).join('')} 
            </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" 
               style="background-color: #2E8B57; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                Iniciar Sesión
            </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666;">
            <p>¿Necesitas ayuda? Contacta a <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
            <p style="font-size: 12px;">CompensaTuViaje - Compensación de Emisiones CO₂</p>
        </div>
    </div>
</body>
</html>`
}
;

/**
 * Template de cambio de estado
 */
const generateStatusChangeTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Actualización de Estado - CompensaTuViaje</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2E8B57;">CompensaTuViaje</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2>Hola ${data.userName},</h2>
            <p>Hay una actualización en el estado de tu empresa <strong>${data.companyName}</strong>.</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p><strong>Estado anterior:</strong> ${data.fromStatus}</p>
            <p><strong>Nuevo estado:</strong> ${data.toStatus}</p>
            <p><strong>Mensaje:</strong> ${data.message}</p>
            ${data.note ? `<p><strong>Nota:</strong> ${data.note}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" 
               style="background-color: #2E8B57; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                Ver Dashboard
            </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666;">
            <p>¿Necesitas ayuda? Contacta a <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Template de recordatorio de documentos
 */
const generateDocumentReminderTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Documentos Pendientes - CompensaTuViaje</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2E8B57;">CompensaTuViaje</h1>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h2>Documentos Pendientes</h2>
            <p>Hola ${data.userName},</p>
            <p>Para completar el proceso de registro de <strong>${data.companyName}</strong>, 
               aún necesitamos los siguientes documentos:</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <ul>
                ${data.missingDocuments.map(doc => `<li style="margin-bottom: 5px;">${doc}</li>`).join('')}
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.uploadUrl}" 
               style="background-color: #ffc107; color: #212529; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
                Subir Documentos
            </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666;">
            <p>¿Necesitas ayuda? Contacta a <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Template por defecto
 */
const generateDefaultTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CompensaTuViaje</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2E8B57;">CompensaTuViaje</h1>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    </div>
</body>
</html>
`;

/**
 * Remover tags HTML para versión texto
 * @param {string} html - HTML a limpiar
 * @returns {string} Texto plano
 */
const stripHtmlTags = (html) => {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

/**
 * Verificar configuración de email
 * @returns {Object} Estado de la configuración
 */
const verifyEmailConfig = async () => {
  try {
    const transport = initializeTransporter();
    const verified = await transport.verify();
    
    logger.info('Configuración de email verificada', { verified });
    
    return {
      isConfigured: verified,
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      hasAuth: !!(EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass)
    };
    
  } catch (error) {
    logger.error('Error verificando configuración de email', { error: error.message });
    
    return {
      isConfigured: false,
      error: error.message
    };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendStatusChangeEmail,
  sendDocumentReminderEmail,
  verifyEmailConfig
};