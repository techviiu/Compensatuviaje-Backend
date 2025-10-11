-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('REGISTERED', 'PENDING_CONTRACT', 'SIGNED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('UPLOADED', 'VALIDATING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ValidationStatus" AS ENUM ('PENDING', 'VALID', 'WARNING', 'INVALID');

-- CreateEnum
CREATE TYPE "public"."SeverityLevel" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CertificateStatus" AS ENUM ('DRAFT', 'ISSUED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."BadgeType" AS ENUM ('PERMANENT', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."LoginResult" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "public"."CalculationType" AS ENUM ('MANIFEST_UPLOAD', 'MINIMAL_INPUT');

-- CreateEnum
CREATE TYPE "public"."EmissionSource" AS ENUM ('INTERNAL_FACTORS', 'GOOGLE_TRAVEL_IMPACT_API', 'ICAO_CALCULATOR_API', 'MIXED_SOURCES');

-- CreateEnum
CREATE TYPE "public"."ProjectPricingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "public"."ApiProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "giro_sii" TEXT,
    "tamano_empresa" TEXT,
    "direccion" TEXT,
    "phone" TEXT,
    "slug_publico" TEXT,
    "public_profile_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "preferred_calculation_method" "public"."CalculationType" NOT NULL DEFAULT 'MINIMAL_INPUT',
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'REGISTERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_domains" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "public_tagline" TEXT,
    "public_banner_url" TEXT,
    "notifications_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_verification_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "from_status" "public"."CompanyStatus" NOT NULL,
    "to_status" "public"."CompanyStatus" NOT NULL,
    "noted_by_user_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_user_roles" (
    "id" TEXT NOT NULL,
    "company_user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_batches" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "rows_count" INTEGER,
    "status" "public"."BatchStatus" NOT NULL DEFAULT 'UPLOADED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manifest_files" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifest_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flight_records" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "calculation_type" "public"."CalculationType" NOT NULL,
    "flight_number" TEXT,
    "origin_airport_id" TEXT NOT NULL,
    "destination_airport_id" TEXT NOT NULL,
    "aircraft_model_id" TEXT,
    "class_breakdown" TEXT,
    "flight_date" TIMESTAMP(3) NOT NULL,
    "total_passengers" INTEGER NOT NULL,
    "distance_km" DECIMAL(65,30) NOT NULL,
    "computed_emissions" DECIMAL(65,30) NOT NULL,
    "confidence_score" DECIMAL(65,30) NOT NULL,
    "emission_source" "public"."EmissionSource" NOT NULL,
    "api_response_data" TEXT,
    "factors_version_id" TEXT,
    "validation_status" "public"."ValidationStatus" NOT NULL,
    "anomaly_flags" TEXT,
    "raw_row_ref" TEXT,
    "calculation_metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."record_validation_errors" (
    "id" TEXT NOT NULL,
    "flight_record_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "public"."SeverityLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_validation_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_runs" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "run_type" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "metrics_json" TEXT,
    "error_message" TEXT,

    CONSTRAINT "processing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."airports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DECIMAL(65,30) NOT NULL,
    "lon" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aircraft_models" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aircraft_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emission_factor_versions" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "factor_value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."route_distance_cache" (
    "id" TEXT NOT NULL,
    "origin_iata" TEXT NOT NULL,
    "destination_iata" TEXT NOT NULL,
    "origin_airport_id" TEXT NOT NULL,
    "destination_airport_id" TEXT NOT NULL,
    "distance_km" DECIMAL(65,30) NOT NULL,
    "source_api" TEXT NOT NULL,
    "confidence_score" DECIMAL(65,30) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "cache_hits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_distance_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quick_calculations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "route_origin" TEXT NOT NULL,
    "route_destination" TEXT NOT NULL,
    "aircraft_type" TEXT NOT NULL,
    "passengers_total" INTEGER NOT NULL,
    "estimated_class_distribution" TEXT,
    "distance_km" DECIMAL(65,30) NOT NULL,
    "emission_source" "public"."EmissionSource" NOT NULL,
    "total_co2_kg" DECIMAL(65,30) NOT NULL,
    "confidence_level" DECIMAL(65,30) NOT NULL,
    "calculation_date" TIMESTAMP(3) NOT NULL,
    "api_response_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emission_calculation_cache" (
    "id" TEXT NOT NULL,
    "route_cache_id" TEXT NOT NULL,
    "aircraft_type" TEXT NOT NULL,
    "passengers_range" TEXT NOT NULL,
    "emission_factor" DECIMAL(65,30) NOT NULL,
    "co2_total_kg" DECIMAL(65,30) NOT NULL,
    "api_source" TEXT NOT NULL,
    "confidence_score" DECIMAL(65,30) NOT NULL,
    "last_used" TIMESTAMP(3) NOT NULL,
    "use_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_calculation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anomaly_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_configurations" (
    "id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "endpoint_url" TEXT NOT NULL,
    "api_key_reference" TEXT NOT NULL,
    "rate_limit_per_hour" INTEGER NOT NULL,
    "timeout_ms" INTEGER NOT NULL DEFAULT 5000,
    "status" "public"."ApiProviderStatus" NOT NULL,
    "last_health_check" TIMESTAMP(3),
    "success_rate_24h" DECIMAL(65,30),
    "avg_response_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emission_summaries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "flights_count" INTEGER NOT NULL,
    "passengers" INTEGER NOT NULL,
    "distance_km" DECIMAL(65,30) NOT NULL,
    "emissions_tco2" DECIMAL(65,30) NOT NULL,
    "coverage_pct" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."route_summaries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "origin_airport_id" TEXT NOT NULL,
    "destination_airport_id" TEXT NOT NULL,
    "flights_count" INTEGER NOT NULL,
    "emissions_tco2" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."batch_summaries" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "metrics_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."esg_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "provider_organization" TEXT NOT NULL,
    "certification" TEXT,
    "co_benefits" TEXT,
    "current_base_price_usd_per_ton" DECIMAL(65,30),
    "transparency_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_pricing_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version_name" TEXT NOT NULL,
    "base_price_usd_per_ton" DECIMAL(65,30) NOT NULL,
    "compensa_margin_percent" DECIMAL(65,30) NOT NULL,
    "final_price_usd_per_ton" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "status" "public"."ProjectPricingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pricing_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."global_margin_config" (
    "id" TEXT NOT NULL,
    "default_margin_percent" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "applies_to_new_projects" BOOLEAN NOT NULL DEFAULT true,
    "override_existing_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_margin_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pricing_tiers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_tons" DECIMAL(65,30) NOT NULL,
    "max_tons" DECIMAL(65,30),
    "price_per_ton" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_pricing_overrides" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "pricing_tier_id" TEXT NOT NULL,
    "override_price" DECIMAL(65,30) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_pricing_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "folio" TEXT,
    "timbre" TEXT,
    "pdf_url" TEXT,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fx_rates" (
    "id" TEXT NOT NULL,
    "rate_date" TIMESTAMP(3) NOT NULL,
    "base_currency" TEXT NOT NULL,
    "quote_currency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compensation_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "tons_tco2" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "pricing_tier_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificate_requests" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "calculation_methods_breakdown" TEXT,
    "message" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "request_id" TEXT,
    "period_month" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "tons_compensated" DECIMAL(65,30) NOT NULL,
    "calculation_methods_breakdown" TEXT,
    "project_pricing_versions_used" TEXT,
    "weighted_avg_price_usd_per_ton" DECIMAL(65,30),
    "total_amount_usd" DECIMAL(65,30),
    "total_amount_clp" DECIMAL(65,30),
    "number" TEXT NOT NULL,
    "pdf_url" TEXT,
    "qr_code_url" TEXT,
    "status" "public"."CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificate_hashes" (
    "id" TEXT NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "hash_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_hashes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificate_projects" (
    "certificate_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "project_pricing_version_id" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "allocation_tons" DECIMAL(65,30) NOT NULL,
    "price_usd_per_ton" DECIMAL(65,30) NOT NULL,
    "amount_usd" DECIMAL(65,30) NOT NULL,
    "project_name_snapshot" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_projects_pkey" PRIMARY KEY ("certificate_id","project_id")
);

-- CreateTable
CREATE TABLE "public"."project_evidence" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "photo_url" TEXT,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_metrics" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(65,30) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_documents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_partners" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "partner_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ranking_snapshots" (
    "id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "company_id" TEXT NOT NULL,
    "compensated_tons" DECIMAL(65,30) NOT NULL,
    "coverage_pct" DECIMAL(65,30) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "segment" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."badge_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."BadgeType" NOT NULL,
    "min_threshold" DECIMAL(65,30),
    "percentile_rule" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_badges" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ranking_jobs" (
    "id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."share_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "certificate_id" TEXT,
    "network" TEXT NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL,
    "reach" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."share_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."widgets" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config_json" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_uploads" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_url" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entity_attachments" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "company_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "result" "public"."LoginResult" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_pricing_audit" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "old_version_id" TEXT,
    "new_version_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT,
    "old_values" TEXT,
    "new_values" TEXT NOT NULL,
    "affected_quotes_count" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pricing_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage_logs" (
    "id" TEXT NOT NULL,
    "api_configuration_id" TEXT NOT NULL,
    "company_id" TEXT,
    "request_type" TEXT NOT NULL,
    "request_params" TEXT,
    "response_status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "response_data_size_bytes" INTEGER,
    "cost_usd" DECIMAL(65,30),
    "cache_hit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_calculation_metrics" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "manifest_calculations_count" INTEGER NOT NULL DEFAULT 0,
    "quick_calculations_count" INTEGER NOT NULL DEFAULT 0,
    "total_api_calls" INTEGER NOT NULL DEFAULT 0,
    "avg_confidence_score" DECIMAL(65,30),
    "total_co2_calculated_tons" DECIMAL(65,30),
    "total_api_cost_usd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_calculation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhooks" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "event_types" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_logs" (
    "id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "request_body" TEXT,
    "response_body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs_queue" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_rut_key" ON "public"."companies"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_publico_key" ON "public"."companies"("slug_publico");

-- CreateIndex
CREATE UNIQUE INDEX "company_domains_company_id_domain_key" ON "public"."company_domains"("company_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "public"."company_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_id_user_id_key" ON "public"."company_users"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "public"."role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_user_roles_company_user_id_role_id_key" ON "public"."company_user_roles"("company_user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_files_batch_id_key" ON "public"."manifest_files"("batch_id");

-- CreateIndex
CREATE INDEX "flight_records_company_id_flight_date_idx" ON "public"."flight_records"("company_id", "flight_date");

-- CreateIndex
CREATE INDEX "flight_records_calculation_type_idx" ON "public"."flight_records"("calculation_type");

-- CreateIndex
CREATE UNIQUE INDEX "airports_code_key" ON "public"."airports"("code");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_models_code_key" ON "public"."aircraft_models"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_types_code_key" ON "public"."class_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "route_distance_cache_origin_iata_destination_iata_key" ON "public"."route_distance_cache"("origin_iata", "destination_iata");

-- CreateIndex
CREATE INDEX "quick_calculations_company_id_calculation_date_idx" ON "public"."quick_calculations"("company_id", "calculation_date");

-- CreateIndex
CREATE UNIQUE INDEX "emission_calculation_cache_route_cache_id_aircraft_type_pas_key" ON "public"."emission_calculation_cache"("route_cache_id", "aircraft_type", "passengers_range");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_rules_code_key" ON "public"."anomaly_rules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "emission_summaries_company_id_period_month_key" ON "public"."emission_summaries"("company_id", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "route_summaries_company_id_period_month_origin_airport_id_d_key" ON "public"."route_summaries"("company_id", "period_month", "origin_airport_id", "destination_airport_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_summaries_batch_id_key" ON "public"."batch_summaries"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "esg_projects_code_key" ON "public"."esg_projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_code_key" ON "public"."pricing_tiers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "public"."payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "public"."invoices"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_rate_date_base_currency_quote_currency_key" ON "public"."fx_rates"("rate_date", "base_currency", "quote_currency");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_number_key" ON "public"."certificates"("number");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_hashes_certificate_id_key" ON "public"."certificate_hashes"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_period_month_company_id_key" ON "public"."ranking_snapshots"("period_month", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "badge_definitions_code_key" ON "public"."badge_definitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_badges_company_id_badge_id_key" ON "public"."company_badges"("company_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_templates_code_key" ON "public"."share_templates"("code");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "api_usage_logs_company_id_created_at_idx" ON "public"."api_usage_logs"("company_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_calculation_metrics_company_id_period_month_key" ON "public"."company_calculation_metrics"("company_id", "period_month");

-- CreateIndex
CREATE INDEX "jobs_queue_status_scheduled_at_idx" ON "public"."jobs_queue"("status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_domains" ADD CONSTRAINT "company_domains_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_verification_events" ADD CONSTRAINT "company_verification_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_verification_events" ADD CONSTRAINT "company_verification_events_noted_by_user_id_fkey" FOREIGN KEY ("noted_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_user_roles" ADD CONSTRAINT "company_user_roles_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "public"."company_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_user_roles" ADD CONSTRAINT "company_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_batches" ADD CONSTRAINT "upload_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manifest_files" ADD CONSTRAINT "manifest_files_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_aircraft_model_id_fkey" FOREIGN KEY ("aircraft_model_id") REFERENCES "public"."aircraft_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_factors_version_id_fkey" FOREIGN KEY ("factors_version_id") REFERENCES "public"."emission_factor_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."record_validation_errors" ADD CONSTRAINT "record_validation_errors_flight_record_id_fkey" FOREIGN KEY ("flight_record_id") REFERENCES "public"."flight_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processing_runs" ADD CONSTRAINT "processing_runs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_distance_cache" ADD CONSTRAINT "route_distance_cache_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_distance_cache" ADD CONSTRAINT "route_distance_cache_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quick_calculations" ADD CONSTRAINT "quick_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_calculation_cache" ADD CONSTRAINT "emission_calculation_cache_route_cache_id_fkey" FOREIGN KEY ("route_cache_id") REFERENCES "public"."route_distance_cache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_summaries" ADD CONSTRAINT "emission_summaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batch_summaries" ADD CONSTRAINT "batch_summaries_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_versions" ADD CONSTRAINT "project_pricing_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_versions" ADD CONSTRAINT "project_pricing_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."global_margin_config" ADD CONSTRAINT "global_margin_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_pricing_overrides" ADD CONSTRAINT "company_pricing_overrides_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_pricing_overrides" ADD CONSTRAINT "company_pricing_overrides_pricing_tier_id_fkey" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compensation_orders" ADD CONSTRAINT "compensation_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compensation_orders" ADD CONSTRAINT "compensation_orders_pricing_tier_id_fkey" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_requests" ADD CONSTRAINT "certificate_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificates" ADD CONSTRAINT "certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificates" ADD CONSTRAINT "certificates_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."certificate_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_hashes" ADD CONSTRAINT "certificate_hashes_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_project_pricing_version_id_fkey" FOREIGN KEY ("project_pricing_version_id") REFERENCES "public"."project_pricing_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_evidence" ADD CONSTRAINT "project_evidence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_metrics" ADD CONSTRAINT "project_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_partners" ADD CONSTRAINT "project_partners_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_badges" ADD CONSTRAINT "company_badges_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_badges" ADD CONSTRAINT "company_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_events" ADD CONSTRAINT "share_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_events" ADD CONSTRAINT "share_events_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."widgets" ADD CONSTRAINT "widgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entity_attachments" ADD CONSTRAINT "entity_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_events" ADD CONSTRAINT "login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_events" ADD CONSTRAINT "login_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_audit" ADD CONSTRAINT "project_pricing_audit_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_audit" ADD CONSTRAINT "project_pricing_audit_old_version_id_fkey" FOREIGN KEY ("old_version_id") REFERENCES "public"."project_pricing_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_audit" ADD CONSTRAINT "project_pricing_audit_new_version_id_fkey" FOREIGN KEY ("new_version_id") REFERENCES "public"."project_pricing_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_audit" ADD CONSTRAINT "project_pricing_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_configuration_id_fkey" FOREIGN KEY ("api_configuration_id") REFERENCES "public"."api_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_usage_logs" ADD CONSTRAINT "api_usage_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_calculation_metrics" ADD CONSTRAINT "company_calculation_metrics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
