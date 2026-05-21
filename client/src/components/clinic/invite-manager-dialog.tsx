import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Mail, X, Send, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type InviteRole = "member" | "secretary";

export interface ClinicInvitation {
    id: number;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    inviteCode?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: InviteRole;
    clinicId: number;
    invitations: ClinicInvitation[];
    canInvite: boolean;
    /** Called after a successful mutation so the parent can refetch its data. */
    onChange?: () => void;
}

export function InviteManagerDialog({
    open,
    onOpenChange,
    role,
    clinicId,
    invitations,
    canInvite,
    onChange,
}: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");

    const roleLabel = role === "secretary" ? "secretária" : "profissional";
    const roleLabelCapitalized = role === "secretary" ? "Secretária" : "Profissional";

    const relevantInvites = invitations.filter((i) => {
        const status = i.status.toLowerCase();
        if (status !== "pending" && status !== "expired") return false;
        if (role === "secretary") return i.role === "secretary";
        return i.role !== "secretary";
    });

    const now = Date.now();
    const expired = relevantInvites.filter((i) => {
        const ts = new Date(i.expiresAt).getTime();
        return i.status === "expired" || (Number.isFinite(ts) && ts <= now);
    });
    const active = relevantInvites.filter((i) => !expired.includes(i));

    const reset = () => setEmail("");

    const handleClose = (open: boolean) => {
        if (!open) reset();
        onOpenChange(open);
    };

    const inviteMutation = useMutation({
        mutationFn: async (emailToInvite: string) => {
            const res = await apiRequest("POST", `/api/clinics/${clinicId}/invite`, { email: emailToInvite, role });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || "Erro ao enviar convite");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Convite enviado", description: `O(a) ${roleLabel} receberá um email com o convite.` });
            reset();
            queryClient.invalidateQueries({ queryKey: ["/api/my-clinic"] });
            onChange?.();
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const cancelMutation = useMutation({
        mutationFn: async (invitationId: number) => {
            const res = await apiRequest("DELETE", `/api/clinic/invitations/${invitationId}`);
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || "Erro ao cancelar convite");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Convite cancelado" });
            queryClient.invalidateQueries({ queryKey: ["/api/my-clinic"] });
            onChange?.();
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const handleResend = (invite: ClinicInvitation) => {
        // Resend = create a new invite then drop the old one
        cancelMutation.mutate(invite.id, {
            onSuccess: () => inviteMutation.mutate(invite.email),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Gerenciar convites · {roleLabelCapitalized}</DialogTitle>
                    <DialogDescription>
                        Envie novos convites e acompanhe os pendentes ou expirados.
                    </DialogDescription>
                </DialogHeader>

                {canInvite && (
                    <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/40 p-4">
                        <Label htmlFor="invite-email" className="text-sm font-medium">
                            Novo convite
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder={`email-do(a)-${roleLabel}@exemplo.com`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={() => inviteMutation.mutate(email)}
                                disabled={!email.trim() || inviteMutation.isPending}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {inviteMutation.isPending ? (
                                    <BrandLoader className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Enviar
                            </Button>
                        </div>
                    </div>
                )}

                {(active.length > 0 || expired.length > 0) && (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {active.length > 0 && (
                            <Section title="Aguardando aceite" icon={<Clock className="h-3.5 w-3.5" />}>
                                {active.map((invite) => (
                                    <InviteRow
                                        key={invite.id}
                                        invite={invite}
                                        variant="active"
                                        canManage={canInvite}
                                        onCancel={() => cancelMutation.mutate(invite.id)}
                                        canceling={cancelMutation.isPending}
                                    />
                                ))}
                            </Section>
                        )}

                        {expired.length > 0 && (
                            <Section title="Expirados" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                                {expired.map((invite) => (
                                    <InviteRow
                                        key={invite.id}
                                        invite={invite}
                                        variant="expired"
                                        canManage={canInvite}
                                        onCancel={() => cancelMutation.mutate(invite.id)}
                                        onResend={() => handleResend(invite)}
                                        canceling={cancelMutation.isPending}
                                        resending={inviteMutation.isPending || cancelMutation.isPending}
                                    />
                                ))}
                            </Section>
                        )}
                    </div>
                )}

                {active.length === 0 && expired.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhum convite enviado ainda.
                    </p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                {icon}
                <span>{title}</span>
            </div>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function InviteRow({
    invite,
    variant,
    canManage,
    onCancel,
    onResend,
    canceling,
    resending,
}: {
    invite: ClinicInvitation;
    variant: "active" | "expired";
    canManage: boolean;
    onCancel: () => void;
    onResend?: () => void;
    canceling?: boolean;
    resending?: boolean;
}) {
    const expiresAt = new Date(invite.expiresAt);
    const dateLabel = Number.isFinite(expiresAt.getTime())
        ? expiresAt.toLocaleDateString("pt-BR")
        : "—";
    return (
        <div
            className={cn(
                "flex items-center justify-between rounded-lg border p-2.5",
                variant === "expired" ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/40"
            )}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                    {invite.inviteCode && (
                        <p className="text-[10px] text-muted-foreground">Código: {invite.inviteCode}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                    {variant === "expired" ? `Expirou em ${dateLabel}` : `Expira ${dateLabel}`}
                </Badge>
                {canManage && variant === "expired" && onResend && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResend}
                        disabled={resending}
                        className="h-7 px-2 text-xs text-primary hover:text-primary/90"
                    >
                        {resending ? <BrandLoader className="h-3.5 w-3.5" /> : "Reenviar"}
                    </Button>
                )}
                {canManage && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        disabled={canceling}
                        className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
