import { Request, Response } from "express";
import { CreateProjectCommandHandler } from "../../../application/create/CreateProjectCommandHandler";
import { GetProjectQueryHandler } from "../../../application/get/GetProjectQueryHandler";
import { ListProjectsQueryHandler } from "../../../application/list/ListProjectsQueryHandler";
import { UpdateProjectCommandHandler } from "../../../application/update/UpdateProjectCommandHandler";
import { DeleteProjectCommandHandler } from "../../../application/delete/DeleteProjectCommandHandler";
import { JoinProjectCommandHandler } from "../../../application/join/JoinProjectCommandHandler";
import { ManageMemberCommandHandler } from "../../../application/manage-member/ManageMemberCommandHandler";
import { ListProjectMembersQueryHandler } from "../../../application/list-members/ListProjectMembersQueryHandler";
import { CreateDiscussionPostCommandHandler } from "../../../application/discussion/CreateDiscussionPostCommandHandler";
import { ListDiscussionPostsQueryHandler } from "../../../application/discussion/ListDiscussionPostsQueryHandler";
import { ToggleDiscussionLikeCommand, ToggleDiscussionLikeCommandHandler } from "../../../application/discussion/ToggleDiscussionLikeCommandHandler";
import { CreateProjectCommand } from "../../../application/create/CreateProjectCommand";
import { GetProjectQuery } from "../../../application/get/GetProjectQuery";
import { UpdateProjectCommand } from "../../../application/update/UpdateProjectCommand";
import { DeleteProjectCommand } from "../../../application/delete/DeleteProjectCommand";
import { JoinProjectCommand } from "../../../application/join/JoinProjectCommand";
import { ManageMemberCommand } from "../../../application/manage-member/ManageMemberCommand";
import { ListProjectMembersQuery } from "../../../application/list-members/ListProjectMembersQuery";
import { CreateDiscussionPostCommand } from "../../../application/discussion/CreateDiscussionPostCommand";
import { ProjectAPIResponse } from "./ProjectAPIResponse";
import { ListProjectAPIResponse } from "./ListProjectAPIResponse";
import { MembershipAPIResponse } from "./MembershipAPIResponse";
import { ListMembershipAPIResponse } from "./ListMembershipAPIResponse";
import { AuthenticatedRequest } from "../../../../shared/infrastructure/api/middleware/authMiddleware";

export class ProjectController {
    constructor(
        private readonly createProjectCommandHandler: CreateProjectCommandHandler,
        private readonly getProjectQueryHandler: GetProjectQueryHandler,
        private readonly listProjectsQueryHandler: ListProjectsQueryHandler,
        private readonly updateProjectCommandHandler: UpdateProjectCommandHandler,
        private readonly deleteProjectCommandHandler: DeleteProjectCommandHandler,
        private readonly joinProjectCommandHandler: JoinProjectCommandHandler,
        private readonly manageMemberCommandHandler: ManageMemberCommandHandler,
        private readonly listProjectMembersQueryHandler: ListProjectMembersQueryHandler,
        private readonly createDiscussionPostCommandHandler: CreateDiscussionPostCommandHandler,
        private readonly listDiscussionPostsQueryHandler: ListDiscussionPostsQueryHandler,
        private readonly toggleDiscussionLikeCommandHandler: ToggleDiscussionLikeCommandHandler
    ) {
    }

    async createProject(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }

            const command = new CreateProjectCommand(
                req.body.id,
                req.body.title,
                req.body.description,
                req.body.image,
                user.uid,
                req.body.category,
                req.body.location,
                req.body.volunteersNeeded,
                req.body.volunteerRequirements,
                req.body.status,
                req.body.tags
            );

            const result = await this.createProjectCommandHandler.handle(command);
            res.status(201).json(new ProjectAPIResponse(
                result.id,
                result.title,
                result.description,
                result.image,
                result.owner,
                result.category,
                result.location,
                result.volunteersNeeded,
                result.volunteerRequirements,
                result.status,
                result.tags,
                result.createdAt,
                result.updatedAt
            ));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }

    async getProject(req: Request, res: Response): Promise<void> {
        try {
            const query = new GetProjectQuery(req.params.id);
            const result = await this.getProjectQueryHandler.handle(query);

            if (!result) {
                res.status(404).json({ error: `Project with ID ${req.params.id} not found` });
                return;
            }

            res.json(new ProjectAPIResponse(
                result.id,
                result.title,
                result.description,
                result.image,
                result.owner,
                result.category,
                result.location,
                result.volunteersNeeded,
                result.volunteerRequirements,
                result.status,
                result.tags,
                result.createdAt,
                result.updatedAt
            ));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: message });
        }
    }

    async listProjects(_req: Request, res: Response): Promise<void> {
        try {
            const result = await this.listProjectsQueryHandler.handle();
            res.json(new ListProjectAPIResponse(result.projects.map(project => new ProjectAPIResponse(
                project.id,
                project.title,
                project.description,
                project.image,
                project.owner,
                project.category,
                project.location,
                project.volunteersNeeded,
                project.volunteerRequirements,
                project.status,
                project.tags,
                project.createdAt,
                project.updatedAt
            ))));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: message });
        }
    }

    async updateProject(req: Request, res: Response): Promise<void> {
        try {
            const command = new UpdateProjectCommand(
                req.params.id,
                req.body.title,
                req.body.description,
                req.body.image,
                req.body.category,
                req.body.location,
                req.body.volunteersNeeded,
                req.body.volunteerRequirements,
                req.body.status,
                req.body.tags
            );

            const response = await this.updateProjectCommandHandler.handle(command);
            res.status(200).json(new ProjectAPIResponse(
                response.id,
                response.title,
                response.description,
                response.image,
                response.owner,
                response.category,
                response.location,
                response.volunteersNeeded,
                response.volunteerRequirements,
                response.status,
                response.tags,
                response.createdAt,
                response.updatedAt
            ));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ error: message });
            } else {
                res.status(400).json({ error: message });
            }
        }
    }

    async deleteProject(req: Request, res: Response): Promise<void> {
        try {
            const command = new DeleteProjectCommand(req.params.id);
            await this.deleteProjectCommandHandler.handle(command);

            res.status(204).send();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ error: message });
            } else {
                res.status(500).json({ error: message });
            }
        }
    }

    async joinProject(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }

            const command = new JoinProjectCommand(
                req.params.id,
                user.uid,
                req.body.message
            );

            const result = await this.joinProjectCommandHandler.handle(command);
            res.status(201).json(new MembershipAPIResponse(
                result.id,
                result.projectId,
                result.userId,
                result.role,
                result.status,
                result.message,
                result.joinedAt
            ));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ error: message });
            } else if (message.includes("already has a membership") || message.includes("not open") || message.includes("is full")) {
                res.status(409).json({ error: message });
            } else {
                res.status(400).json({ error: message });
            }
        }
    }

    async manageMember(req: Request, res: Response): Promise<void> {
        try {
            const command = new ManageMemberCommand(
                req.params.membershipId,
                req.body.action
            );

            const result = await this.manageMemberCommandHandler.handle(command);
            res.status(200).json(new MembershipAPIResponse(
                result.id,
                result.projectId,
                result.userId,
                result.role,
                result.status,
                result.message,
                result.joinedAt
            ));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ error: message });
            } else if (message.includes("already been processed")) {
                res.status(409).json({ error: message });
            } else {
                res.status(400).json({ error: message });
            }
        }
    }

    async listMembers(req: Request, res: Response): Promise<void> {
        try {
            const query = new ListProjectMembersQuery(req.params.id);
            const result = await this.listProjectMembersQueryHandler.handle(query);

            if (!result) {
                res.status(404).json({ error: `Project with ID ${req.params.id} not found` });
                return;
            }

            res.json(new ListMembershipAPIResponse(result.members.map(member => new MembershipAPIResponse(
                member.id,
                member.projectId,
                member.userId,
                member.role,
                member.status,
                member.message,
                member.joinedAt
            ))));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: message });
        }
    }

    // ---- Discussion endpoints ----

    async listDiscussionPosts(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.listDiscussionPostsQueryHandler.handle(req.params.id);
            res.json(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: message });
        }
    }

    async createDiscussionPost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }

            const command = new CreateDiscussionPostCommand(
                req.params.id,
                user.uid,
                req.body.userName || "",
                req.body.userImage || "",
                req.body.content,
                req.body.attachments,
                req.body.replyToPostId
            );

            const result = await this.createDiscussionPostCommandHandler.handle(command);
            res.status(201).json(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("Only accepted")) {
                res.status(403).json({ error: message });
            } else {
                res.status(400).json({ error: message });
            }
        }
    }

    async toggleDiscussionLike(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }

            const command = new ToggleDiscussionLikeCommand(
                req.params.postId,
                user.uid
            );

            const result = await this.toggleDiscussionLikeCommandHandler.handle(command);
            res.status(200).json(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ error: message });
            } else {
                res.status(400).json({ error: message });
            }
        }
    }
}
