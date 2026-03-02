import * as express from "express";
import * as cors from "cors";
import { rateLimit } from "express-rate-limit";
import { usersRouter } from "./users/config/UsersDependencyContainer";
import { imagesRouter } from "./images/config/ImagesDependencyContainer";
import { projectsRouter } from "./projects/config/ProjectsDependencyContainer";


const app = express();

// Trust proxy para que Express identifique correctamente la IP real del usuario detrás del Load Balancer de Google Cloud / Firebase
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000, // Aumentado a 1000 para soportar navegación normal en una SPA
    message: "Too many requests from this IP. Please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: true,
    // Custom keyGenerator to handle undefined IP in Firebase emulator
    keyGenerator: (req) => {
        // x-forwarded-for puede ser un string separado por comas válido
        const forwarded = req.headers["x-forwarded-for"];
        const forwardedIp = typeof forwarded === "string" ? forwarded.split(",")[0] : "127.0.0.1";
        return req.ip || forwardedIp;
    },
    // Disable IP validation for development/emulator compatibility
    validate: { ip: false },
});
app.use(apiLimiter);


// Routing
app.use("/users", usersRouter.getRouter());
app.use("/images", imagesRouter.getRouter());
app.use("/projects", projectsRouter.getRouter());


export { app };
