import * as admin from "firebase-admin";
import type { EmailNotificationPreferences } from "../../../domain/User";

export interface UserEntity {
    id: string;
    name: string;
    image: string;
    roles: string[];
    have: string[];
    want: string[];
    offer: string[];
    experience: string | null;
    interests: string | null;
    location: string | null;
    email: string | null;
    emailNotifications: EmailNotificationPreferences;
}

export class UserEntity {
    static fromFirestore(doc: admin.firestore.DocumentSnapshot): UserEntity {
        const data = doc.data();
        if (!data) {
            throw new Error(`Document with ID ${doc.id} has no data`);
        }
        return {
            id: doc.id,
            name: data.name,
            image: data.image,
            roles: data.roles ?? [],
            have: data.have ?? [],
            want: data.want ?? [],
            offer: data.offer ?? [],
            experience: data.experience ?? null,
            interests: data.interests ?? null,
            location: data.location ?? null,
            email: data.email ?? null,
            emailNotifications: {
                notifyForumPosts: data.emailNotifications?.notifyForumPosts ?? true,
                notifyNewProjects: data.emailNotifications?.notifyNewProjects ?? true,
                notifyProjectUpdates: data.emailNotifications?.notifyProjectUpdates ?? true,
            },
        };
    }
}
