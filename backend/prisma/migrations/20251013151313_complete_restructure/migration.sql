/*
  Warnings:

  - The values [ACTIVE,INACTIVE,MAINTENANCE] on the enum `ApiProviderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PERMANENT,TEMPORARY] on the enum `BadgeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [UPLOADED,VALIDATING,PROCESSING,DONE,FAILED] on the enum `BatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT,ISSUED,REVOKED] on the enum `CertificateStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [REGISTERED,PENDING_CONTRACT,SIGNED,ACTIVE,SUSPENDED] on the enum `CompanyStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INTERNAL_FACTORS,GOOGLE_TRAVEL_IMPACT_API,ICAO_CALCULATOR_API,MIXED_SOURCES] on the enum `EmissionSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [QUEUED,RUNNING,SUCCEEDED,FAILED] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUCCESS,FAILURE] on the enum `LoginResult` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,PAID,FAILED,REFUNDED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT,SCHEDULED,ACTIVE,SUPERSEDED] on the enum `ProjectPricingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PLANNED,ACTIVE,COMPLETED,PAUSED,MAINTENANCE] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [REQUESTED,PROCESSING,COMPLETED,FAILED] on the enum `RefundStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INFO,WARNING,ERROR] on the enum `SeverityLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,VALID,WARNING,INVALID] on the enum `ValidationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `aircraft_models` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `airports` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `lat` on the `airports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,6)`.
  - You are about to alter the column `lon` on the `airports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,6)`.
  - The primary key for the `anomaly_rules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `api_configurations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `success_rate_24h` on the `api_configurations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - The primary key for the `api_keys` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `api_usage_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `company_id` column on the `api_usage_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `request_params` column on the `api_usage_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `cost_usd` on the `api_usage_logs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,4)`.
  - The primary key for the `audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `company_id` on the `audit_logs` table. All the data in the column will be lost.
  - The `actor_user_id` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `badge_definitions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `min_threshold` on the `badge_definitions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `batch_summaries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `certificate_hashes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `certificate_projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `percentage` on the `certificate_projects` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `allocation_tons` on the `certificate_projects` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price_usd_per_ton` on the `certificate_projects` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `amount_usd` on the `certificate_projects` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `certificate_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `calculation_methods_breakdown` column on the `certificate_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `certificates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `tons_compensated` on the `certificates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `calculation_methods_breakdown` column on the `certificates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `project_pricing_versions_used` column on the `certificates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `weighted_avg_price_usd_per_ton` on the `certificates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total_amount_usd` on the `certificates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `total_amount_clp` on the `certificates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_badges` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_calculation_metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `avg_confidence_score` on the `company_calculation_metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - You are about to alter the column `total_co2_calculated_tons` on the `company_calculation_metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `total_api_cost_usd` on the `company_calculation_metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `company_documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_domains` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_pricing_overrides` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `override_price` on the `company_pricing_overrides` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `company_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_verification_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `compensation_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `tons_tco2` on the `compensation_orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `compensation_orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `emission_calculation_cache` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `emission_factor` on the `emission_calculation_cache` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(8,5)`.
  - You are about to alter the column `co2_total_kg` on the `emission_calculation_cache` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `confidence_score` on the `emission_calculation_cache` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - The primary key for the `emission_summaries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `distance_km` on the `emission_summaries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `emissions_tco2` on the `emission_summaries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `coverage_pct` on the `emission_summaries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - The primary key for the `entity_attachments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `esg_projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `co_benefits` column on the `esg_projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `current_base_price_usd_per_ton` on the `esg_projects` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `file_uploads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `flight_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `batch_id` column on the `flight_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `class_breakdown` column on the `flight_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `distance_km` on the `flight_records` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `computed_emissions` on the `flight_records` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `confidence_score` on the `flight_records` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - The `api_response_data` column on the `flight_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `calculation_metadata` column on the `flight_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `fx_rates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `rate` on the `fx_rates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,6)`.
  - The primary key for the `global_margin_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `default_margin_percent` on the `global_margin_config` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - The primary key for the `invoices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `total_amount` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `jobs_queue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `login_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `company_id` on the `login_events` table. All the data in the column will be lost.
  - The `user_id` column on the `login_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `manifest_files` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `pricing_tiers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `min_tons` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `max_tons` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price_per_ton` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `processing_runs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_evidence` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `metric_value` on the `project_evidence` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `project_metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `metric_value` on the `project_metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `project_partners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `project_pricing_audit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `old_version_id` column on the `project_pricing_audit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `old_values` column on the `project_pricing_audit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `new_values` column on the `project_pricing_audit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `project_pricing_versions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `base_price_usd_per_ton` on the `project_pricing_versions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `compensa_margin_percent` on the `project_pricing_versions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `final_price_usd_per_ton` on the `project_pricing_versions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `quick_calculations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `estimated_class_distribution` column on the `quick_calculations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `distance_km` on the `quick_calculations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total_co2_kg` on the `quick_calculations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `confidence_level` on the `quick_calculations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - The primary key for the `ranking_jobs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ranking_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `compensated_tons` on the `ranking_snapshots` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `coverage_pct` on the `ranking_snapshots` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `score` on the `ranking_snapshots` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `record_validation_errors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `refunds` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `amount` on the `refunds` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `route_distance_cache` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `distance_km` on the `route_distance_cache` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `confidence_score` on the `route_distance_cache` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.
  - The primary key for the `route_summaries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `emissions_tco2` on the `route_summaries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - The primary key for the `share_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `certificate_id` column on the `share_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `share_templates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `upload_batches` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `webhook_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `webhooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `widgets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `class_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `emission_factor_versions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `manufacturer` to the `aircraft_models` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `aircraft_models` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `airports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `anomaly_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `api_configurations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `api_keys` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `api_keys` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `api_usage_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `api_configuration_id` on the `api_usage_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `response_data_size_bytes` on table `api_usage_logs` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entity_id` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `badge_definitions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `batch_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `batch_id` on the `batch_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `certificate_hashes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `certificate_id` on the `certificate_hashes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `certificate_id` on the `certificate_projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `certificate_projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_pricing_version_id` on the `certificate_projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `certificate_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `certificate_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `certificates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `certificates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `request_id` to the `certificates` table without a default value. This is not possible if the table is not empty.
  - Made the column `weighted_avg_price_usd_per_ton` on table `certificates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_amount_usd` on table `certificates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_amount_clp` on table `certificates` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `companies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_badges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_badges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `badge_id` on the `company_badges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_calculation_metrics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_calculation_metrics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `file_id` on the `company_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_domains` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_domains` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_pricing_overrides` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_pricing_overrides` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pricing_tier_id` on the `company_pricing_overrides` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_user_id` on the `company_user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `company_user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `company_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `company_verification_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `company_verification_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `noted_by_user_id` on the `company_verification_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `compensation_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `compensation_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `pricing_tier_id` to the `compensation_orders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `emission_calculation_cache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `route_cache_id` on the `emission_calculation_cache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `emission_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `emission_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `entity_attachments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entity_id` on the `entity_attachments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `file_id` on the `entity_attachments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `esg_projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `current_base_price_usd_per_ton` on table `esg_projects` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `file_uploads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `owner_id` on the `file_uploads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `flight_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `flight_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `origin_airport_id` on the `flight_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `destination_airport_id` on the `flight_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `aircraft_model_id` to the `flight_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `factors_version_id` to the `flight_records` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `fx_rates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `global_margin_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `created_by` on the `global_margin_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `invoices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_id` on the `invoices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `folio` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timbre` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pdf_url` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `issued_at` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `jobs_queue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `login_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `manifest_files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `batch_id` on the `manifest_files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `pricing_tiers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `processing_runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `batch_id` on the `processing_runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `started_at` on table `processing_runs` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `project_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `file_id` on the `project_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `project_evidence` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_evidence` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `project_metrics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_metrics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `project_partners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_partners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `project_pricing_audit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_pricing_audit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `new_version_id` on the `project_pricing_audit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `changed_by` on the `project_pricing_audit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `project_pricing_versions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `project_pricing_versions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `created_by` on the `project_pricing_versions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `quick_calculations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `quick_calculations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ranking_jobs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `started_at` on table `ranking_jobs` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `ranking_snapshots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `ranking_snapshots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `record_validation_errors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `flight_record_id` on the `record_validation_errors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `refunds` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_id` on the `refunds` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `permission_id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `route_distance_cache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `origin_airport_id` on the `route_distance_cache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `destination_airport_id` on the `route_distance_cache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `route_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `route_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `origin_airport_id` on the `route_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `destination_airport_id` on the `route_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `share_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `share_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `share_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `upload_batches` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `upload_batches` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `webhook_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `webhook_id` on the `webhook_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `webhooks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `webhooks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `widgets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `widgets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ApiProviderStatus_new" AS ENUM ('active', 'inactive', 'maintenance');
ALTER TABLE "public"."api_configurations" ALTER COLUMN "status" TYPE "public"."ApiProviderStatus_new" USING ("status"::text::"public"."ApiProviderStatus_new");
ALTER TYPE "public"."ApiProviderStatus" RENAME TO "ApiProviderStatus_old";
ALTER TYPE "public"."ApiProviderStatus_new" RENAME TO "ApiProviderStatus";
DROP TYPE "public"."ApiProviderStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BadgeType_new" AS ENUM ('permanent', 'temporary');
ALTER TABLE "public"."badge_definitions" ALTER COLUMN "type" TYPE "public"."BadgeType_new" USING ("type"::text::"public"."BadgeType_new");
ALTER TYPE "public"."BadgeType" RENAME TO "BadgeType_old";
ALTER TYPE "public"."BadgeType_new" RENAME TO "BadgeType";
DROP TYPE "public"."BadgeType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BatchStatus_new" AS ENUM ('uploaded', 'validating', 'processing', 'done', 'failed');
ALTER TABLE "public"."upload_batches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."upload_batches" ALTER COLUMN "status" TYPE "public"."BatchStatus_new" USING ("status"::text::"public"."BatchStatus_new");
ALTER TYPE "public"."BatchStatus" RENAME TO "BatchStatus_old";
ALTER TYPE "public"."BatchStatus_new" RENAME TO "BatchStatus";
DROP TYPE "public"."BatchStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."CertificateStatus_new" AS ENUM ('draft', 'issued', 'revoked');
ALTER TABLE "public"."certificates" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."certificates" ALTER COLUMN "status" TYPE "public"."CertificateStatus_new" USING ("status"::text::"public"."CertificateStatus_new");
ALTER TYPE "public"."CertificateStatus" RENAME TO "CertificateStatus_old";
ALTER TYPE "public"."CertificateStatus_new" RENAME TO "CertificateStatus";
DROP TYPE "public"."CertificateStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."CompanyStatus_new" AS ENUM ('registered', 'pending_contract', 'signed', 'active', 'suspended');
ALTER TABLE "public"."companies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."companies" ALTER COLUMN "status" TYPE "public"."CompanyStatus_new" USING ("status"::text::"public"."CompanyStatus_new");
ALTER TABLE "public"."company_verification_events" ALTER COLUMN "from_status" TYPE "public"."CompanyStatus_new" USING ("from_status"::text::"public"."CompanyStatus_new");
ALTER TABLE "public"."company_verification_events" ALTER COLUMN "to_status" TYPE "public"."CompanyStatus_new" USING ("to_status"::text::"public"."CompanyStatus_new");
ALTER TYPE "public"."CompanyStatus" RENAME TO "CompanyStatus_old";
ALTER TYPE "public"."CompanyStatus_new" RENAME TO "CompanyStatus";
DROP TYPE "public"."CompanyStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EmissionSource_new" AS ENUM ('internal_factors', 'google_travel_impact_api', 'icao_calculator_api', 'mixed_sources');
ALTER TABLE "public"."flight_records" ALTER COLUMN "emission_source" TYPE "public"."EmissionSource_new" USING ("emission_source"::text::"public"."EmissionSource_new");
ALTER TABLE "public"."quick_calculations" ALTER COLUMN "emission_source" TYPE "public"."EmissionSource_new" USING ("emission_source"::text::"public"."EmissionSource_new");
ALTER TYPE "public"."EmissionSource" RENAME TO "EmissionSource_old";
ALTER TYPE "public"."EmissionSource_new" RENAME TO "EmissionSource";
DROP TYPE "public"."EmissionSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."JobStatus_new" AS ENUM ('queued', 'running', 'succeeded', 'failed');
ALTER TABLE "public"."jobs_queue" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."processing_runs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ranking_jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."processing_runs" ALTER COLUMN "status" TYPE "public"."JobStatus_new" USING ("status"::text::"public"."JobStatus_new");
ALTER TABLE "public"."ranking_jobs" ALTER COLUMN "status" TYPE "public"."JobStatus_new" USING ("status"::text::"public"."JobStatus_new");
ALTER TABLE "public"."jobs_queue" ALTER COLUMN "status" TYPE "public"."JobStatus_new" USING ("status"::text::"public"."JobStatus_new");
ALTER TYPE "public"."JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "public"."JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "public"."JobStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."LoginResult_new" AS ENUM ('success', 'failure');
ALTER TABLE "public"."login_events" ALTER COLUMN "result" TYPE "public"."LoginResult_new" USING ("result"::text::"public"."LoginResult_new");
ALTER TYPE "public"."LoginResult" RENAME TO "LoginResult_old";
ALTER TYPE "public"."LoginResult_new" RENAME TO "LoginResult";
DROP TYPE "public"."LoginResult_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('pending', 'paid', 'failed', 'refunded');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."payments" ALTER COLUMN "status" TYPE "public"."PaymentStatus_new" USING ("status"::text::"public"."PaymentStatus_new");
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectPricingStatus_new" AS ENUM ('draft', 'scheduled', 'active', 'superseded');
ALTER TABLE "public"."project_pricing_versions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."project_pricing_versions" ALTER COLUMN "status" TYPE "public"."ProjectPricingStatus_new" USING ("status"::text::"public"."ProjectPricingStatus_new");
ALTER TYPE "public"."ProjectPricingStatus" RENAME TO "ProjectPricingStatus_old";
ALTER TYPE "public"."ProjectPricingStatus_new" RENAME TO "ProjectPricingStatus";
DROP TYPE "public"."ProjectPricingStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectStatus_new" AS ENUM ('planned', 'active', 'completed', 'paused', 'maintenance');
ALTER TABLE "public"."esg_projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."esg_projects" ALTER COLUMN "status" TYPE "public"."ProjectStatus_new" USING ("status"::text::"public"."ProjectStatus_new");
ALTER TYPE "public"."ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "public"."ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."RefundStatus_new" AS ENUM ('requested', 'processing', 'completed', 'failed');
ALTER TABLE "public"."refunds" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."refunds" ALTER COLUMN "status" TYPE "public"."RefundStatus_new" USING ("status"::text::"public"."RefundStatus_new");
ALTER TYPE "public"."RefundStatus" RENAME TO "RefundStatus_old";
ALTER TYPE "public"."RefundStatus_new" RENAME TO "RefundStatus";
DROP TYPE "public"."RefundStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."SeverityLevel_new" AS ENUM ('info', 'warning', 'error');
ALTER TABLE "public"."record_validation_errors" ALTER COLUMN "severity" TYPE "public"."SeverityLevel_new" USING ("severity"::text::"public"."SeverityLevel_new");
ALTER TYPE "public"."SeverityLevel" RENAME TO "SeverityLevel_old";
ALTER TYPE "public"."SeverityLevel_new" RENAME TO "SeverityLevel";
DROP TYPE "public"."SeverityLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ValidationStatus_new" AS ENUM ('pending', 'valid', 'warning', 'invalid');
ALTER TABLE "public"."flight_records" ALTER COLUMN "validation_status" TYPE "public"."ValidationStatus_new" USING ("validation_status"::text::"public"."ValidationStatus_new");
ALTER TYPE "public"."ValidationStatus" RENAME TO "ValidationStatus_old";
ALTER TYPE "public"."ValidationStatus_new" RENAME TO "ValidationStatus";
DROP TYPE "public"."ValidationStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."api_keys" DROP CONSTRAINT "api_keys_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."api_usage_logs" DROP CONSTRAINT "api_usage_logs_api_configuration_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."api_usage_logs" DROP CONSTRAINT "api_usage_logs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_actor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."batch_summaries" DROP CONSTRAINT "batch_summaries_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_hashes" DROP CONSTRAINT "certificate_hashes_certificate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_projects" DROP CONSTRAINT "certificate_projects_certificate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_projects" DROP CONSTRAINT "certificate_projects_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_projects" DROP CONSTRAINT "certificate_projects_project_pricing_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_requests" DROP CONSTRAINT "certificate_requests_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificates" DROP CONSTRAINT "certificates_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificates" DROP CONSTRAINT "certificates_request_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_badges" DROP CONSTRAINT "company_badges_badge_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_badges" DROP CONSTRAINT "company_badges_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_calculation_metrics" DROP CONSTRAINT "company_calculation_metrics_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_documents" DROP CONSTRAINT "company_documents_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_documents" DROP CONSTRAINT "company_documents_file_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_domains" DROP CONSTRAINT "company_domains_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_pricing_overrides" DROP CONSTRAINT "company_pricing_overrides_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_pricing_overrides" DROP CONSTRAINT "company_pricing_overrides_pricing_tier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_settings" DROP CONSTRAINT "company_settings_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_user_roles" DROP CONSTRAINT "company_user_roles_company_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_user_roles" DROP CONSTRAINT "company_user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_users" DROP CONSTRAINT "company_users_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_users" DROP CONSTRAINT "company_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_verification_events" DROP CONSTRAINT "company_verification_events_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_verification_events" DROP CONSTRAINT "company_verification_events_noted_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."compensation_orders" DROP CONSTRAINT "compensation_orders_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."compensation_orders" DROP CONSTRAINT "compensation_orders_pricing_tier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."emission_calculation_cache" DROP CONSTRAINT "emission_calculation_cache_route_cache_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."emission_summaries" DROP CONSTRAINT "emission_summaries_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."entity_attachments" DROP CONSTRAINT "entity_attachments_file_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_aircraft_model_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_destination_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_factors_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_origin_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."global_margin_config" DROP CONSTRAINT "global_margin_config_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."login_events" DROP CONSTRAINT "login_events_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."login_events" DROP CONSTRAINT "login_events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."manifest_files" DROP CONSTRAINT "manifest_files_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."processing_runs" DROP CONSTRAINT "processing_runs_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_documents" DROP CONSTRAINT "project_documents_file_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_documents" DROP CONSTRAINT "project_documents_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_evidence" DROP CONSTRAINT "project_evidence_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_metrics" DROP CONSTRAINT "project_metrics_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_partners" DROP CONSTRAINT "project_partners_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_audit" DROP CONSTRAINT "project_pricing_audit_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_audit" DROP CONSTRAINT "project_pricing_audit_new_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_audit" DROP CONSTRAINT "project_pricing_audit_old_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_audit" DROP CONSTRAINT "project_pricing_audit_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_versions" DROP CONSTRAINT "project_pricing_versions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_pricing_versions" DROP CONSTRAINT "project_pricing_versions_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."quick_calculations" DROP CONSTRAINT "quick_calculations_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ranking_snapshots" DROP CONSTRAINT "ranking_snapshots_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."record_validation_errors" DROP CONSTRAINT "record_validation_errors_flight_record_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."refunds" DROP CONSTRAINT "refunds_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."route_distance_cache" DROP CONSTRAINT "route_distance_cache_destination_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."route_distance_cache" DROP CONSTRAINT "route_distance_cache_origin_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."route_summaries" DROP CONSTRAINT "route_summaries_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."route_summaries" DROP CONSTRAINT "route_summaries_destination_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."route_summaries" DROP CONSTRAINT "route_summaries_origin_airport_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."share_events" DROP CONSTRAINT "share_events_certificate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."share_events" DROP CONSTRAINT "share_events_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."upload_batches" DROP CONSTRAINT "upload_batches_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."webhook_logs" DROP CONSTRAINT "webhook_logs_webhook_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."webhooks" DROP CONSTRAINT "webhooks_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."widgets" DROP CONSTRAINT "widgets_company_id_fkey";

-- DropIndex
DROP INDEX "public"."api_usage_logs_company_id_created_at_idx";

-- DropIndex
DROP INDEX "public"."audit_logs_entity_type_entity_id_idx";

-- DropIndex
DROP INDEX "public"."companies_rut_key";

-- DropIndex
DROP INDEX "public"."company_domains_company_id_domain_key";

-- DropIndex
DROP INDEX "public"."flight_records_calculation_type_idx";

-- DropIndex
DROP INDEX "public"."flight_records_company_id_flight_date_idx";

-- DropIndex
DROP INDEX "public"."jobs_queue_status_scheduled_at_idx";

-- DropIndex
DROP INDEX "public"."quick_calculations_company_id_calculation_date_idx";

-- AlterTable
ALTER TABLE "public"."aircraft_models" DROP CONSTRAINT "aircraft_models_pkey",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fuel_efficiency_base" DECIMAL(5,2),
ADD COLUMN     "manufacturer" VARCHAR NOT NULL,
ADD COLUMN     "typical_seats_business" INTEGER,
ADD COLUMN     "typical_seats_economy" INTEGER,
ADD COLUMN     "typical_seats_first" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "category" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "aircraft_models_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."airports" DROP CONSTRAINT "airports_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "city" SET DATA TYPE VARCHAR,
ALTER COLUMN "country" SET DATA TYPE VARCHAR,
ALTER COLUMN "lat" SET DATA TYPE DECIMAL(10,6),
ALTER COLUMN "lon" SET DATA TYPE DECIMAL(10,6),
ADD CONSTRAINT "airports_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."anomaly_rules" DROP CONSTRAINT "anomaly_rules_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "description" DROP NOT NULL,
ADD CONSTRAINT "anomaly_rules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."api_configurations" DROP CONSTRAINT "api_configurations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "provider_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "endpoint_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "api_key_reference" SET DATA TYPE VARCHAR,
ALTER COLUMN "success_rate_24h" SET DATA TYPE DECIMAL(3,2),
ADD CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."api_keys" DROP CONSTRAINT "api_keys_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "key_hash" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."api_usage_logs" DROP CONSTRAINT "api_usage_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "api_configuration_id",
ADD COLUMN     "api_configuration_id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID,
ALTER COLUMN "request_type" SET DATA TYPE VARCHAR,
DROP COLUMN "request_params",
ADD COLUMN     "request_params" JSONB,
ALTER COLUMN "response_data_size_bytes" SET NOT NULL,
ALTER COLUMN "cost_usd" SET DATA TYPE DECIMAL(10,4),
ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_pkey",
DROP COLUMN "company_id",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "actor_user_id",
ADD COLUMN     "actor_user_id" UUID,
ALTER COLUMN "action" SET DATA TYPE VARCHAR,
ALTER COLUMN "entity_type" SET DATA TYPE VARCHAR,
DROP COLUMN "entity_id",
ADD COLUMN     "entity_id" UUID NOT NULL,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."badge_definitions" DROP CONSTRAINT "badge_definitions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "min_threshold" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "percentile_rule" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."batch_summaries" DROP CONSTRAINT "batch_summaries_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "batch_id",
ADD COLUMN     "batch_id" UUID NOT NULL,
ADD CONSTRAINT "batch_summaries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."certificate_hashes" DROP CONSTRAINT "certificate_hashes_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "certificate_id",
ADD COLUMN     "certificate_id" UUID NOT NULL,
ALTER COLUMN "hash_value" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "certificate_hashes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."certificate_projects" DROP CONSTRAINT "certificate_projects_pkey",
DROP COLUMN "certificate_id",
ADD COLUMN     "certificate_id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
DROP COLUMN "project_pricing_version_id",
ADD COLUMN     "project_pricing_version_id" UUID NOT NULL,
ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "allocation_tons" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "price_usd_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "amount_usd" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "project_name_snapshot" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "certificate_projects_pkey" PRIMARY KEY ("certificate_id", "project_id");

-- AlterTable
ALTER TABLE "public"."certificate_requests" DROP CONSTRAINT "certificate_requests_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "scope" SET DATA TYPE VARCHAR,
DROP COLUMN "calculation_methods_breakdown",
ADD COLUMN     "calculation_methods_breakdown" JSONB,
ALTER COLUMN "language" DROP DEFAULT,
ALTER COLUMN "language" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."certificates" DROP CONSTRAINT "certificates_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "request_id",
ADD COLUMN     "request_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "scope" SET DATA TYPE VARCHAR,
ALTER COLUMN "tons_compensated" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "calculation_methods_breakdown",
ADD COLUMN     "calculation_methods_breakdown" JSONB,
DROP COLUMN "project_pricing_versions_used",
ADD COLUMN     "project_pricing_versions_used" JSONB,
ALTER COLUMN "weighted_avg_price_usd_per_ton" SET NOT NULL,
ALTER COLUMN "weighted_avg_price_usd_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total_amount_usd" SET NOT NULL,
ALTER COLUMN "total_amount_usd" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total_amount_clp" SET NOT NULL,
ALTER COLUMN "total_amount_clp" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "number" SET DATA TYPE VARCHAR,
ALTER COLUMN "pdf_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "qr_code_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."companies" DROP CONSTRAINT "companies_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "razon_social" SET DATA TYPE VARCHAR,
ALTER COLUMN "rut" SET DATA TYPE VARCHAR,
ALTER COLUMN "nombre_comercial" SET DATA TYPE VARCHAR,
ALTER COLUMN "giro_sii" SET DATA TYPE VARCHAR,
ALTER COLUMN "tamano_empresa" SET DATA TYPE VARCHAR,
ALTER COLUMN "direccion" SET DATA TYPE VARCHAR,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR,
ALTER COLUMN "slug_publico" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_badges" DROP CONSTRAINT "company_badges_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "badge_id",
ADD COLUMN     "badge_id" UUID NOT NULL,
ADD CONSTRAINT "company_badges_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_calculation_metrics" DROP CONSTRAINT "company_calculation_metrics_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "avg_confidence_score" SET DATA TYPE DECIMAL(3,2),
ALTER COLUMN "total_co2_calculated_tons" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total_api_cost_usd" SET DATA TYPE DECIMAL(10,2),
ADD CONSTRAINT "company_calculation_metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_documents" DROP CONSTRAINT "company_documents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "doc_type" SET DATA TYPE VARCHAR,
DROP COLUMN "file_id",
ADD COLUMN     "file_id" UUID NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR,
ALTER COLUMN "uploaded_at" DROP DEFAULT,
ADD CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_domains" DROP CONSTRAINT "company_domains_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "domain" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "company_domains_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_pricing_overrides" DROP CONSTRAINT "company_pricing_overrides_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "pricing_tier_id",
ADD COLUMN     "pricing_tier_id" UUID NOT NULL,
ALTER COLUMN "override_price" SET DATA TYPE DECIMAL(10,2),
ADD CONSTRAINT "company_pricing_overrides_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_settings" DROP CONSTRAINT "company_settings_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "public_tagline" SET DATA TYPE VARCHAR,
ALTER COLUMN "public_banner_url" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_user_roles" DROP CONSTRAINT "company_user_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_user_id",
ADD COLUMN     "company_user_id" UUID NOT NULL,
DROP COLUMN "role_id",
ADD COLUMN     "role_id" UUID NOT NULL,
ADD CONSTRAINT "company_user_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_users" DROP CONSTRAINT "company_users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "company_users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_verification_events" DROP CONSTRAINT "company_verification_events_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "noted_by_user_id",
ADD COLUMN     "noted_by_user_id" UUID NOT NULL,
ADD CONSTRAINT "company_verification_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."compensation_orders" DROP CONSTRAINT "compensation_orders_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "tons_tco2" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR,
DROP COLUMN "pricing_tier_id",
ADD COLUMN     "pricing_tier_id" UUID NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "compensation_orders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."emission_calculation_cache" DROP CONSTRAINT "emission_calculation_cache_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "route_cache_id",
ADD COLUMN     "route_cache_id" UUID NOT NULL,
ALTER COLUMN "aircraft_type" SET DATA TYPE VARCHAR,
ALTER COLUMN "passengers_range" SET DATA TYPE VARCHAR,
ALTER COLUMN "emission_factor" SET DATA TYPE DECIMAL(8,5),
ALTER COLUMN "co2_total_kg" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "api_source" SET DATA TYPE VARCHAR,
ALTER COLUMN "confidence_score" SET DATA TYPE DECIMAL(3,2),
ADD CONSTRAINT "emission_calculation_cache_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."emission_summaries" DROP CONSTRAINT "emission_summaries_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "distance_km" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "emissions_tco2" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "coverage_pct" SET DATA TYPE DECIMAL(5,2),
ADD CONSTRAINT "emission_summaries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."entity_attachments" DROP CONSTRAINT "entity_attachments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "entity_type" SET DATA TYPE VARCHAR,
DROP COLUMN "entity_id",
ADD COLUMN     "entity_id" UUID NOT NULL,
DROP COLUMN "file_id",
ADD COLUMN     "file_id" UUID NOT NULL,
ALTER COLUMN "note" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "entity_attachments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."esg_projects" DROP CONSTRAINT "esg_projects_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "project_type" SET DATA TYPE VARCHAR,
ALTER COLUMN "country" SET DATA TYPE VARCHAR,
ALTER COLUMN "region" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "provider_organization" SET DATA TYPE VARCHAR,
ALTER COLUMN "certification" SET DATA TYPE VARCHAR,
DROP COLUMN "co_benefits",
ADD COLUMN     "co_benefits" JSONB,
ALTER COLUMN "current_base_price_usd_per_ton" SET NOT NULL,
ALTER COLUMN "current_base_price_usd_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "transparency_url" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "esg_projects_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."file_uploads" DROP CONSTRAINT "file_uploads_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "owner_type" SET DATA TYPE VARCHAR,
DROP COLUMN "owner_id",
ADD COLUMN     "owner_id" UUID NOT NULL,
ALTER COLUMN "file_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "mime_type" SET DATA TYPE VARCHAR,
ALTER COLUMN "storage_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "checksum" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."flight_records" DROP CONSTRAINT "flight_records_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "batch_id",
ADD COLUMN     "batch_id" UUID,
ALTER COLUMN "flight_number" SET DATA TYPE VARCHAR,
DROP COLUMN "origin_airport_id",
ADD COLUMN     "origin_airport_id" UUID NOT NULL,
DROP COLUMN "destination_airport_id",
ADD COLUMN     "destination_airport_id" UUID NOT NULL,
DROP COLUMN "aircraft_model_id",
ADD COLUMN     "aircraft_model_id" UUID NOT NULL,
DROP COLUMN "class_breakdown",
ADD COLUMN     "class_breakdown" JSONB,
ALTER COLUMN "flight_date" SET DATA TYPE DATE,
ALTER COLUMN "distance_km" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "computed_emissions" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "confidence_score" SET DATA TYPE DECIMAL(3,2),
DROP COLUMN "api_response_data",
ADD COLUMN     "api_response_data" JSONB,
DROP COLUMN "factors_version_id",
ADD COLUMN     "factors_version_id" UUID NOT NULL,
DROP COLUMN "calculation_metadata",
ADD COLUMN     "calculation_metadata" JSONB,
ADD CONSTRAINT "flight_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."fx_rates" DROP CONSTRAINT "fx_rates_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "rate_date" SET DATA TYPE DATE,
ALTER COLUMN "base_currency" SET DATA TYPE VARCHAR,
ALTER COLUMN "quote_currency" SET DATA TYPE VARCHAR,
ALTER COLUMN "rate" SET DATA TYPE DECIMAL(12,6),
ALTER COLUMN "source" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."global_margin_config" DROP CONSTRAINT "global_margin_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "default_margin_percent" SET DATA TYPE DECIMAL(5,2),
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ADD CONSTRAINT "global_margin_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "payment_id",
ADD COLUMN     "payment_id" UUID NOT NULL,
ALTER COLUMN "folio" SET NOT NULL,
ALTER COLUMN "folio" SET DATA TYPE VARCHAR,
ALTER COLUMN "timbre" SET NOT NULL,
ALTER COLUMN "timbre" SET DATA TYPE VARCHAR,
ALTER COLUMN "pdf_url" SET NOT NULL,
ALTER COLUMN "pdf_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR,
ALTER COLUMN "issued_at" SET NOT NULL,
ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."jobs_queue" DROP CONSTRAINT "jobs_queue_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "job_type" SET DATA TYPE VARCHAR,
ALTER COLUMN "payload_json" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "attempts" DROP DEFAULT,
ADD CONSTRAINT "jobs_queue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."login_events" DROP CONSTRAINT "login_events_pkey",
DROP COLUMN "company_id",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "ip" SET DATA TYPE VARCHAR,
ALTER COLUMN "user_agent" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "login_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."manifest_files" DROP CONSTRAINT "manifest_files_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "batch_id",
ADD COLUMN     "batch_id" UUID NOT NULL,
ALTER COLUMN "storage_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "checksum" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "manifest_files_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "provider" SET DATA TYPE VARCHAR,
ALTER COLUMN "provider_payment_id" SET DATA TYPE VARCHAR,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."permissions" DROP CONSTRAINT "permissions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."pricing_tiers" DROP CONSTRAINT "pricing_tiers_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "min_tons" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "max_tons" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "price_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."processing_runs" DROP CONSTRAINT "processing_runs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "batch_id",
ADD COLUMN     "batch_id" UUID NOT NULL,
ALTER COLUMN "run_type" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "started_at" SET NOT NULL,
ADD CONSTRAINT "processing_runs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_documents" DROP CONSTRAINT "project_documents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
DROP COLUMN "file_id",
ADD COLUMN     "file_id" UUID NOT NULL,
ALTER COLUMN "doc_type" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_evidence" DROP CONSTRAINT "project_evidence_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "photo_url" SET DATA TYPE VARCHAR,
ALTER COLUMN "metric_name" DROP NOT NULL,
ALTER COLUMN "metric_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "metric_value" DROP NOT NULL,
ALTER COLUMN "metric_value" SET DATA TYPE DECIMAL(12,2),
ADD CONSTRAINT "project_evidence_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_metrics" DROP CONSTRAINT "project_metrics_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
ALTER COLUMN "metric_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "metric_value" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "recorded_at" SET DATA TYPE DATE,
ADD CONSTRAINT "project_metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_partners" DROP CONSTRAINT "project_partners_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
ALTER COLUMN "organization_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "partner_role" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "project_partners_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_pricing_audit" DROP CONSTRAINT "project_pricing_audit_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
DROP COLUMN "old_version_id",
ADD COLUMN     "old_version_id" UUID,
DROP COLUMN "new_version_id",
ADD COLUMN     "new_version_id" UUID NOT NULL,
DROP COLUMN "changed_by",
ADD COLUMN     "changed_by" UUID NOT NULL,
DROP COLUMN "old_values",
ADD COLUMN     "old_values" JSONB,
DROP COLUMN "new_values",
ADD COLUMN     "new_values" JSONB,
ALTER COLUMN "changed_at" DROP DEFAULT,
ADD CONSTRAINT "project_pricing_audit_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."project_pricing_versions" DROP CONSTRAINT "project_pricing_versions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
ALTER COLUMN "version_name" SET DATA TYPE VARCHAR,
ALTER COLUMN "base_price_usd_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "compensa_margin_percent" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "final_price_usd_per_ton" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "status" DROP DEFAULT,
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ADD CONSTRAINT "project_pricing_versions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."quick_calculations" DROP CONSTRAINT "quick_calculations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "route_origin" SET DATA TYPE VARCHAR,
ALTER COLUMN "route_destination" SET DATA TYPE VARCHAR,
ALTER COLUMN "aircraft_type" SET DATA TYPE VARCHAR,
DROP COLUMN "estimated_class_distribution",
ADD COLUMN     "estimated_class_distribution" JSONB,
ALTER COLUMN "distance_km" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total_co2_kg" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "confidence_level" SET DATA TYPE DECIMAL(3,2),
ADD CONSTRAINT "quick_calculations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."ranking_jobs" DROP CONSTRAINT "ranking_jobs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "started_at" SET NOT NULL,
ADD CONSTRAINT "ranking_jobs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."ranking_snapshots" DROP CONSTRAINT "ranking_snapshots_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "compensated_tons" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "coverage_pct" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "score" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "segment" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."record_validation_errors" DROP CONSTRAINT "record_validation_errors_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "flight_record_id",
ADD COLUMN     "flight_record_id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "record_validation_errors_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."refunds" DROP CONSTRAINT "refunds_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "payment_id",
ADD COLUMN     "payment_id" UUID NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "requested_at" DROP DEFAULT,
ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "role_id",
ADD COLUMN     "role_id" UUID NOT NULL,
DROP COLUMN "permission_id",
ADD COLUMN     "permission_id" UUID NOT NULL,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."roles" DROP CONSTRAINT "roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."route_distance_cache" DROP CONSTRAINT "route_distance_cache_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "origin_iata" SET DATA TYPE VARCHAR,
ALTER COLUMN "destination_iata" SET DATA TYPE VARCHAR,
DROP COLUMN "origin_airport_id",
ADD COLUMN     "origin_airport_id" UUID NOT NULL,
DROP COLUMN "destination_airport_id",
ADD COLUMN     "destination_airport_id" UUID NOT NULL,
ALTER COLUMN "distance_km" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "source_api" SET DATA TYPE VARCHAR,
ALTER COLUMN "confidence_score" SET DATA TYPE DECIMAL(3,2),
ADD CONSTRAINT "route_distance_cache_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."route_summaries" DROP CONSTRAINT "route_summaries_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "period_month" SET DATA TYPE DATE,
DROP COLUMN "origin_airport_id",
ADD COLUMN     "origin_airport_id" UUID NOT NULL,
DROP COLUMN "destination_airport_id",
ADD COLUMN     "destination_airport_id" UUID NOT NULL,
ALTER COLUMN "emissions_tco2" SET DATA TYPE DECIMAL(12,2),
ADD CONSTRAINT "route_summaries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."share_events" DROP CONSTRAINT "share_events_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "certificate_id",
ADD COLUMN     "certificate_id" UUID,
ALTER COLUMN "network" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "share_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."share_templates" DROP CONSTRAINT "share_templates_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR,
ALTER COLUMN "title" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "share_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."upload_batches" DROP CONSTRAINT "upload_batches_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "filename" SET DATA TYPE VARCHAR,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "password_hash" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."webhook_logs" DROP CONSTRAINT "webhook_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "webhook_id",
ADD COLUMN     "webhook_id" UUID NOT NULL,
ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."webhooks" DROP CONSTRAINT "webhooks_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "url" SET DATA TYPE VARCHAR,
ALTER COLUMN "secret" SET DATA TYPE VARCHAR,
ALTER COLUMN "event_types" DROP NOT NULL,
ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."widgets" DROP CONSTRAINT "widgets_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "config_json" DROP NOT NULL,
ADD CONSTRAINT "widgets_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."class_types";

-- DropTable
DROP TABLE "public"."emission_factor_versions";

-- CreateTable
CREATE TABLE "public"."transport_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_classes" (
    "id" UUID NOT NULL,
    "transport_type_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "space_multiplier" DECIMAL(3,2) NOT NULL,
    "comfort_factor" DECIMAL(3,2) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emission_factors" (
    "id" UUID NOT NULL,
    "transport_type_id" UUID NOT NULL,
    "aircraft_category" VARCHAR,
    "service_class_id" UUID NOT NULL,
    "factor_kg_co2_per_km_per_pax" DECIMAL(8,5) NOT NULL,
    "source" VARCHAR NOT NULL,
    "methodology" VARCHAR,
    "confidence_level" VARCHAR,
    "geographic_scope" VARCHAR,
    "version" VARCHAR NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aircraft_emission_overrides" (
    "id" UUID NOT NULL,
    "aircraft_model_id" UUID NOT NULL,
    "service_class_id" UUID NOT NULL,
    "override_factor" DECIMAL(8,5) NOT NULL,
    "reason" TEXT,
    "source" VARCHAR NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aircraft_emission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emission_factor_cache" (
    "id" UUID NOT NULL,
    "cache_key" VARCHAR NOT NULL,
    "transport_type" VARCHAR NOT NULL,
    "aircraft_category" VARCHAR,
    "service_class" VARCHAR NOT NULL,
    "final_factor" DECIMAL(8,5) NOT NULL,
    "source_factor_id" UUID NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factor_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_types_code_key" ON "public"."transport_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_classes_code_key" ON "public"."service_classes"("code");

-- CreateIndex
CREATE INDEX "emission_factors_transport_type_id_aircraft_category_servic_idx" ON "public"."emission_factors"("transport_type_id", "aircraft_category", "service_class_id", "valid_from");

-- CreateIndex
CREATE INDEX "emission_factors_source_version_valid_from_idx" ON "public"."emission_factors"("source", "version", "valid_from");

-- CreateIndex
CREATE INDEX "aircraft_emission_overrides_aircraft_model_id_service_class_idx" ON "public"."aircraft_emission_overrides"("aircraft_model_id", "service_class_id", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_cache_cache_key_key" ON "public"."emission_factor_cache"("cache_key");

-- CreateIndex
CREATE INDEX "emission_factor_cache_cache_key_idx" ON "public"."emission_factor_cache"("cache_key");

-- CreateIndex
CREATE INDEX "emission_factor_cache_expires_at_idx" ON "public"."emission_factor_cache"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "batch_summaries_batch_id_key" ON "public"."batch_summaries"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_hashes_certificate_id_key" ON "public"."certificate_hashes"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_badges_company_id_badge_id_key" ON "public"."company_badges"("company_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_calculation_metrics_company_id_period_month_key" ON "public"."company_calculation_metrics"("company_id", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "public"."company_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_user_roles_company_user_id_role_id_key" ON "public"."company_user_roles"("company_user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_id_user_id_key" ON "public"."company_users"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "emission_calculation_cache_route_cache_id_aircraft_type_pas_key" ON "public"."emission_calculation_cache"("route_cache_id", "aircraft_type", "passengers_range");

-- CreateIndex
CREATE UNIQUE INDEX "emission_summaries_company_id_period_month_key" ON "public"."emission_summaries"("company_id", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "public"."invoices"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_files_batch_id_key" ON "public"."manifest_files"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_period_month_company_id_key" ON "public"."ranking_snapshots"("period_month", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "public"."role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_summaries_company_id_period_month_origin_airport_id_d_key" ON "public"."route_summaries"("company_id", "period_month", "origin_airport_id", "destination_airport_id");

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_domains" ADD CONSTRAINT "company_domains_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_verification_events" ADD CONSTRAINT "company_verification_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_verification_events" ADD CONSTRAINT "company_verification_events_noted_by_user_id_fkey" FOREIGN KEY ("noted_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_user_roles" ADD CONSTRAINT "company_user_roles_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "public"."company_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_user_roles" ADD CONSTRAINT "company_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_batches" ADD CONSTRAINT "upload_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manifest_files" ADD CONSTRAINT "manifest_files_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_aircraft_model_id_fkey" FOREIGN KEY ("aircraft_model_id") REFERENCES "public"."aircraft_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flight_records" ADD CONSTRAINT "flight_records_factors_version_id_fkey" FOREIGN KEY ("factors_version_id") REFERENCES "public"."emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."record_validation_errors" ADD CONSTRAINT "record_validation_errors_flight_record_id_fkey" FOREIGN KEY ("flight_record_id") REFERENCES "public"."flight_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processing_runs" ADD CONSTRAINT "processing_runs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_classes" ADD CONSTRAINT "service_classes_transport_type_id_fkey" FOREIGN KEY ("transport_type_id") REFERENCES "public"."transport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_factors" ADD CONSTRAINT "emission_factors_transport_type_id_fkey" FOREIGN KEY ("transport_type_id") REFERENCES "public"."transport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_factors" ADD CONSTRAINT "emission_factors_service_class_id_fkey" FOREIGN KEY ("service_class_id") REFERENCES "public"."service_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aircraft_emission_overrides" ADD CONSTRAINT "aircraft_emission_overrides_aircraft_model_id_fkey" FOREIGN KEY ("aircraft_model_id") REFERENCES "public"."aircraft_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aircraft_emission_overrides" ADD CONSTRAINT "aircraft_emission_overrides_service_class_id_fkey" FOREIGN KEY ("service_class_id") REFERENCES "public"."service_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_factor_cache" ADD CONSTRAINT "emission_factor_cache_source_factor_id_fkey" FOREIGN KEY ("source_factor_id") REFERENCES "public"."emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_distance_cache" ADD CONSTRAINT "route_distance_cache_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_distance_cache" ADD CONSTRAINT "route_distance_cache_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_summaries" ADD CONSTRAINT "emission_summaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_summaries" ADD CONSTRAINT "route_summaries_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batch_summaries" ADD CONSTRAINT "batch_summaries_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_pricing_overrides" ADD CONSTRAINT "company_pricing_overrides_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_pricing_overrides" ADD CONSTRAINT "company_pricing_overrides_pricing_tier_id_fkey" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_versions" ADD CONSTRAINT "project_pricing_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_versions" ADD CONSTRAINT "project_pricing_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."global_margin_config" ADD CONSTRAINT "global_margin_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quick_calculations" ADD CONSTRAINT "quick_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emission_calculation_cache" ADD CONSTRAINT "emission_calculation_cache_route_cache_id_fkey" FOREIGN KEY ("route_cache_id") REFERENCES "public"."route_distance_cache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compensation_orders" ADD CONSTRAINT "compensation_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compensation_orders" ADD CONSTRAINT "compensation_orders_pricing_tier_id_fkey" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_requests" ADD CONSTRAINT "certificate_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificates" ADD CONSTRAINT "certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificates" ADD CONSTRAINT "certificates_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."certificate_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_hashes" ADD CONSTRAINT "certificate_hashes_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_projects" ADD CONSTRAINT "certificate_projects_project_pricing_version_id_fkey" FOREIGN KEY ("project_pricing_version_id") REFERENCES "public"."project_pricing_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_evidence" ADD CONSTRAINT "project_evidence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_metrics" ADD CONSTRAINT "project_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_partners" ADD CONSTRAINT "project_partners_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_badges" ADD CONSTRAINT "company_badges_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_badges" ADD CONSTRAINT "company_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_events" ADD CONSTRAINT "share_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_events" ADD CONSTRAINT "share_events_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."widgets" ADD CONSTRAINT "widgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entity_attachments" ADD CONSTRAINT "entity_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_events" ADD CONSTRAINT "login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_pricing_audit" ADD CONSTRAINT "project_pricing_audit_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."esg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."company_calculation_metrics" ADD CONSTRAINT "company_calculation_metrics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
