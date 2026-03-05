export class DiscussionPostEntity {
    constructor(
        public id: string,
        public projectId: string,
        public userId: string,
        public userName: string,
        public userImage: string,
        public content: string,
        public createdAt: Date = new Date(),
        public attachments: { url: string; name: string; type: "image" | "document" }[] = [],
        public replyToPostId?: string,
        public likedBy: string[] = []
    ) {
    }

    static fromFirestore(snapshot: FirebaseFirestore.DocumentSnapshot): DiscussionPostEntity {
        const data = snapshot.data();
        if (!data) {
            throw new Error(`Document with ID ${snapshot.id} has no data`);
        }

        return new DiscussionPostEntity(
            snapshot.id || "",
            data.projectId,
            data.userId,
            data.userName ?? "",
            data.userImage ?? "",
            data.content,
            data.createdAt?.toDate() ?? new Date(),
            data.attachments || [],
            data.replyToPostId,
            data.likedBy || []
        );
    }

    toFirestore(): Record<string, unknown> {
        return {
            projectId: this.projectId,
            userId: this.userId,
            userName: this.userName,
            userImage: this.userImage,
            content: this.content,
            createdAt: this.createdAt,
            attachments: this.attachments,
            replyToPostId: this.replyToPostId ?? null,
            likedBy: this.likedBy
        };
    }
}
