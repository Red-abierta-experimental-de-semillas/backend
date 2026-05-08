import { CommandHandler } from "../../../shared/application/CommandHandler";
import { CreateProjectCommand } from "./CreateProjectCommand";
import { Project } from "../../domain/Project";
import { ProjectRepository } from "../../domain/repositories/ProjectRepository";
import { ProjectMembershipRepository } from "../../domain/repositories/ProjectMembershipRepository";
import { ProjectMembership } from "../../domain/ProjectMembership";
import { CacheService } from "../../../shared/application/CacheService";
import { ImageService } from "../../../shared/application/ImageService";
import { PROJECTS_LIST_CACHE_KEY } from "../../config/CacheKeys";
import { CreateProjectResult } from "./CreateProjectResult";
import { ProjectNotificationService } from "../notifications/ProjectNotificationService";

export class CreateProjectCommandHandler implements CommandHandler<CreateProjectCommand, CreateProjectResult> {
    constructor(
        private readonly repository: ProjectRepository,
        private readonly membershipRepository: ProjectMembershipRepository,
        private readonly cacheService: CacheService,
        private readonly imageService: ImageService,
        private readonly notificationService?: ProjectNotificationService
    ) {
    }

    async handle(command: CreateProjectCommand): Promise<CreateProjectResult> {

        const processedImageUrl = await this.imageService.process(
            command.image,
            `project-${command.id}`
        );

        const project = new Project(
            command.id,
            command.title,
            command.description,
            processedImageUrl,
            command.owner,
            command.category,
            command.location,
            command.volunteersNeeded,
            command.volunteerRequirements,
            command.status,
            command.tags
        );

        const savedProject = await this.repository.save(project);

        // Crear membresía de OWNER automáticamente
        const ownerMembership = new ProjectMembership(
            "",  // ID autogenerado por Firestore
            savedProject.id,
            command.owner,
            "OWNER",
            "ACCEPTED",
            null,
            new Date()
        );
        await this.membershipRepository.save(ownerMembership);

        this.cacheService.invalidate(PROJECTS_LIST_CACHE_KEY);

        void this.notificationService?.notifyNewProject(savedProject).catch(error => console.error("Error sending new project notifications", error));

        return CreateProjectResult.fromDomain(savedProject);
    }
}
