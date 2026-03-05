import type { DiscussionRepository } from "../../domain/repositories/DiscussionRepository";

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

export class ListDiscussionPostsQueryHandler {
    constructor(
        private readonly discussionRepository: DiscussionRepository
    ) {
    }

    async handle(projectId: string): Promise<{ posts: DiscussionPostResult[] }> {
        const posts = await this.discussionRepository.findByProjectId(projectId);

        return {
            posts: posts.map(post => ({
                id: post.id,
                projectId: post.projectId,
                userId: post.userId,
                userName: post.userName,
                userImage: post.userImage,
                content: post.content,
                createdAt: post.createdAt,
                attachments: post.attachments as any,
                replyToPostId: post.replyToPostId,
                likedBy: post.likedBy || []
            }))
        };
    }
}
