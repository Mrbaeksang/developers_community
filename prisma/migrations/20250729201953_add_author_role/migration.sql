/*
  Warnings:

  - Added the required column `authorRole` to the `community_announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorRole` to the `community_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorRole` to the `community_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorRole` to the `main_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorRole` to the `main_posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "community_announcements" ADD COLUMN     "authorRole" "CommunityRole" NOT NULL;

-- AlterTable
ALTER TABLE "community_comments" ADD COLUMN     "authorRole" "CommunityRole" NOT NULL;

-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "authorRole" "CommunityRole" NOT NULL;

-- AlterTable
ALTER TABLE "main_comments" ADD COLUMN     "authorRole" "GlobalRole" NOT NULL;

-- AlterTable
ALTER TABLE "main_posts" ADD COLUMN     "authorRole" "GlobalRole" NOT NULL;
