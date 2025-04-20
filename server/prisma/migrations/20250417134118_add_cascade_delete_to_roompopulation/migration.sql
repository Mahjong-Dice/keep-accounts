-- DropForeignKey
ALTER TABLE "room_population" DROP CONSTRAINT "room_population_room_id_fkey";

-- AddForeignKey
ALTER TABLE "room_population" ADD CONSTRAINT "room_population_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
