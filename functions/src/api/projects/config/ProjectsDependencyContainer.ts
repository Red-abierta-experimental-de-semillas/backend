import { FirestoreProjectRepository } from "../infrastructure/persistence/FirestoreProjectRepository";
import { FirestoreProjectMembershipRepository } from "../infrastructure/persistence/FirestoreProjectMembershipRepository";
import { FirestoreDiscussionRepository } from "../infrastructure/persistence/FirestoreDiscussionRepository";
import { CreateProjectCommandHandler } from "../application/create/CreateProjectCommandHandler";
import { GetProjectQueryHandler } from "../application/get/GetProjectQueryHandler";
import { ListProjectsQueryHandler } from "../application/list/ListProjectsQueryHandler";
import { UpdateProjectCommandHandler } from "../application/update/UpdateProjectCommandHandler";
import { DeleteProjectCommandHandler } from "../application/delete/DeleteProjectCommandHandler";
import { JoinProjectCommandHandler } from "../application/join/JoinProjectCommandHandler";
import { ManageMemberCommandHandler } from "../application/manage-member/ManageMemberCommandHandler";
import { ListProjectMembersQueryHandler } from "../application/list-members/ListProjectMembersQueryHandler";
import { CreateDiscussionPostCommandHandler } from "../application/discussion/CreateDiscussionPostCommandHandler";
import { ListDiscussionPostsQueryHandler } from "../application/discussion/ListDiscussionPostsQueryHandler";
import { ToggleDiscussionLikeCommandHandler } from "../application/discussion/ToggleDiscussionLikeCommandHandler";
import { ProjectController } from "../infrastructure/api/controllers/ProjectController";
import { ProjectsRouter } from "../infrastructure/api/ProjectsRouter";
import { InMemoryCacheService } from "../../shared/infrastructure/cache/InMemoryCacheService";
import { FirebaseCloudStorageService } from "../../shared/infrastructure/storage/FirebaseCloudStorageService";
import { EnvConfigService } from "../../shared/config/EnvConfigService";

const config = new EnvConfigService();
const publicURL = config.getRequired("APP_STORAGE_BASE_URL");

// Repositories
const projectRepository = new FirestoreProjectRepository();
const membershipRepository = new FirestoreProjectMembershipRepository();
const discussionRepository = new FirestoreDiscussionRepository();
const cacheService = new InMemoryCacheService();
const imgService = new FirebaseCloudStorageService(publicURL);

// CQRS - Commands
const createProjectCommandHandler = new CreateProjectCommandHandler(projectRepository, membershipRepository, cacheService, imgService);
const updateProjectCommandHandler = new UpdateProjectCommandHandler(projectRepository, cacheService, imgService);
const deleteProjectCommandHandler = new DeleteProjectCommandHandler(projectRepository, membershipRepository, cacheService);
const joinProjectCommandHandler = new JoinProjectCommandHandler(projectRepository, membershipRepository);
const manageMemberCommandHandler = new ManageMemberCommandHandler(membershipRepository);
const createDiscussionPostCommandHandler = new CreateDiscussionPostCommandHandler(discussionRepository, membershipRepository, imgService);
const toggleDiscussionLikeCommandHandler = new ToggleDiscussionLikeCommandHandler(discussionRepository);


// CQRS - Queries
const getProjectQueryHandler = new GetProjectQueryHandler(projectRepository);
const listProjectsQueryHandler = new ListProjectsQueryHandler(projectRepository, cacheService);
const listProjectMembersQueryHandler = new ListProjectMembersQueryHandler(membershipRepository);
const listDiscussionPostsQueryHandler = new ListDiscussionPostsQueryHandler(discussionRepository);

// Controller
const projectController = new ProjectController(
    createProjectCommandHandler,
    getProjectQueryHandler,
    listProjectsQueryHandler,
    updateProjectCommandHandler,
    deleteProjectCommandHandler,
    joinProjectCommandHandler,
    manageMemberCommandHandler,
    listProjectMembersQueryHandler,
    createDiscussionPostCommandHandler,
    listDiscussionPostsQueryHandler,
    toggleDiscussionLikeCommandHandler
);

// Router
const projectsRouter = new ProjectsRouter(projectController);

export { projectsRouter };
