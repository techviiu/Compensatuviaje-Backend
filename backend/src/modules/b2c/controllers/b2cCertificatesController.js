/**
 * B2C Certificates Controller
 * 
 * Endpoints:
 * - GET  /api/b2c/certificates              - Listar certificados del usuario
 * - GET  /api/b2c/certificates/:id          - Obtener un certificado
 * - GET  /api/b2c/certificates/:id/download - Descargar certificado PDF
 */

/**
 * Listar certificados del usuario
 * GET /api/b2c/certificates
 */
const listCertificates = async (req, res) => {
  try {
    const userId = req.b2cUser?.id;
    
    // TODO: Implementar consulta a base de datos
    // Por ahora retornar datos de ejemplo
    const certificates = [
      {
        id: 'CERT-2024-001',
        certificateNumber: 'CERT-2024-SCL-MIA-001',
        date: new Date().toISOString(),
        co2Compensated: 2.45,
        project: 'Reforestación Amazonía',
        flightRoute: 'SCL → MIA',
        status: 'verified',
        equivalencies: {
          trees: 122,
          water: 12250
        }
      },
      {
        id: 'CERT-2024-002',
        certificateNumber: 'CERT-2024-MIA-JFK-002',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        co2Compensated: 1.8,
        project: 'Eólica Marina',
        flightRoute: 'MIA → JFK',
        status: 'verified',
        equivalencies: {
          trees: 90,
          water: 9000
        }
      }
    ];

    return res.json({
      success: true,
      certificates,
      total: certificates.length,
      totalCO2Compensated: certificates.reduce((sum, c) => sum + c.co2Compensated, 0)
    });

  } catch (error) {
    console.error('Error listing certificates:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener certificados',
      error: error.message
    });
  }
};

/**
 * Obtener un certificado específico
 * GET /api/b2c/certificates/:id
 */
const getCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implementar consulta a base de datos
    const certificate = {
      id,
      certificateNumber: `CERT-2024-${id}`,
      date: new Date().toISOString(),
      co2Compensated: 2.45,
      project: {
        name: 'Reforestación Amazonía',
        location: 'Brasil',
        type: 'reforestation',
        standard: 'Gold Standard'
      },
      flight: {
        origin: { code: 'SCL', city: 'Santiago', country: 'Chile' },
        destination: { code: 'MIA', city: 'Miami', country: 'USA' },
        distance: 7200,
        passengers: 1,
        cabinClass: 'economy'
      },
      user: {
        name: req.b2cUser?.nombre || 'Usuario',
        email: req.b2cUser?.email
      },
      status: 'verified',
      verificationCode: `VER-${Date.now()}`,
      equivalencies: {
        trees: 122,
        waterLiters: 12250,
        housingM2: 45,
        textileKg: 89
      }
    };

    return res.json({
      success: true,
      certificate
    });

  } catch (error) {
    console.error('Error getting certificate:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener certificado',
      error: error.message
    });
  }
};

/**
 * Generar y descargar certificado PDF
 * GET /api/b2c/certificates/:id/download
 */
const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Datos del certificado
    const certificate = {
      id,
      certificateNumber: `CERT-2024-${id}`,
      date: new Date(),
      co2Compensated: 2.45,
      project: 'Reforestación Amazonía',
      user: req.b2cUser?.nombre || 'Usuario',
      flightRoute: 'SCL → MIA',
      verificationCode: `VER-${Date.now()}`
    };

    // Generar HTML del certificado
    const certificateHtml = generateCertificateHTML(certificate);
    
    // Por ahora, retornar HTML como respuesta
    // TODO: Convertir a PDF usando puppeteer o similar
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${id}.html"`);
    
    return res.send(certificateHtml);

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al descargar certificado',
      error: error.message
    });
  }
};

/**
 * Generar HTML del certificado
 */
function generateCertificateHTML(cert) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Compensación - ${cert.certificateNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .certificate {
      background: white;
      max-width: 800px;
      width: 100%;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      overflow: hidden;
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #22c55e, #059669, #10b981);
    }
    .header {
      background: linear-gradient(135deg, #22c55e 0%, #059669 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
    .header p { font-size: 1.1rem; opacity: 0.9; }
    .logo { font-size: 4rem; margin-bottom: 20px; }
    .content { padding: 40px; }
    .recipient {
      text-align: center;
      margin-bottom: 30px;
    }
    .recipient h2 {
      font-size: 2rem;
      color: #059669;
      margin-bottom: 10px;
    }
    .recipient p { color: #6b7280; }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #22c55e;
    }
    .stat-label { color: #6b7280; font-size: 0.9rem; }
    .details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .details h3 {
      color: #374151;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 500; color: #374151; }
    .footer {
      text-align: center;
      padding: 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .verification {
      font-family: monospace;
      color: #059669;
      background: #ecfdf5;
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
    }
    .qr-placeholder {
      width: 100px;
      height: 100px;
      background: #e5e7eb;
      border-radius: 8px;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">🌿</div>
      <h1>Certificado de Compensación</h1>
      <p>Huella de Carbono Neutralizada</p>
    </div>
    
    <div class="content">
      <div class="recipient">
        <p>Este certificado acredita que</p>
        <h2>${cert.user}</h2>
        <p>ha compensado exitosamente sus emisiones de carbono</p>
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${cert.co2Compensated} t</div>
          <div class="stat-label">CO₂ Compensado</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Math.round(cert.co2Compensated * 50)}</div>
          <div class="stat-label">Árboles Equivalentes</div>
        </div>
      </div>
      
      <div class="details">
        <h3>Detalles de la Compensación</h3>
        <div class="detail-row">
          <span class="detail-label">Número de Certificado</span>
          <span class="detail-value">${cert.certificateNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha de Emisión</span>
          <span class="detail-value">${cert.date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ruta del Vuelo</span>
          <span class="detail-value">${cert.flightRoute}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Proyecto Apoyado</span>
          <span class="detail-value">${cert.project}</span>
        </div>
      </div>
      
      <div class="qr-placeholder">QR</div>
    </div>
    
    <div class="footer">
      <p style="color: #6b7280; margin-bottom: 10px;">Código de Verificación</p>
      <div class="verification">${cert.verificationCode}</div>
      <p style="color: #9ca3af; margin-top: 15px; font-size: 0.85rem;">
        Verificable en compensatuviaje.cl/verify
      </p>
    </div>
  </div>
</body>
</html>
`;
}

module.exports = {
  listCertificates,
  getCertificate,
  downloadCertificate
};
