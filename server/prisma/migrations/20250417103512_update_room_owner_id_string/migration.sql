-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_owner_id_fkey";

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "owner_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("wxOpenId") ON DELETE CASCADE ON UPDATE CASCADE;
