import { DiscussionPost } from "../DiscussionPost";

export interface DiscussionRepository {
    findByProjectId(projectId: string): Promise<DiscussionPost[]>;
    findById(id: string): Promise<DiscussionPost | null>;
    save(post: DiscussionPost): Promise<DiscussionPost>;
}
