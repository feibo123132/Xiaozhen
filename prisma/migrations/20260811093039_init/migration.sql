-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "eventDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "worryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "EventFeature_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventFeature_worryId_fkey" FOREIGN KEY ("worryId") REFERENCES "Worry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Worry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "background" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "lifeAssetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Worry_lifeAssetId_fkey" FOREIGN KEY ("lifeAssetId") REFERENCES "LifeAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifeAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "previewPath" TEXT NOT NULL,
    "growthStagePaths" JSONB NOT NULL,
    "growthThresholds" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "MapPlacement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worryId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MapPlacement_worryId_fkey" FOREIGN KEY ("worryId") REFERENCES "Worry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL,
    "avatarKey" TEXT NOT NULL,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unclaimed',
    "credentialHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Viewpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authorizationConfirmedAt" DATETIME,
    "authorizationNote" TEXT,
    "publishedAt" DATETIME,
    "idempotencyKey" TEXT,
    "worryId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Viewpoint_worryId_fkey" FOREIGN KEY ("worryId") REFERENCES "Worry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewpoint_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "Traveler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "travelerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountToken_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "Traveler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "adminUserId" TEXT,
    "travelerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "Traveler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "viewpointId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RemovalRequest_viewpointId_fkey" FOREIGN KEY ("viewpointId") REFERENCES "Viewpoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RemovalRequest_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "Traveler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyHash" TEXT NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" DATETIME NOT NULL,
    "blockedUntil" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventFeature_eventId_worryId_key" ON "EventFeature"("eventId", "worryId");

-- CreateIndex
CREATE UNIQUE INDEX "EventFeature_eventId_position_key" ON "EventFeature"("eventId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Worry_slug_key" ON "Worry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MapPlacement_worryId_key" ON "MapPlacement"("worryId");

-- CreateIndex
CREATE UNIQUE INDEX "Traveler_publicId_key" ON "Traveler"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Viewpoint_idempotencyKey_key" ON "Viewpoint"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "RemovalRequest_viewpointId_status_idx" ON "RemovalRequest"("viewpointId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthThrottle_keyHash_key" ON "AuthThrottle"("keyHash");
