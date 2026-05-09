import { ManageMemberCommand } from "./ManageMemberCommand";
import type { CommandHandler } from "../../../shared/application/CommandHandler";
import type { ProjectMembershipRepository } from "../../domain/repositories/ProjectMembershipRepository";
import { ManageMemberResult } from "./ManageMemberResult";
import type { ProjectNotificationService } from "../notifications/ProjectNotificationService";

export class ManageMemberCommandHandler implements CommandHandler<ManageMemberCommand, ManageMemberResult> {
    constructor(
        private readonly membershipRepository: ProjectMembershipRepository,
        private readonly notificationService?: ProjectNotificationService
    ) {
    }

    async handle(command: ManageMemberCommand): Promise<ManageMemberResult> {
        const membership = await this.membershipRepository.findById(command.membershipId);

        if (!membership) {
            throw new Error(`Membership with ID ${command.membershipId} not found`);
        }

        if (membership.status !== "PENDING") {
            throw new Error(`Membership ${command.membershipId} has already been processed`);
        }

        if (command.action === "ACCEPTED") {
            membership.accept();
        } else if (command.action === "REJECTED") {
            membership.reject();
        } else {
            throw new Error(`Invalid action: ${command.action}`);
        }

        const savedMembership = await this.membershipRepository.save(membership);
        await this.notificationService?.notifyMembershipDecision(savedMembership);

        return ManageMemberResult.fromDomain(savedMembership);
    }
}
