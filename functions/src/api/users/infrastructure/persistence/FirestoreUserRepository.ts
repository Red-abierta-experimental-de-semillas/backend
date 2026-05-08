import { UserRepository } from "../../domain/UserRepository";
import { User } from "../../domain/User";
import * as admin from "firebase-admin";
import { UserMapper } from "./mappers/UserMapper";
import { UserEntity } from "./entities/UserEntity";

export class FirestoreUserRepository implements UserRepository {
    private db = admin.firestore().collection("users");

    async findById(id: string): Promise<User | null> {
        const snapshot = await this.db.doc(id).get();
        if (!snapshot.exists) return null;

        const userEntity = UserEntity.fromFirestore(snapshot);
        return UserMapper.toDomain(userEntity);
    }

    async findAll(): Promise<User[]> {
        const snapshot = await this.db.get();
        return snapshot.docs.map(doc => UserMapper.toDomain(UserEntity.fromFirestore(doc)));
    }

    async save(user: User): Promise<User> {
        const entity = UserMapper.toEntity(user);
        await this.db.doc(user.id).set(entity, { merge: true });
        return user;
    }
}