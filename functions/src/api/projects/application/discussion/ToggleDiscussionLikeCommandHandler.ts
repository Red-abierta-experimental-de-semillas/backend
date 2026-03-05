import { DiscussionRepository } from "../../domain/repositories/DiscussionRepository";

export class ToggleDiscussionLikeCommand {
    constructor(
        public readonly postId: string,
        public readonly userId: string
    ) { }
}

export class ToggleDiscussionLikeCommandHandler {
    constructor(private readonly discussionRepository: DiscussionRepository) { }

    async handle(command: ToggleDiscussionLikeCommand): Promise<any> {
        const post = await this.discussionRepository.findById(command.postId);
        if (!post) {
            throw new Error(`Discussion post with ID ${command.postId} not found`);
        }

        const likeIndex = post.likedBy.indexOf(command.userId);
        if (likeIndex > -1) {
            post.likedBy.splice(likeIndex, 1);
        } else {
            post.likedBy.push(command.userId);
        }

        await this.discussionRepository.save(post);
        return post;
    }
}
