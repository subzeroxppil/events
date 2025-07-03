-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'EVENTADMIN');

-- CreateEnum
CREATE TYPE "GroupingStrategy" AS ENUM ('roundRobin', 'maxGroupCapacity');

-- DropForeignKey
ALTER TABLE "project_wa_agent" DROP CONSTRAINT "project_wa_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_agent_availability" DROP CONSTRAINT "project_wa_avail_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_assignment_table" DROP CONSTRAINT "project_wa_assignment_table_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_assignment_table" DROP CONSTRAINT "project_wa_assignment_table_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_contact_updates" DROP CONSTRAINT "project_wa_contact_updates_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation" DROP CONSTRAINT "project_wa_conversation_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation" DROP CONSTRAINT "project_wa_conversation_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_agent_group" DROP CONSTRAINT "project_wa_conversation_agent_group_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_agent_group_member" DROP CONSTRAINT "project_wa_conversation_agent_group_member_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_agent_group_member" DROP CONSTRAINT "project_wa_conversation_agent_group_member_group_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_agent_read_status" DROP CONSTRAINT "project_wa_conversation_agent_read_status_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_agent_read_status" DROP CONSTRAINT "project_wa_conversation_agent_read_status_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_message" DROP CONSTRAINT "project_wa_conversation_message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_conversation_message" DROP CONSTRAINT "project_wa_conversation_message_message_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_flow_state_tracker" DROP CONSTRAINT "project_wa_flow_state_tracker_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_flow_state_transition" DROP CONSTRAINT "project_wa_flow_state_transitions_from_state_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_flow_state_transition" DROP CONSTRAINT "project_wa_flow_state_transitions_to_state_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_flow_state_user_session" DROP CONSTRAINT "project_wa_flow_state_user_session_current_state_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_flow_state_user_session" DROP CONSTRAINT "project_wa_flow_state_user_session_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_incoming_messages" DROP CONSTRAINT "project_wa_incoming_messages_recipient_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_incoming_messages" DROP CONSTRAINT "project_wa_incoming_messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_merchant" DROP CONSTRAINT "project_wa_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_merchant_flow" DROP CONSTRAINT "project_wa_merchant_flow_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_merchant_no_action" DROP CONSTRAINT "project_wa_merchant_no_action_added_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_merchant_no_action" DROP CONSTRAINT "project_wa_merchant_no_action_merchant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_outgoing_messages" DROP CONSTRAINT "project_wa_outgoing_messages_recipient_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_outgoing_messages" DROP CONSTRAINT "project_wa_outgoing_messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "project_wa_team" DROP CONSTRAINT "project_wa_team_agent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "role" DROP CONSTRAINT "fkgg3583634e0ydkacyk8wbbm19";

-- AlterTable
ALTER TABLE "events_portal_admin" DROP COLUMN "role",
ADD COLUMN     "role" "AdminRole" NOT NULL;

-- AlterTable
ALTER TABLE "events_portal_business_unit_mapping" RENAME CONSTRAINT "events_portal_business_unit_mapping_pkey" TO "BusinessUnitMapping_pkey";

-- AlterTable
ALTER TABLE "events_portal_event" DROP COLUMN "groupingStrategy",
ADD COLUMN     "groupingStrategy" "GroupingStrategy";

-- DropTable
DROP TABLE "analyze_image";

-- DropTable
DROP TABLE "bento_ratings";

-- DropTable
DROP TABLE "consignment_transaction";

-- DropTable
DROP TABLE "coupon_dist_unique_visitors";

-- DropTable
DROP TABLE "employee_discount";

-- DropTable
DROP TABLE "eoy_employee";

-- DropTable
DROP TABLE "eoyemployee";

-- DropTable
DROP TABLE "event_prefix";

-- DropTable
DROP TABLE "kombucha_promo_codes";

-- DropTable
DROP TABLE "kombucha_transactions";

-- DropTable
DROP TABLE "nomura_transactions";

-- DropTable
DROP TABLE "ppil_scp_jersey";

-- DropTable
DROP TABLE "ppil_scp_lockers";

-- DropTable
DROP TABLE "ppil_scp_shirt";

-- DropTable
DROP TABLE "ppil_scp_shirt_collection";

-- DropTable
DROP TABLE "ppil_url_redirect";

-- DropTable
DROP TABLE "ppilxnp_billing_agreements";

-- DropTable
DROP TABLE "ppilxnp_merchants";

-- DropTable
DROP TABLE "ppilxnp_passkey_users";

-- DropTable
DROP TABLE "ppilxnp_transactions";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "project_wa_agent";

-- DropTable
DROP TABLE "project_wa_agent_availability";

-- DropTable
DROP TABLE "project_wa_assignment_history";

-- DropTable
DROP TABLE "project_wa_assignment_table";

-- DropTable
DROP TABLE "project_wa_contact_updates";

-- DropTable
DROP TABLE "project_wa_conversation";

-- DropTable
DROP TABLE "project_wa_conversation_agent_group";

-- DropTable
DROP TABLE "project_wa_conversation_agent_group_member";

-- DropTable
DROP TABLE "project_wa_conversation_agent_read_status";

-- DropTable
DROP TABLE "project_wa_conversation_message";

-- DropTable
DROP TABLE "project_wa_conversation_resolution";

-- DropTable
DROP TABLE "project_wa_data_change_reports";

-- DropTable
DROP TABLE "project_wa_feedback";

-- DropTable
DROP TABLE "project_wa_flow_state";

-- DropTable
DROP TABLE "project_wa_flow_state_tracker";

-- DropTable
DROP TABLE "project_wa_flow_state_transition";

-- DropTable
DROP TABLE "project_wa_flow_state_user_session";

-- DropTable
DROP TABLE "project_wa_group_membership_changes";

-- DropTable
DROP TABLE "project_wa_incoming_messages";

-- DropTable
DROP TABLE "project_wa_merchant";

-- DropTable
DROP TABLE "project_wa_merchant_flow";

-- DropTable
DROP TABLE "project_wa_merchant_no_action";

-- DropTable
DROP TABLE "project_wa_merchant_search_record";

-- DropTable
DROP TABLE "project_wa_message_redaction_log";

-- DropTable
DROP TABLE "project_wa_outgoing_messages";

-- DropTable
DROP TABLE "project_wa_team";

-- DropTable
DROP TABLE "project_wa_user";

-- DropTable
DROP TABLE "project_wa_webhook_payload";

-- DropTable
DROP TABLE "project_wa_whatsapp_template";

-- DropTable
DROP TABLE "promo_code";

-- DropTable
DROP TABLE "role";

-- DropTable
DROP TABLE "swagshop_coupons";

-- DropTable
DROP TABLE "swagshop_items";

-- DropTable
DROP TABLE "swagshop_users";

-- DropTable
DROP TABLE "transaction";

-- DropTable
DROP TABLE "transaction_items";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "events_portal_AdminRole";

-- DropEnum
DROP TYPE "events_portal_GroupingStrategy";

-- RenameIndex
ALTER INDEX "events_portal_attendance_userId_eventId_key" RENAME TO "Attendance_userId_eventId_key";

