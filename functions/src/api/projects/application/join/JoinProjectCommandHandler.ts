import { JoinProjectCommand } from "./JoinProjectCommand";
import type { CommandHandler } from "../../../shared/application/CommandHandler";
import type { ProjectRepository } from "../../domain/repositories/ProjectRepository";
import type { ProjectMembershipRepository } from "../../domain/repositories/ProjectMembershipRepository";
import { ProjectMembership } from "../../domain/ProjectMembership";
import { JoinProjectResult } from "./JoinProjectResult";
import type { ProjectNotificationService } from "../notifications/ProjectNotificationService";

export class JoinProjectCommandHandler implements CommandHandler<JoinProjectCommand, JoinProjectResult> {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly membershipRepository: ProjectMembershipRepository,
        private readonly notificationService?: ProjectNotificationService
    ) {
    }

    async handle(command: JoinProjectCommand): Promise<JoinProjectResult> {
        // Verificar que el proyecto existe
        const project = await this.projectRepository.findById(command.projectId);
        if (!project) {
            throw new Error(`Project with ID ${command.projectId} not found`);
        }

        // Verificar que el proyecto está abierto
        if (project.status !== "OPEN") {
            throw new Error(`Project ${command.projectId} is not open for new volunteers`);
        }

        // Verificar que el usuario no es ya miembro
        const existingMembership = await this.membershipRepository.findByProjectAndUser(
            command.projectId,
            command.userId
        );
        if (existingMembership) {
            throw new Error(`User ${command.userId} already has a membership for project ${command.projectId}`);
        }

        // Verificar límite de voluntarios
        if (project.volunteersNeeded > 0) {
            const allMembers = await this.membershipRepository.findByProjectId(command.projectId);
            const acceptedVolunteers = allMembers.filter(
                m => m.status === "ACCEPTED" && m.role === "VOLUNTEER"
            ).length;
            if (acceptedVolunteers >= project.volunteersNeeded) {
                throw new Error(`Project ${command.projectId} is full. No more volunteers can join.`);
            }
        }

        const membership = new ProjectMembership(
            "",  // ID autogenerado por Firestore
            command.projectId,
            command.userId,
            "VOLUNTEER",
            "PENDING",
            command.message
        );

        const savedMembership = await this.membershipRepository.save(membership);
        await this.notificationService?.notifyMembershipRequested(savedMembership);

        return JoinProjectResult.fromDomain(savedMembership);
    }
}
