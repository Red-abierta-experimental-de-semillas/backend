import { CreateDiscussionPostCommand } from "./CreateDiscussionPostCommand";
import type { CommandHandler } from "../../../shared/application/CommandHandler";
import type { DiscussionRepository } from "../../domain/repositories/DiscussionRepository";
import type { ProjectMembershipRepository } from "../../domain/repositories/ProjectMembershipRepository";
import { DiscussionPost } from "../../domain/DiscussionPost";
import type { ImageService } from "../../../shared/application/ImageService";

export interface DiscussionPostResult {
    id: string;
    projectId: string;
    userId: string;
    userName: string;
    userImage: string;
    content: string;
    createdAt: Date;
    attachments: { url: string; name: string; type: "image" | "document" }[];
    replyToPostId?: string;
    likedBy: string[];
}

export class CreateDiscussionPostCommandHandler implements CommandHandler<CreateDiscussionPostCommand, DiscussionPostResult> {
    constructor(
        private readonly discussionRepository: DiscussionRepository,
        private readonly membershipRepository: ProjectMembershipRepository,
        private readonly imageService: ImageService
    ) {
    }

    async handle(command: CreateDiscussionPostCommand): Promise<DiscussionPostResult> {
        if (command.projectId !== "general") {
            const membership = await this.membershipRepository.findByProjectAndUser(
                command.projectId,
                command.userId
            );
            if (!membership || membership.status !== "ACCEPTED") {
                throw new Error("Only accepted project members can post in the discussion forum");
            }
        }

        const attachments = command.attachments || [];
        const processedAttachments = await Promise.all(attachments.map(async attachment => {
            if (attachment.url && attachment.url.startsWith("data:")) {
                if (this.imageService.processFile) {
                    const publicUrl = await this.imageService.processFile(attachment.url, attachment.name || `post-file-${Date.now()}`);
                    return { ...attachment, url: publicUrl };
                } else if (attachment.type === "image") {
                    const publicUrl = await this.imageService.process(attachment.url, `post-${Date.now()}`);
                    return { ...attachment, url: publicUrl };
                }
            }
            return attachment;
        }));

        const post = new DiscussionPost(
            "",
            command.projectId,
            command.userId,
            command.userName,
            command.userImage,
            command.content,
            new Date(),
            processedAttachments,
            command.replyToPostId
        );

        const saved = await this.discussionRepository.save(post);

        return {
            id: saved.id,
            projectId: saved.projectId,
            userId: saved.userId,
            userName: saved.userName,
            userImage: saved.userImage,
            content: saved.content,
            createdAt: saved.createdAt,
            attachments: saved.attachments as any,
            replyToPostId: saved.replyToPostId,
            likedBy: saved.likedBy || []
        };
    }
}
