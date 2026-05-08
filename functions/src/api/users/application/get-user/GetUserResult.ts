import {User, type EmailNotificationPreferences} from "../../domain/User";

export class GetUserResult {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly image: string,
        public readonly roles: string[],
        public readonly have: string[],
        public readonly want: string[],
        public readonly offer: string[],
        public readonly experience: string | null,
        public readonly interests: string | null,
        public readonly location: string | null,
        public readonly email: string | null,
        public readonly emailNotifications: EmailNotificationPreferences
    ) {}

    static fromDomain(user: User) {
        return new GetUserResult(
            user.id,
            user.name,
            user.image,
            user.roles,
            user.have,
            user.want,
            user.offer,
            user.experience,
            user.interests,
            user.location,
            user.email,
            user.emailNotifications
        );
    }
}
