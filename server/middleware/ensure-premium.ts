import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function ensurePremium(req: Request, res: Response, next: NextFunction) {
  // Admins sempre passam
  if ((req.user as any)?.role === "admin") {
    return next();
  }

  const userId = (req.user as any)?.id;
  if (!userId) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  try {
    const subscription = await storage.getUserSubscription(userId);
    const status = subscription?.status?.toLowerCase();
    const isPaid =
      !!subscription &&
      (status === "active" || status === "trialing");

    if (!isPaid) {
      return res.status(403).json({
        message: "Este recurso está disponível apenas nos planos Vita.",
        code: "PREMIUM_REQUIRED",
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error("[ensurePremium] erro ao verificar assinatura:", error);
    return res.status(500).json({ message: "Não foi possível validar a assinatura." });
  }
}
