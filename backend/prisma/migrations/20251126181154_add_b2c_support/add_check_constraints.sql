-- =============================================
-- CHECK CONSTRAINTS para Nullable FKs Exclusivas
-- Garantizan que exactamente UNO de los dos campos tenga valor
-- =============================================

-- Payments: company_id XOR b2c_user_id
ALTER TABLE "payments" 
ADD CONSTRAINT "chk_payment_owner_exclusive" 
CHECK (
  (company_id IS NOT NULL AND b2c_user_id IS NULL) OR 
  (company_id IS NULL AND b2c_user_id IS NOT NULL)
);

-- Certificates: company_id XOR b2c_user_id  
ALTER TABLE "certificates" 
ADD CONSTRAINT "chk_certificate_owner_exclusive" 
CHECK (
  (company_id IS NOT NULL AND b2c_user_id IS NULL) OR 
  (company_id IS NULL AND b2c_user_id IS NOT NULL)
);

-- Certificate Requests: company_id XOR b2c_user_id
ALTER TABLE "certificate_requests" 
ADD CONSTRAINT "chk_certificate_request_owner_exclusive" 
CHECK (
  (company_id IS NOT NULL AND b2c_user_id IS NULL) OR 
  (company_id IS NULL AND b2c_user_id IS NOT NULL)
);

-- Share Events: company_id XOR b2c_user_id
ALTER TABLE "share_events" 
ADD CONSTRAINT "chk_share_event_owner_exclusive" 
CHECK (
  (company_id IS NOT NULL AND b2c_user_id IS NULL) OR 
  (company_id IS NULL AND b2c_user_id IS NOT NULL)
);

-- =============================================
-- COMENTARIOS en tablas para documentación
-- =============================================

COMMENT ON COLUMN payments.company_id IS 'FK a companies (B2B) - Mutuamente exclusiva con b2c_user_id';
COMMENT ON COLUMN payments.b2c_user_id IS 'FK a b2c_users (B2C) - Mutuamente exclusiva con company_id';

COMMENT ON COLUMN certificates.company_id IS 'FK a companies (B2B) - Mutuamente exclusiva con b2c_user_id';
COMMENT ON COLUMN certificates.b2c_user_id IS 'FK a b2c_users (B2C) - Mutuamente exclusiva con company_id';

COMMENT ON COLUMN certificate_requests.company_id IS 'FK a companies (B2B) - Mutuamente exclusiva con b2c_user_id';
COMMENT ON COLUMN certificate_requests.b2c_user_id IS 'FK a b2c_users (B2C) - Mutuamente exclusiva con company_id';

COMMENT ON COLUMN share_events.company_id IS 'FK a companies (B2B) - Mutuamente exclusiva con b2c_user_id';
COMMENT ON COLUMN share_events.b2c_user_id IS 'FK a b2c_users (B2C) - Mutuamente exclusiva con company_id';

COMMENT ON TABLE b2c_users IS 'Usuarios individuales B2C - Auth via Supabase/Google';
COMMENT ON TABLE b2c_calculations IS 'Cálculos de emisiones individuales B2C';
COMMENT ON TABLE b2c_user_badges IS 'Badges ganados por usuarios B2C';
COMMENT ON TABLE b2c_ranking_snapshots IS 'Rankings periódicos de usuarios B2C';
COMMENT ON TABLE b2c_saved_trips IS 'Viajes guardados con múltiples tramos';
