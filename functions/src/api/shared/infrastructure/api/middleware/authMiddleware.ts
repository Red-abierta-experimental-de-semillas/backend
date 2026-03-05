import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        roles: string[];
    };
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "No token provided" });
            return;
        }

        const token = authHeader.split("Bearer ")[1];
        admin.auth().verifyIdToken(token)
            .then(async (decodedToken) => {
                if (!decodedToken.email_verified) {
                    res.status(403).json({ error: "Email not verified" });
                    return;
                }

                try {
                    const userDocRef = admin.firestore().collection("users").doc(decodedToken.uid);
                    const userDoc = await userDocRef.get();

                    let userData = userDoc.data();

                    if (!userDoc.exists || !userData) {
                        // Auto-crear usuario en Firestore para login con Google por primera vez
                        const newUser = {
                            name: decodedToken.name || decodedToken.email || "",
                            image: decodedToken.picture || "",
                            roles: ["USER"],
                            have: [],
                            want: [],
                            offer: [],
                            experience: null,
                            interests: null,
                            location: null,
                            email: decodedToken.email || null
                        };
                        await userDocRef.set(newUser);
                        userData = newUser;
                        console.log(`Auto-created user document for ${decodedToken.uid}`);
                    }

                    // Añadir el usuario al objeto request
                    (req as AuthenticatedRequest).user = {
                        uid: decodedToken.uid,
                        email: decodedToken.email || "",
                        roles: userData.roles || ["USER"]
                    };

                    next();
                } catch (error) {
                    console.error("Firestore error:", error);
                    res.status(500).json({ error: "Database error" });
                }
            })
            .catch(error => {
                console.error("Authentication error:", error);
                res.status(401).json({ error: "Invalid token" });
            });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Middleware para verificar roles
export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Verificar que el usuario está autenticado
        if (!(req as AuthenticatedRequest).user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        const user = (req as AuthenticatedRequest).user;

        // Verificar que el usuario tiene los roles necesarios
        const hasRole = user?.roles.some(role => allowedRoles.includes(role));

        if (!hasRole) {
            res.status(403).json({
                error: "Access denied. You don't have the required permissions."
            });
            return;
        }

        next();
    };
};
