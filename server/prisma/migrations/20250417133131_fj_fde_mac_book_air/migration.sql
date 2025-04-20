-- DropForeignKey
ALTER TABLE "room_members" DROP CONSTRAINT "room_members_room_id_fkey";

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
