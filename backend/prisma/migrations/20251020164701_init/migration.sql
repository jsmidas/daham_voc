-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER', 'SITE_MANAGER', 'SITE_STAFF', 'DELIVERY_DRIVER', 'CLIENT');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('HQ', 'YEONGNAM');

-- CreateEnum
CREATE TYPE "MarkerShape" AS ENUM ('CIRCLE', 'SQUARE', 'DIAMOND', 'HEART', 'SPADE', 'CLUB', 'STAR', 'TRIANGLE');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SUPPER');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('SERVING', 'LEFTOVER', 'FACILITY');

-- CreateEnum
CREATE TYPE "FeedbackAuthorType" AS ENUM ('STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NORMAL', 'LATE', 'EARLY_LEAVE', 'OUTSIDE_RANGE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'DELAYED', 'ISSUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SITE_STAFF',
    "division" "Division",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeNo" TEXT,
    "department" TEXT,
    "position" TEXT,
    "managerId" TEXT,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteMenuType" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "menuTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteMenuType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "description" TEXT,
    "markerShape" "MarkerShape" NOT NULL DEFAULT 'CIRCLE',
    "markerColor" TEXT NOT NULL DEFAULT '#1890ff',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SiteGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SiteType" NOT NULL,
    "division" "Division" NOT NULL,
    "groupId" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contactPerson1" TEXT,
    "contactPhone1" TEXT,
    "contactPerson2" TEXT,
    "contactPhone2" TEXT,
    "pricePerMeal" DECIMAL(10,2),
    "deliveryRoute" TEXT,
    "contractStartDate" DATE,
    "contractEndDate" DATE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSite" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "StaffSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "menuItems" TEXT,
    "mongoMetaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMenuTemplate" (
    "id" TEXT NOT NULL,
    "menuTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WeeklyMenuTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPhoto" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mealType" "MealType",
    "photoType" "PhotoType" NOT NULL DEFAULT 'SERVING',
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "feedback" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),
    "mongoMetaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MealPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "FeedbackAuthorType" NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 0,
    "feedbackDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" "MealType",
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "adminReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackImage" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkOutTime" TIMESTAMP(3),
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "breakStartTime" TIMESTAMP(3),
    "breakEndTime" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NORMAL',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSetting" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "expectedCheckIn" TEXT NOT NULL,
    "expectedCheckOut" TEXT NOT NULL,
    "allowedRadius" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealCountSetting" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "deadlineHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "breakfastStartTime" TEXT,
    "lunchStartTime" TEXT,
    "dinnerStartTime" TEXT,
    "breakfastMenuCount" INTEGER NOT NULL DEFAULT 1,
    "lunchMenuCount" INTEGER NOT NULL DEFAULT 1,
    "dinnerMenuCount" INTEGER NOT NULL DEFAULT 1,
    "supperMenuCount" INTEGER NOT NULL DEFAULT 1,
    "breakfastMenu1Name" TEXT,
    "breakfastMenu2Name" TEXT,
    "breakfastMenu3Name" TEXT,
    "breakfastMenu4Name" TEXT,
    "breakfastMenu5Name" TEXT,
    "lunchMenu1Name" TEXT,
    "lunchMenu2Name" TEXT,
    "lunchMenu3Name" TEXT,
    "lunchMenu4Name" TEXT,
    "lunchMenu5Name" TEXT,
    "dinnerMenu1Name" TEXT,
    "dinnerMenu2Name" TEXT,
    "dinnerMenu3Name" TEXT,
    "dinnerMenu4Name" TEXT,
    "dinnerMenu5Name" TEXT,
    "supperMenu1Name" TEXT,
    "supperMenu2Name" TEXT,
    "supperMenu3Name" TEXT,
    "supperMenu4Name" TEXT,
    "supperMenu5Name" TEXT,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCountSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealCount" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "menuNumber" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_route_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "stopNumber" INTEGER NOT NULL,
    "estimatedArrival" TEXT,
    "estimatedDuration" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_assignments" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_logs" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "deliveryDate" DATE NOT NULL,
    "stopNumber" INTEGER NOT NULL,
    "arrivedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivalLat" DOUBLE PRECISION,
    "arrivalLng" DOUBLE PRECISION,
    "departureLat" DOUBLE PRECISION,
    "departureLng" DOUBLE PRECISION,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "actualDuration" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "note" TEXT,
    "issueReported" BOOLEAN NOT NULL DEFAULT false,
    "issueDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_division_idx" ON "User"("division");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeNo_key" ON "Staff"("employeeNo");

-- CreateIndex
CREATE INDEX "Staff_managerId_idx" ON "Staff"("managerId");

-- CreateIndex
CREATE INDEX "Staff_department_idx" ON "Staff"("department");

-- CreateIndex
CREATE INDEX "Staff_employeeNo_idx" ON "Staff"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "MenuType_name_key" ON "MenuType"("name");

-- CreateIndex
CREATE INDEX "MenuType_sortOrder_idx" ON "MenuType"("sortOrder");

-- CreateIndex
CREATE INDEX "SiteMenuType_siteId_idx" ON "SiteMenuType"("siteId");

-- CreateIndex
CREATE INDEX "SiteMenuType_menuTypeId_idx" ON "SiteMenuType"("menuTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteMenuType_siteId_menuTypeId_key" ON "SiteMenuType"("siteId", "menuTypeId");

-- CreateIndex
CREATE INDEX "SiteGroup_division_idx" ON "SiteGroup"("division");

-- CreateIndex
CREATE INDEX "SiteGroup_sortOrder_idx" ON "SiteGroup"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SiteGroup_division_name_key" ON "SiteGroup"("division", "name");

-- CreateIndex
CREATE INDEX "Site_type_idx" ON "Site"("type");

-- CreateIndex
CREATE INDEX "Site_division_idx" ON "Site"("division");

-- CreateIndex
CREATE INDEX "Site_groupId_idx" ON "Site"("groupId");

-- CreateIndex
CREATE INDEX "Site_isActive_idx" ON "Site"("isActive");

-- CreateIndex
CREATE INDEX "StaffSite_staffId_idx" ON "StaffSite"("staffId");

-- CreateIndex
CREATE INDEX "StaffSite_siteId_idx" ON "StaffSite"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSite_staffId_siteId_key" ON "StaffSite"("staffId", "siteId");

-- CreateIndex
CREATE INDEX "Menu_siteId_startDate_idx" ON "Menu"("siteId", "startDate");

-- CreateIndex
CREATE INDEX "Menu_startDate_idx" ON "Menu"("startDate");

-- CreateIndex
CREATE INDEX "WeeklyMenuTemplate_menuTypeId_idx" ON "WeeklyMenuTemplate"("menuTypeId");

-- CreateIndex
CREATE INDEX "WeeklyMenuTemplate_year_weekNumber_idx" ON "WeeklyMenuTemplate"("year", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMenuTemplate_menuTypeId_year_weekNumber_key" ON "WeeklyMenuTemplate"("menuTypeId", "year", "weekNumber");

-- CreateIndex
CREATE INDEX "MealPhoto_siteId_capturedAt_idx" ON "MealPhoto"("siteId", "capturedAt");

-- CreateIndex
CREATE INDEX "MealPhoto_uploaderId_idx" ON "MealPhoto"("uploaderId");

-- CreateIndex
CREATE INDEX "MealPhoto_capturedAt_idx" ON "MealPhoto"("capturedAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_siteId_status_idx" ON "CustomerFeedback"("siteId", "status");

-- CreateIndex
CREATE INDEX "CustomerFeedback_authorId_idx" ON "CustomerFeedback"("authorId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_status_idx" ON "CustomerFeedback"("status");

-- CreateIndex
CREATE INDEX "CustomerFeedback_createdAt_idx" ON "CustomerFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_feedbackDate_idx" ON "CustomerFeedback"("feedbackDate");

-- CreateIndex
CREATE INDEX "FeedbackImage_feedbackId_idx" ON "FeedbackImage"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackImage_feedbackId_sortOrder_idx" ON "FeedbackImage"("feedbackId", "sortOrder");

-- CreateIndex
CREATE INDEX "Attendance_userId_checkInTime_idx" ON "Attendance"("userId", "checkInTime");

-- CreateIndex
CREATE INDEX "Attendance_siteId_checkInTime_idx" ON "Attendance"("siteId", "checkInTime");

-- CreateIndex
CREATE INDEX "Attendance_checkInTime_idx" ON "Attendance"("checkInTime");

-- CreateIndex
CREATE INDEX "AttendanceSetting_siteId_idx" ON "AttendanceSetting"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "MealCountSetting_siteId_key" ON "MealCountSetting"("siteId");

-- CreateIndex
CREATE INDEX "MealCountSetting_siteId_idx" ON "MealCountSetting"("siteId");

-- CreateIndex
CREATE INDEX "MealCount_siteId_date_idx" ON "MealCount"("siteId", "date");

-- CreateIndex
CREATE INDEX "MealCount_date_idx" ON "MealCount"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MealCount_siteId_date_mealType_menuNumber_key" ON "MealCount"("siteId", "date", "mealType", "menuNumber");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_routes_name_key" ON "delivery_routes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_routes_code_key" ON "delivery_routes"("code");

-- CreateIndex
CREATE INDEX "delivery_routes_division_idx" ON "delivery_routes"("division");

-- CreateIndex
CREATE INDEX "delivery_routes_isActive_idx" ON "delivery_routes"("isActive");

-- CreateIndex
CREATE INDEX "delivery_route_stops_routeId_stopNumber_idx" ON "delivery_route_stops"("routeId", "stopNumber");

-- CreateIndex
CREATE INDEX "delivery_route_stops_siteId_idx" ON "delivery_route_stops"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_route_stops_routeId_siteId_key" ON "delivery_route_stops"("routeId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_route_stops_routeId_stopNumber_key" ON "delivery_route_stops"("routeId", "stopNumber");

-- CreateIndex
CREATE INDEX "delivery_assignments_driverId_idx" ON "delivery_assignments"("driverId");

-- CreateIndex
CREATE INDEX "delivery_assignments_routeId_idx" ON "delivery_assignments"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_assignments_routeId_driverId_key" ON "delivery_assignments"("routeId", "driverId");

-- CreateIndex
CREATE INDEX "delivery_logs_deliveryDate_idx" ON "delivery_logs"("deliveryDate");

-- CreateIndex
CREATE INDEX "delivery_logs_driverId_deliveryDate_idx" ON "delivery_logs"("driverId", "deliveryDate");

-- CreateIndex
CREATE INDEX "delivery_logs_routeId_deliveryDate_idx" ON "delivery_logs"("routeId", "deliveryDate");

-- CreateIndex
CREATE INDEX "delivery_logs_status_idx" ON "delivery_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_logs_routeId_siteId_deliveryDate_key" ON "delivery_logs"("routeId", "siteId", "deliveryDate");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMenuType" ADD CONSTRAINT "SiteMenuType_menuTypeId_fkey" FOREIGN KEY ("menuTypeId") REFERENCES "MenuType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMenuType" ADD CONSTRAINT "SiteMenuType_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SiteGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSite" ADD CONSTRAINT "StaffSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSite" ADD CONSTRAINT "StaffSite_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMenuTemplate" ADD CONSTRAINT "WeeklyMenuTemplate_menuTypeId_fkey" FOREIGN KEY ("menuTypeId") REFERENCES "MenuType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPhoto" ADD CONSTRAINT "MealPhoto_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPhoto" ADD CONSTRAINT "MealPhoto_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackImage" ADD CONSTRAINT "FeedbackImage_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSetting" ADD CONSTRAINT "AttendanceSetting_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCountSetting" ADD CONSTRAINT "MealCountSetting_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCount" ADD CONSTRAINT "MealCount_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCount" ADD CONSTRAINT "MealCount_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_route_stops" ADD CONSTRAINT "delivery_route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_route_stops" ADD CONSTRAINT "delivery_route_stops_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
