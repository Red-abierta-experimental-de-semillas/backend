import { Router } from "express";
import { ProjectController } from "./controllers/ProjectController";
import { authenticate } from "../../../shared/infrastructure/api/middleware/authMiddleware";

export class ProjectsRouter {
    private readonly router: Router;

    constructor(
        private readonly projectController: ProjectController
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Rutas públicas
        this.router.get("/", (req, res) => this.projectController.listProjects(req, res));
        this.router.get("/:id", (req, res) => this.projectController.getProject(req, res));
        this.router.get("/:id/members", (req, res) => this.projectController.listMembers(req, res));

        // Discusiones - listar es público, crear requiere auth
        this.router.get("/:id/discussions", (req, res) => this.projectController.listDiscussionPosts(req, res));
        this.router.post("/:id/discussions",
            authenticate,
            (req, res) => this.projectController.createDiscussionPost(req, res)
        );
        this.router.put("/:id/discussions/:postId/like",
            authenticate,
            (req, res) => this.projectController.toggleDiscussionLike(req, res)
        );

        // Rutas que requieren autenticación
        this.router.post("/",
            authenticate,
            (req, res) => this.projectController.createProject(req, res)
        );
        this.router.put("/:id",
            authenticate,
            (req, res) => this.projectController.updateProject(req, res)
        );
        this.router.delete("/:id",
            authenticate,
            (req, res) => this.projectController.deleteProject(req, res)
        );

        // Unirse a un proyecto (requiere autenticación)
        this.router.post("/:id/join",
            authenticate,
            (req, res) => this.projectController.joinProject(req, res)
        );

        // Gestionar miembros (requiere autenticación)
        this.router.put("/:id/members/:membershipId",
            authenticate,
            (req, res) => this.projectController.manageMember(req, res)
        );
    }

    getRouter(): Router {
        return this.router;
    }
}
