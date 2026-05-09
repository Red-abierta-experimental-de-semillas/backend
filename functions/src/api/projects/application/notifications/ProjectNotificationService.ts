import type { EmailService } from "../../../shared/application/EmailService";
import type { ProjectMembershipRepository } from "../../domain/repositories/ProjectMembershipRepository";
import type { ProjectRepository } from "../../domain/repositories/ProjectRepository";
import type { UserRepository } from "../../../users/domain/UserRepository";
import type { User } from "../../../users/domain/User";
import type { Project } from "../../domain/Project";
import type { DiscussionPost } from "../../domain/DiscussionPost";
import type { ProjectMembership } from "../../domain/ProjectMembership";

export class ProjectNotificationService {
    private readonly frontendUrl: string;

    constructor(
        private readonly emailService: EmailService,
        private readonly userRepository: UserRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly membershipRepository: ProjectMembershipRepository
    ) {
        this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    }

    async notifyNewProject(project: Project): Promise<void> {
        const users = await this.userRepository.findAll();
        const recipients = users.filter(user => user.id !== project.owner && this.wants(user, "notifyNewProjects"));
        await this.sendMany(recipients, {
            subject: `Nuevo proyecto en RAES: ${project.title}`,
            title: "Nuevo proyecto publicado",
            intro: `Se ha publicado un nuevo proyecto en la Red Abierta Experimental de Semillas: ${project.title}.`,
            body: this.truncate(project.description, 260),
            url: `${this.frontendUrl}/projects/${project.id}`,
            cta: "Ver proyecto",
        });
    }

    async notifyProjectUpdated(project: Project): Promise<void> {
        const recipients = await this.getAcceptedProjectUsers(project.id, "notifyProjectUpdates");
        await this.sendMany(recipients, {
            subject: `Actualización en proyecto RAES: ${project.title}`,
            title: "Proyecto actualizado",
            intro: `Hay cambios en el proyecto del que formas parte: ${project.title}.`,
            body: this.truncate(project.description, 260),
            url: `${this.frontendUrl}/projects/${project.id}`,
            cta: "Ver cambios",
        });
    }

    async notifyNewDiscussionPost(projectId: string, post: DiscussionPost): Promise<void> {
        if (projectId === "general") return;

        const project = await this.projectRepository.findById(projectId);
        if (!project) return;

        const recipients = (await this.getAcceptedProjectUsers(projectId, "notifyForumPosts"))
            .filter(user => user.id !== post.userId);

        await this.sendMany(recipients, {
            subject: `Nuevo mensaje en ${project.title}`,
            title: "Nuevo mensaje en el foro",
            intro: `${post.userName || "Un miembro"} ha escrito en el foro de ${project.title}.`,
            body: this.truncate(post.content, 320),
            url: `${this.frontendUrl}/projects/${project.id}/forum`,
            cta: "Leer mensaje",
        });
    }

    async notifyMembershipRequested(membership: ProjectMembership): Promise<void> {
        const project = await this.projectRepository.findById(membership.projectId);
        if (!project) return;

        const owner = await this.userRepository.findById(project.owner);
        const requester = await this.userRepository.findById(membership.userId);
        if (!owner?.email) return;

        await this.sendOne(owner, {
            subject: `Nueva solicitud para unirse a ${project.title}`,
            title: "Nueva solicitud de participación",
            intro: `${requester?.name || "Un usuario"} ha pedido unirse a tu proyecto: ${project.title}.`,
            body: membership.message || "La solicitud no incluye mensaje.",
            url: `${this.frontendUrl}/projects/${project.id}`,
            cta: "Revisar solicitud",
            footer: `Este correo se envía porque eres el creador del proyecto ${project.title}.`,
        });
    }

    async notifyMembershipDecision(membership: ProjectMembership): Promise<void> {
        const project = await this.projectRepository.findById(membership.projectId);
        if (!project) return;

        const requester = await this.userRepository.findById(membership.userId);
        if (!requester?.email) return;

        const accepted = membership.status === "ACCEPTED";
        await this.sendOne(requester, {
            subject: accepted
                ? `Tu solicitud para ${project.title} ha sido aceptada`
                : `Tu solicitud para ${project.title} no ha sido aceptada`,
            title: accepted ? "Solicitud aceptada" : "Solicitud cancelada",
            intro: accepted
                ? `El creador del proyecto ha aceptado tu solicitud para unirte a ${project.title}.`
                : `El creador del proyecto ha cancelado o rechazado tu solicitud para unirte a ${project.title}.`,
            body: accepted
                ? "Ya formas parte del proyecto y puedes participar en su foro."
                : "Puedes explorar otros proyectos abiertos en RAES.",
            url: accepted ? `${this.frontendUrl}/projects/${project.id}/forum` : `${this.frontendUrl}/projects`,
            cta: accepted ? "Ir al foro" : "Ver proyectos",
            footer: "Este correo se envía para informarte del estado de tu solicitud de participación.",
        });
    }

    private async getAcceptedProjectUsers(projectId: string, preference: keyof User["emailNotifications"]): Promise<User[]> {
        const memberships = await this.membershipRepository.findByProjectId(projectId);
        const accepted = memberships.filter(m => m.status === "ACCEPTED");
        const users = await Promise.all(accepted.map(m => this.userRepository.findById(m.userId)));
        return users.filter((user): user is User => Boolean(user?.email && this.wants(user, preference)));
    }

    private wants(user: User, preference: keyof User["emailNotifications"]): boolean {
        if (!user.email) return false;
        return user.emailNotifications?.[preference] !== false;
    }

    private async sendMany(users: User[], payload: { subject: string; title: string; intro: string; body: string; url: string; cta: string }): Promise<void> {
        const recipients = users.filter((user): user is User & { email: string } => Boolean(user.email));
        await Promise.allSettled(recipients.map(user => this.emailService.send({
            to: user.email!,
            subject: payload.subject,
            text: `${payload.intro}\n\n${payload.body}\n\n${payload.cta}: ${payload.url}\n\nPuedes cambiar tus suscripciones desde tu perfil: ${this.frontendUrl}/profile`,
            html: this.renderHtml(payload, `${this.frontendUrl}/profile`),
        })));
    }

    private async sendOne(user: User, payload: { subject: string; title: string; intro: string; body: string; url: string; cta: string; footer: string }): Promise<void> {
        await this.emailService.send({
            to: user.email!,
            subject: payload.subject,
            text: `${payload.intro}\n\n${payload.body}\n\n${payload.cta}: ${payload.url}\n\n${payload.footer}`,
            html: this.renderHtml(payload, undefined, payload.footer),
        });
    }

    private renderHtml(payload: { title: string; intro: string; body: string; url: string; cta: string }, profileUrl?: string, footer?: string): string {
        const footerHtml = footer
            ? this.escape(footer)
            : `Recibes este correo por tus suscripciones de RAES. Puedes cambiar tus preferencias o desuscribirte desde <a href="${profileUrl}">tu perfil</a>.`;

        return `
            <div style="font-family:Arial,sans-serif;line-height:1.55;color:#172018;max-width:640px;margin:auto;padding:24px">
                <h1 style="color:#1f4a2d">${this.escape(payload.title)}</h1>
                <p>${this.escape(payload.intro)}</p>
                <blockquote style="border-left:4px solid #2f6b3f;padding-left:16px;color:#617064">${this.escape(payload.body)}</blockquote>
                <p><a href="${payload.url}" style="display:inline-block;background:#2f6b3f;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">${this.escape(payload.cta)}</a></p>
                <hr style="border:none;border-top:1px solid #e8f3dc;margin:24px 0" />
                <p style="font-size:13px;color:#617064">${footerHtml}</p>
            </div>
        `;
    }

    private truncate(value: string, max: number): string {
        if (!value) return "";
        return value.length > max ? `${value.slice(0, max)}…` : value;
    }

    private escape(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
}
