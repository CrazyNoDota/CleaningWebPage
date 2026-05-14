CREATE TABLE "Setting" (
  "key"       TEXT NOT NULL,
  "value"     JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Seed the director-routing setting so the public endpoint always has a row.
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (
  'director',
  '{"channel":"whatsapp","whatsappPhone":"77055975056","telegramUsername":""}'::jsonb,
  NOW()
);
