import type { EmailNotificationPreferences } from "../../domain/User";

export class UpdateUserCommand {
    constructor(
        public readonly id: string,
        public readonly name?: string,
        public readonly image?: string,
        public readonly have?: string[],
        public readonly want?: string[],
        public readonly offer?: string[],
        public readonly experience?: string,
        public readonly interests?: string,
        public readonly location?: string,
        public readonly email?: string,
        public readonly emailNotifications?: Partial<EmailNotificationPreferences>
    ) {}
}
