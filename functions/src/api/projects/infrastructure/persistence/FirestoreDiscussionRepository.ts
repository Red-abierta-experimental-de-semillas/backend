import * as admin from "firebase-admin";
import type { DiscussionRepository } from "../../domain/repositories/DiscussionRepository";
import { DiscussionPost } from "../../domain/DiscussionPost";
import { DiscussionPostEntity } from "./entities/DiscussionPostEntity";

export class FirestoreDiscussionRepository implements DiscussionRepository {
    private readonly COLLECTION = "discussion_posts";

    private get collection() {
        return admin.firestore().collection(this.COLLECTION);
    }

    async findByProjectId(projectId: string): Promise<DiscussionPost[]> {
        const snapshot = await this.collection
            .where("projectId", "==", projectId)
            .orderBy("createdAt", "asc")
            .get();

        return snapshot.docs.map(doc => {
            const entity = DiscussionPostEntity.fromFirestore(doc);
            return new DiscussionPost(
                entity.id,
                entity.projectId,
                entity.userId,
                entity.userName,
                entity.userImage,
                entity.content,
                entity.createdAt,
                entity.attachments as any,
                entity.replyToPostId,
                entity.likedBy
            );
        });
    }

    async findById(id: string): Promise<DiscussionPost | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
            return null;
        }

        const entity = DiscussionPostEntity.fromFirestore(doc);
        return new DiscussionPost(
            entity.id,
            entity.projectId,
            entity.userId,
            entity.userName,
            entity.userImage,
            entity.content,
            entity.createdAt,
            entity.attachments as any,
            entity.replyToPostId,
            entity.likedBy
        );
    }

    async save(post: DiscussionPost): Promise<DiscussionPost> {
        const entity = new DiscussionPostEntity(
            post.id,
            post.projectId,
            post.userId,
            post.userName,
            post.userImage,
            post.content,
            post.createdAt,
            post.attachments,
            post.replyToPostId,
            post.likedBy
        );

        if (entity.id) {
            await this.collection.doc(entity.id).set(entity.toFirestore());
            return post;
        } else {
            const docRef = await this.collection.add(entity.toFirestore());
            return new DiscussionPost(
                docRef.id,
                post.projectId,
                post.userId,
                post.userName,
                post.userImage,
                post.content,
                post.createdAt,
                post.attachments,
                post.replyToPostId,
                post.likedBy
            );
        }
    }
}
