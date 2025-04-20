-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_room_id_fkey";

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
