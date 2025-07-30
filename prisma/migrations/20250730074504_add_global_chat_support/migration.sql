-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('COMMUNITY', 'GLOBAL');

-- AlterTable
ALTER TABLE "chat_channels" ADD COLUMN     "type" "ChannelType" NOT NULL DEFAULT 'COMMUNITY',
ALTER COLUMN "communityId" DROP NOT NULL;
