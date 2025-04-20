-- DropForeignKey
ALTER TABLE "room_members" DROP CONSTRAINT "room_members_user_id_fkey";

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
