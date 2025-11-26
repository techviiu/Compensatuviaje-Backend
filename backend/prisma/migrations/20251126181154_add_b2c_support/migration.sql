-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'email');

-- DropForeignKey
ALTER TABLE "certificate_requests" DROP CONSTRAINT "certificate_requests_company_id_fkey";

-- DropForeignKey
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_company_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_company_id_fkey";

-- DropForeignKey
ALTER TABLE "share_events" DROP CONSTRAINT "share_events_company_id_fkey";

-- AlterTable
ALTER TABLE "badge_definitions" ADD COLUMN     "icon_url" VARCHAR;

-- AlterTable
ALTER TABLE "certificate_requests" ADD COLUMN     "b2c_user_id" UUID,
ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "b2c_user_id" UUID,
ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "b2c_user_id" UUID,
ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "share_events" ADD COLUMN     "b2c_user_id" UUID,
ALTER COLUMN "company_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "b2c_users" (
    "id" UUID NOT NULL,
    "supabase_uid" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "provider" "AuthProvider" NOT NULL DEFAULT 'google',
    "preferred_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "preferred_language" VARCHAR(5) NOT NULL DEFAULT 'es',
    "newsletter_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "total_emissions_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_compensated_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_flights" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "b2c_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2c_calculations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "origin_airport" VARCHAR(10) NOT NULL,
    "destination_airport" VARCHAR(10) NOT NULL,
    "service_class" VARCHAR(50) NOT NULL,
    "round_trip" BOOLEAN NOT NULL DEFAULT false,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "distance_km" DECIMAL(10,2) NOT NULL,
    "emissions_kg" DECIMAL(10,2) NOT NULL,
    "is_compensated" BOOLEAN NOT NULL DEFAULT false,
    "compensated_at" TIMESTAMP(3),
    "payment_id" UUID,
    "certificate_id" UUID,
    "calculation_source" "EmissionSource" NOT NULL,
    "saved_trip_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2c_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2c_user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2c_user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2c_ranking_snapshots" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "period_value" VARCHAR(20) NOT NULL,
    "rank_position" INTEGER NOT NULL,
    "total_compensated_kg" DECIMAL(12,2) NOT NULL,
    "total_flights" INTEGER NOT NULL,
    "percentile" DECIMAL(5,2) NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2c_ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2c_saved_trips" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "trips_json" JSONB NOT NULL,
    "total_emissions_kg" DECIMAL(10,2) NOT NULL,
    "total_distance_km" DECIMAL(12,2) NOT NULL,
    "is_compensated" BOOLEAN NOT NULL DEFAULT false,
    "compensated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2c_saved_trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b2c_users_supabase_uid_key" ON "b2c_users"("supabase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "b2c_users_email_key" ON "b2c_users"("email");

-- CreateIndex
CREATE INDEX "b2c_calculations_user_id_is_compensated_idx" ON "b2c_calculations"("user_id", "is_compensated");

-- CreateIndex
CREATE INDEX "b2c_calculations_user_id_created_at_idx" ON "b2c_calculations"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "b2c_user_badges_user_id_badge_id_key" ON "b2c_user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "b2c_ranking_snapshots_period_type_period_value_rank_positio_idx" ON "b2c_ranking_snapshots"("period_type", "period_value", "rank_position");

-- CreateIndex
CREATE UNIQUE INDEX "b2c_ranking_snapshots_user_id_period_type_period_value_key" ON "b2c_ranking_snapshots"("user_id", "period_type", "period_value");

-- CreateIndex
CREATE INDEX "b2c_saved_trips_user_id_is_compensated_idx" ON "b2c_saved_trips"("user_id", "is_compensated");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_b2c_user_id_fkey" FOREIGN KEY ("b2c_user_id") REFERENCES "b2c_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_b2c_user_id_fkey" FOREIGN KEY ("b2c_user_id") REFERENCES "b2c_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_b2c_user_id_fkey" FOREIGN KEY ("b2c_user_id") REFERENCES "b2c_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_b2c_user_id_fkey" FOREIGN KEY ("b2c_user_id") REFERENCES "b2c_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_calculations" ADD CONSTRAINT "b2c_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "b2c_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_calculations" ADD CONSTRAINT "b2c_calculations_saved_trip_id_fkey" FOREIGN KEY ("saved_trip_id") REFERENCES "b2c_saved_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_user_badges" ADD CONSTRAINT "b2c_user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "b2c_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_user_badges" ADD CONSTRAINT "b2c_user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badge_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_ranking_snapshots" ADD CONSTRAINT "b2c_ranking_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "b2c_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2c_saved_trips" ADD CONSTRAINT "b2c_saved_trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "b2c_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
