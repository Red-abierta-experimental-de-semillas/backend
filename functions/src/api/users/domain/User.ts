export type EmailNotificationPreferences = {
    notifyForumPosts: boolean;
    notifyNewProjects: boolean;
    notifyProjectUpdates: boolean;
}

export class User {
    constructor(
        public readonly id: string,
        public name: string,
        public image: string,
        public readonly roles: string[],
        public have: string[],
        public want: string[],
        public offer: string[],
        public experience: string | null = null,
        public interests: string | null = null,
        public location: string | null = null,
        public email: string | null = null,
        public emailNotifications: EmailNotificationPreferences = {
            notifyForumPosts: true,
            notifyNewProjects: true,
            notifyProjectUpdates: true,
        }
    ){
    }

    update(updates: Partial<Omit<User, "id" | "roles" | "email" | "emailNotifications">> & { emailNotifications?: Partial<EmailNotificationPreferences> }) {
        this.name = updates.name ?? this.name;
        this.image = updates.image ?? this.image;
        this.have = updates.have ?? this.have;
        this.want = updates.want ?? this.want;
        this.offer = updates.offer ?? this.offer;
        if (updates.experience !== undefined) this.experience = updates.experience;
        if (updates.interests !== undefined) this.interests = updates.interests;
        if (updates.location !== undefined) this.location = updates.location;
        if (updates.emailNotifications !== undefined) {
            this.emailNotifications = {
                ...this.emailNotifications,
                ...updates.emailNotifications,
            };
        }
    }
}
