import type { CommandHandler } from "../../../shared/application/CommandHandler";
import type { UserRepository } from "../../domain/UserRepository";
import { UpdateUserCommand } from "./UpdateUserCommand";
import {ImageService} from "../../../shared/application/ImageService";
import {UpdateUserCommandResult} from "./UpdateUserCommandResult";

export class UpdateUserCommandHandler implements CommandHandler<UpdateUserCommand, UpdateUserCommandResult> {
    constructor(
        private readonly repository: UserRepository,
        private readonly imageService: ImageService
    ) {}

    async handle(command: UpdateUserCommand): Promise<UpdateUserCommandResult> {
        const user = await this.repository.findById(command.id);
        if (!user) {
            throw new Error(`User with ID ${command.id} not found`);
        }

        let processedImageUrl = user.image
        if(command.image && command.image !== user.image) {
            processedImageUrl = await this.imageService.process(
                command.image,
                `user-${command.id}`
            );
        }

        user.update({
            name: command.name,
            image: processedImageUrl,
            have: command.have,
            want: command.want,
            offer: command.offer,
            experience: command.experience,
            interests: command.interests,
            location: command.location,
            emailNotifications: command.emailNotifications
        });

        const savedUser = await this.repository.save(user);

        return UpdateUserCommandResult.fromDomain(savedUser);
    }
}
