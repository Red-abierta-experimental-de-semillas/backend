import { User } from "../../../domain/User";
import { UserEntity } from "../entities/UserEntity";

export class UserMapper {
    static toDomain(entity: UserEntity): User {
        return new User(
            entity.id,
            entity.name,
            entity.image,
            entity.roles,
            entity.have,
            entity.want,
            entity.offer,
            entity.experience,
            entity.interests,
            entity.location,
            entity.email,
            entity.emailNotifications
        );
    }

    static toEntity(user: User): UserEntity {
        return {
            id: user.id,
            name: user.name,
            image: user.image,
            roles: user.roles,
            have: user.have,
            want: user.want,
            offer: user.offer,
            experience: user.experience,
            interests: user.interests,
            location: user.location,
            email: user.email,
            emailNotifications: user.emailNotifications
        };
    }
}