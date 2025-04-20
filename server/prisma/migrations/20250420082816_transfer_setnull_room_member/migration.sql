-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_from_member_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_to_member_id_fkey";

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "room_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "room_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
