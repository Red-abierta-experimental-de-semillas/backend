export interface DiscussionPostAttachment {
    url: string;
    name: string;
    type: "image" | "document";
}

export class DiscussionPost {
    constructor(
        public readonly id: string,
        public readonly projectId: string,
        public readonly userId: string,
        public readonly userName: string,
        public readonly userImage: string,
        public content: string,
        public readonly createdAt: Date = new Date(),
        public readonly attachments: DiscussionPostAttachment[] = [],
        public readonly replyToPostId?: string,
        public likedBy: string[] = []
    ) {
    }
}
