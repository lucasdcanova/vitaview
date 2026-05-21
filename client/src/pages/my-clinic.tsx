import {
  useState } from 'react';
import { useQuery,
  useMutation,
  useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building,
  Users,
  Mail,
  UserPlus,
  Trash2,
  Crown,
  Calendar,
  Settings,
  Clock,
  Edit2,
  Save,
  Star,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PatientHeader from "@/components/patient-header";
import { BrandLoader } from "@/components/ui/brand-loader";
import { isIOSAppShell } from '@/lib/app-shell';
import { useIsMobile } from '@/hooks/use-mobile';
import { PrescriptionHeaderSettings } from "@/components/clinic/prescription-header-settings";
import { InviteManagerDialog, type InviteRole } from "@/components/clinic/invite-manager-dialog";

interface Clinic {
    id: number;
    name: string;
    adminUserId: number;
    subscriptionId?: number | null;
    maxProfessionals: number;
    maxSecretaries: number;
    createdAt?: string;
}

interface UserClinicAccess extends Clinic {
    role: string;
    isActive: boolean;
}

interface ClinicMember {
    id: number;
    username: string;
    fullName: string;
    email: string;
    clinicRole: string;
}

interface ClinicInvitation {
    id: number;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    inviteCode?: string;
}

interface ClinicData {
    clinic: Clinic | null;
    clinics?: UserClinicAccess[];
    activeClinicId?: number | null;
    activeRole?: string | null;
    patientCount?: number;
    members: ClinicMember[];
    invitations: ClinicInvitation[];
    isAdmin: boolean;
    requiresClinicSetup?: boolean;
    canCreateClinic?: boolean;
}

const normalizePlanName = (planName?: string | null) =>
    (planName || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const hasClinicAccessByPlan = (plan?: { name?: string | null; features?: unknown } | null) => {
    const normalizedName = normalizePlanName(plan?.name);
    const normalizedFeatureText = normalizePlanName(
        Array.isArray(plan?.features)
            ? plan.features.join(" ")
            : typeof plan?.features === "string"
                ? plan.features
                : ""
    );

    const hasAccessByName =
        normalizedName.includes("team") ||
        normalizedName.includes("business") ||
        normalizedName.includes("hospital") ||
        normalizedName.includes("clinica");

    const hasAccessByFeatures =
        normalizedFeatureText.includes("equipe") ||
        normalizedFeatureText.includes("profissionais") ||
        normalizedFeatureText.includes("secretaria") ||
        normalizedFeatureText.includes("secretario") ||
        normalizedFeatureText.includes("clinica");

    return hasAccessByName || hasAccessByFeatures;
};

const getSuggestedClinicName = (user?: { fullName?: string | null; username?: string | null } | null) => {
    const rawName = (user?.fullName || user?.username || "").trim();
    if (!rawName) return "Clínica";

    const normalizedUsername = rawName
        .replace(/_/g, " ")
        .split("@")[0]
        .trim();

    const firstName = normalizedUsername.split(/\s+/).filter(Boolean)[0];
    if (!firstName) return "Clínica";

    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    return `Clínica de ${formattedFirstName}`;
};

const MyClinic = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const isMobile = useIsMobile();
    const hideHeaderOnIOSApp = isIOSAppShell();
    const compactIOSClinicLabels = hideHeaderOnIOSApp && isMobile;
    const queryClient = useQueryClient();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isCreateClinicDialogOpen, setIsCreateClinicDialogOpen] = useState(false);
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'secretary'>('member');
    const [clinicName, setClinicName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedClinicName, setEditedClinicName] = useState('');
    const [editingClinicId, setEditingClinicId] = useState<number | null>(null);
    const [deletingClinicId, setDeletingClinicId] = useState<number | null>(null);
    const suggestedClinicName = getSuggestedClinicName(user);

    const openCreateClinicDialog = () => {
        setClinicName((currentValue) => currentValue.trim() ? currentValue : suggestedClinicName);
        setIsCreateClinicDialogOpen(true);
    };

    const { data: clinicData, isLoading, refetch: refetchClinic } = useQuery<ClinicData>({
        queryKey: ['/api/my-clinic', user?.id ?? null, user?.clinicId ?? null],
        enabled: !!user,
    });

    const { data: subscriptionData } = useQuery<any>({
        queryKey: ['/api/user-subscription'],
        enabled: !!user,
    });

    const createClinicMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await apiRequest('POST', '/api/clinics', { name });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao criar clínica'); }
            return res.json();
        },
        onSuccess: async (data) => {
            queryClient.setQueryData(['/api/user'], (currentUser: any) => currentUser ? {
                ...currentUser,
                clinicId: data?.clinic?.id ?? currentUser.clinicId,
                clinicRole: 'admin',
            } : currentUser);

            setIsCreateClinicDialogOpen(false);
            setClinicName('');
            await Promise.all([
                queryClient.invalidateQueries(),
                refetchClinic(),
            ]);
        },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

const selectClinicMutation = useMutation({
        mutationFn: async (clinicId: number) => {
            const res = await apiRequest('POST', '/api/my-clinic/select', { clinicId });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || 'Erro ao selecionar clínica');
            }
            return res.json();
        },
        onSuccess: async (data) => {
            queryClient.setQueryData(['/api/user'], (currentUser: any) => currentUser ? {
                ...currentUser,
                clinicId: data?.clinicId ?? currentUser.clinicId,
                clinicRole: data?.role ?? currentUser.clinicRole,
            } : currentUser);

            await Promise.all([
                queryClient.invalidateQueries(),
                refetchClinic(),
            ]);
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: number) => {
            const clinicId = clinicData?.clinic?.id;
            if (!clinicId) throw new Error('Clínica não encontrada');
            const res = await apiRequest('DELETE', `/api/clinics/${clinicId}/members/${userId}`);
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao remover membro'); }
            return res.json();
        },
        onSuccess: () => { refetchClinic(); },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const cancelInvitationMutation = useMutation({
        mutationFn: async (invitationId: number) => {
            const res = await apiRequest('DELETE', `/api/clinic/invitations/${invitationId}`);
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao cancelar convite'); }
            return res.json();
        },
        onSuccess: () => { toast({ title: 'Convite cancelado' }); refetchClinic(); },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const acceptInviteCodeMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await apiRequest('POST', '/api/clinic-invitations/accept-code', { code });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || 'Erro ao aceitar convite por código');
            }
            return res.json();
        },
        onSuccess: async () => {
            setInviteCodeInput('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['/api/user'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-invitations'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/profiles'] }),
            ]);
            refetchClinic();
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    const updateClinicMutation = useMutation({
        mutationFn: async ({ clinicId, name }: { clinicId: number; name: string }) => {
            const res = await apiRequest('PUT', `/api/clinics/${clinicId}`, { name });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao atualizar clínica'); }
            return res.json();
        },
        onSuccess: async (data, variables) => {
            const updatedClinicName = data?.clinic?.name ?? variables.name;
            setIsEditingName(false);
            setEditingClinicId(null);
            setEditedClinicName(updatedClinicName);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] }),
                refetchClinic(),
            ]);
        },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const setDefaultClinicMutation = useMutation({
        mutationFn: async (clinicId: number) => {
            const res = await apiRequest('PATCH', '/api/user/preferences', {
                preferences: { defaultClinicId: clinicId },
            });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || 'Erro ao definir clínica padrão');
            }
            return res.json();
        },
        onSuccess: (updatedUser, clinicId) => {
            queryClient.setQueryData(['/api/user'], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    const deleteClinicMutation = useMutation({
        mutationFn: async (clinicId: number) => {
            const res = await apiRequest('DELETE', `/api/clinics/${clinicId}`);
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao excluir clínica'); }
            return res.json();
        },
        onSuccess: async () => {
            setDeletingClinicId(null);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['/api/user'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/profiles'] }),
                refetchClinic(),
            ]);
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    const currentPlan = subscriptionData?.plan;
    const isClinicPlan = hasClinicAccessByPlan(currentPlan);
    const clinic = clinicData?.clinic;
    const accessibleClinics = clinicData?.clinics ?? [];
    const canCreateClinic = clinicData?.canCreateClinic !== false;
    const preferences =
        user?.preferences && typeof user.preferences === 'object'
            ? (user.preferences as Record<string, any>)
            : {};
    const defaultClinicId =
        typeof preferences.defaultClinicId === 'number' && Number.isFinite(preferences.defaultClinicId)
            ? preferences.defaultClinicId
            : null;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <BrandLoader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ─── Content renderers ───

    const renderPremiumGate = () => (
        <div className="space-y-6">
            {/* Hero card */}
            <Card className="border border-border shadow-sm overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    <div className="flex flex-col items-center text-center max-w-xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
                            <Sparkles className="h-7 w-7 text-foreground" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                            Gerencie sua clínica com facilidade
                        </h2>
                        <p className="text-muted-foreground text-base leading-relaxed mb-2">
                            Ferramentas completas de equipe, agenda unificada e configurações avançadas para clínicas multiprofissionais.
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                            Disponível nos planos <span className="font-semibold text-foreground">Vita Team</span>, <span className="font-semibold text-foreground">Vita Business</span> e <span className="font-semibold text-foreground">Hospitais</span>.
                        </p>
                        <Button
                            onClick={() => navigate('/subscription')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base rounded-xl"
                            size="lg"
                        >
                            Ver Planos
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Users className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Gestão de Equipe</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Convide profissionais e gerencie sua equipe de forma centralizada.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Calendar className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Agenda Unificada</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Visão consolidada de todos os agendamentos da sua clínica.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Settings className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Controle total sobre dados, permissões e configurações da clínica.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderCreateClinic = () => (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-border">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl border border-border flex items-center justify-center mb-5">
                            <Building className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Criar Clínica Pessoal</h3>
                        <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                            Toda conta profissional precisa estar vinculada a uma clínica. Crie sua clínica pessoal para iniciar com segurança.
                        </p>
                        {!isClinicPlan && (
                            <p className="text-xs text-muted-foreground mb-6 max-w-md">
                                Seu plano atual permite uma clínica pessoal (1 profissional). Para convidar equipe, faça upgrade para um plano de clínica.
                            </p>
                        )}
                        {!canCreateClinic && (
                            <p className="text-xs text-destructive mb-4 max-w-md">
                                Perfis de secretaria não podem criar novas clínicas. Use um convite ou troque para uma conta profissional administradora.
                            </p>
                        )}
                        <Button onClick={openCreateClinicDialog} disabled={!canCreateClinic} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6">
                            <Building className="h-4 w-4 mr-2" />
                            Criar Minha Clínica
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Entrar por Código de Convite
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Para secretárias e profissionais convidados. Use o código gerado pela clínica (enviado por email ou compartilhado pelo administrador).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="inviteCode" className="text-foreground">Código do Convite</Label>
                        <Input
                            id="inviteCode"
                            placeholder="Ex: A1B2C3D4E5"
                            value={inviteCodeInput}
                            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                            className="border-border focus:border-primary uppercase tracking-wider"
                            maxLength={10}
                        />
                    </div>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => acceptInviteCodeMutation.mutate(inviteCodeInput)}
                        disabled={!inviteCodeInput.trim() || acceptInviteCodeMutation.isPending}
                    >
                        {acceptInviteCodeMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
                        Entrar na Clínica
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        O código funciona apenas para convites pendentes enviados ao seu email cadastrado.
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    const renderClinicContent = () => {
        if (!clinic || !clinicData) return null;
        const professionalCount = clinicData.members.filter(m => m.clinicRole === 'admin' || m.clinicRole === 'member').length;
        const showClinicSwitcher = accessibleClinics.length > 1;
        const roleLabel = (role: string) => role === 'admin' ? 'Admin' : role === 'secretary' ? 'Secretaria' : 'Profissional';
        const sortedClinics = [...accessibleClinics].sort((a, b) => {
            const score = (entry: UserClinicAccess) => {
                if (entry.id === clinic.id) return 0;
                if (entry.id === defaultClinicId) return 1;
                return 2;
            };
            return score(a) - score(b);
        });
        const currentClinicAccess = sortedClinics.find((entry) => entry.id === clinic.id);
        return (
            <>
                {/* Clinic header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{clinic.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-muted-foreground">
                                    {professionalCount} / {clinic.maxProfessionals} profissionais
                                </span>
                                {clinicData.isAdmin && (
                                    <Badge className="bg-primary text-primary-foreground text-[10px] rounded-md">
                                        <Crown className="h-3 w-3 mr-1" />Admin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 md:w-[360px] md:items-end">
                        {canCreateClinic && (
                            <Button
                                variant="outline"
                                className={`h-10 rounded-xl border-border px-4 text-sm ${compactIOSClinicLabels ? 'w-full justify-center self-stretch' : 'self-end'}`}
                                onClick={openCreateClinicDialog}
                            >
                                <Building className="h-4 w-4 mr-2" />
                                Nova Clínica
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">Ambientes de Clínica</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {showClinicSwitcher
                                ? "Selecione em qual clínica você vai atender agora e gerencie seus ambientes."
                                : "Visualize o ambiente ativo da sua conta e acompanhe como sua clínica está configurada."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showClinicSwitcher ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sortedClinics.map((accessibleClinic) => {
                                    const isActiveClinic = accessibleClinic.id === clinic.id;
                                    const isDefaultClinic = accessibleClinic.id === defaultClinicId;
                                    const isEditingThisClinic = editingClinicId === accessibleClinic.id;
                                    const canRenameClinic = accessibleClinic.role === 'admin';
                                    return (
                                        <div
                                            key={accessibleClinic.id}
                                            className={`rounded-2xl border p-4 text-left transition-all ${
                                                isActiveClinic
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card hover:border-primary/40"
                                            }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-foreground">{accessibleClinic.name}</p>
                                                            {canRenameClinic && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                                                                    onClick={() => {
                                                                        setEditingClinicId(accessibleClinic.id);
                                                                        setEditedClinicName(accessibleClinic.name);
                                                                    }}
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            {roleLabel(accessibleClinic.role)}
                                                        </Badge>
                                                        {isDefaultClinic && (
                                                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                                                                <Star className="h-3.5 w-3.5 mr-1" />
                                                            Padrão
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant={isActiveClinic ? "default" : "outline"}
                                                        className={isActiveClinic ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
                                                    >
                                                        {isActiveClinic ? "Ativa" : "Disponível"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl bg-primary hover:bg-primary/90"
                                                        onClick={() => {
                                                            if (isActiveClinic || selectClinicMutation.isPending) return;
                                                            selectClinicMutation.mutate(accessibleClinic.id);
                                                        }}
                                                        disabled={isActiveClinic || selectClinicMutation.isPending}
                                                    >
                                                        {isActiveClinic ? 'Em uso agora' : 'Usar nesta sessão'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl"
                                                        onClick={() => setDefaultClinicMutation.mutate(accessibleClinic.id)}
                                                        disabled={isDefaultClinic || setDefaultClinicMutation.isPending}
                                                    >
                                                        <Star className="h-4 w-4 mr-2" />
                                                        {isDefaultClinic ? 'Clínica padrão' : compactIOSClinicLabels ? 'Padrão' : 'Definir como padrão'}
                                                    </Button>
                                                </div>
                                                {canRenameClinic && accessibleClinics.length > 1 && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="ml-auto h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => setDeletingClinicId(accessibleClinic.id)}
                                                        aria-label={`Excluir clínica ${accessibleClinic.name}`}
                                                        title={`Excluir clínica ${accessibleClinic.name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {isEditingThisClinic && (
                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                    <Input
                                                        value={editedClinicName}
                                                        onChange={(e) => setEditedClinicName(e.target.value)}
                                                        placeholder="Nome da clínica"
                                                        className="flex-1 border-border focus:border-primary"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary hover:bg-primary/90"
                                                            onClick={() => updateClinicMutation.mutate({ clinicId: accessibleClinic.id, name: editedClinicName })}
                                                            disabled={!editedClinicName.trim() || updateClinicMutation.isPending}
                                                        >
                                                            {updateClinicMutation.isPending ? <BrandLoader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingClinicId(null);
                                                                setEditedClinicName(clinic.name);
                                                            }}
                                                            className="border-border"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border bg-muted/35 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-foreground">{clinic.name}</p>
                                            {clinicData.isAdmin && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        setEditingClinicId(clinic.id);
                                                        setEditedClinicName(clinic.name);
                                                    }}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {currentClinicAccess?.role && (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    {roleLabel(currentClinicAccess.role)}
                                                </Badge>
                                            )}
                                            {clinic.id === defaultClinicId && (
                                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                                                    <Star className="h-3.5 w-3.5 mr-1" />
                                                    Padrão
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {canCreateClinic
                                                ? "Você está atendendo em uma única clínica no momento, mas já pode estruturar novos ambientes quando precisar."
                                                : "Sua conta está vinculada a este ambiente de clínica. Novos acessos e clínicas adicionais dependem do administrador."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => setDefaultClinicMutation.mutate(clinic.id)}
                                            disabled={clinic.id === defaultClinicId || setDefaultClinicMutation.isPending}
                                        >
                                            <Star className="h-4 w-4 mr-2" />
                                            {clinic.id === defaultClinicId ? 'Clínica padrão' : compactIOSClinicLabels ? 'Padrão' : 'Definir como padrão'}
                                        </Button>
                                    </div>
                                </div>

                                {editingClinicId === clinic.id && (
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={editedClinicName}
                                            onChange={(e) => setEditedClinicName(e.target.value)}
                                            placeholder="Nome da clínica"
                                            className="flex-1 border-border focus:border-primary"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-primary hover:bg-primary/90"
                                                onClick={() => updateClinicMutation.mutate({ clinicId: clinic.id, name: editedClinicName })}
                                                disabled={!editedClinicName.trim() || updateClinicMutation.isPending}
                                            >
                                                {updateClinicMutation.isPending ? <BrandLoader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingClinicId(null);
                                                    setEditedClinicName(clinic.name);
                                                }}
                                                className="border-border"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Equipe — Profissionais + Equipe de Apoio lado a lado */}
                {(() => {
                    const professionals = clinicData.members.filter(m => m.clinicRole === 'admin' || m.clinicRole === 'member');
                    const secretaries = clinicData.members.filter(m => m.clinicRole === 'secretary');
                    const profLimit = clinic.maxProfessionals;
                    const secLimit = clinic.maxSecretaries;
                    const profPendingCount = clinicData.invitations.filter(
                        i => (i.status === 'pending' || i.status === 'expired') && i.role !== 'secretary'
                    ).length;
                    const secPendingCount = clinicData.invitations.filter(
                        i => (i.status === 'pending' || i.status === 'expired') && i.role === 'secretary'
                    ).length;

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Profissionais de Saúde */}
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="flex flex-row items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            Profissionais de Saúde
                                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                                                {professionals.length} / {profLimit}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>Médicos e profissionais vinculados</CardDescription>
                                    </div>
                                    {clinicData.isAdmin && (
                                        <Button
                                            onClick={() => { setInviteRole('member'); setIsInviteDialogOpen(true); }}
                                            size="sm"
                                            className="bg-primary hover:bg-primary/90 rounded-lg shrink-0 relative"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Convidar
                                            {profPendingCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                                                    {profPendingCount}
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {professionals.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:border-gray-400 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                                                        {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-foreground truncate">
                                                            {member.fullName || member.username}
                                                            {member.clinicRole === 'admin' && <Crown className="h-3.5 w-3.5 inline ml-1.5 text-muted-foreground" />}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.email || 'Sem email'}</p>
                                                    </div>
                                                </div>
                                                {clinicData.isAdmin && member.clinicRole !== 'admin' && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.id)}
                                                        disabled={removeMemberMutation.isPending} className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-red-50 shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {professionals.length === 0 && (
                                            <div className="text-center py-6 text-sm text-muted-foreground">
                                                Nenhum profissional vinculado.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Equipe de Apoio */}
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="flex flex-row items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            Equipe de Apoio
                                            <Badge variant="outline" className="border-border text-muted-foreground font-normal">
                                                {secretaries.length} / {secLimit}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>Secretárias e suporte administrativo</CardDescription>
                                    </div>
                                    {clinicData.isAdmin && secLimit > 0 && (
                                        <Button
                                            onClick={() => { setInviteRole('secretary'); setIsInviteDialogOpen(true); }}
                                            size="sm"
                                            variant="outline"
                                            className="border-primary text-primary hover:bg-muted rounded-lg shrink-0 relative"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Convidar
                                            {secPendingCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                                                    {secPendingCount}
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {secretaries.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:border-gray-400 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                                                        {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-foreground truncate">{member.fullName || member.username}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.email || 'Sem email'}</p>
                                                    </div>
                                                </div>
                                                {clinicData.isAdmin && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.id)}
                                                        disabled={removeMemberMutation.isPending} className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10 shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {secretaries.length === 0 && (
                                            <div className="text-center py-6 text-sm text-muted-foreground">
                                                {secLimit > 0 ? 'Nenhuma secretária vinculada.' : 'Seu plano não inclui vagas de apoio.'}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })()}

                {/* Dados da Clínica */}
                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            Dados da Clínica
                        </CardTitle>
                        <CardDescription>Informações gerais e limites do plano</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-xs text-muted-foreground">Nome da Clínica</Label>
                                {isEditingName ? (
                                    <div className="flex gap-2">
                                        <Input value={editedClinicName} onChange={(e) => setEditedClinicName(e.target.value)}
                                            placeholder="Nome da clínica" className="flex-1 border-border focus:border-primary" />
                                        <Button size="sm" className="bg-primary hover:bg-primary/90"
                                            onClick={() => updateClinicMutation.mutate({ clinicId: clinic.id, name: editedClinicName })}
                                            disabled={!editedClinicName.trim() || updateClinicMutation.isPending}>
                                            {updateClinicMutation.isPending ? <BrandLoader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)} className="border-border">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                                        <span className="font-medium text-foreground">{clinic.name}</span>
                                        {clinicData.isAdmin && (
                                            <Button size="sm" variant="ghost" onClick={() => { setEditedClinicName(clinic.name); setIsEditingName(true); }}
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Plano</Label>
                                <div className="p-3 bg-muted rounded-lg border border-border">
                                    <span className="font-medium text-sm text-foreground">{currentPlan?.name || 'Não identificado'}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Pacientes ativos</Label>
                                <div className="p-3 bg-muted rounded-lg border border-border">
                                    <span className="font-medium text-sm text-foreground">{clinicData.patientCount ?? 0}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Limite de profissionais</Label>
                                <div className="p-3 bg-muted rounded-lg border border-border">
                                    <span className="font-medium text-sm text-foreground">{clinic.maxProfessionals}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Limite de equipe de apoio</Label>
                                <div className="p-3 bg-muted rounded-lg border border-border">
                                    <span className="font-medium text-sm text-foreground">{clinic.maxSecretaries}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cabeçalho de documentos */}
                <PrescriptionHeaderSettings />

            </>
        );
    };

    // ─── Main content logic ───
    const renderContent = () => {
        if (clinic) return renderClinicContent();
        return renderCreateClinic();
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {!hideHeaderOnIOSApp && (
                <PatientHeader
                    title="Minha Clínica"
                    description="Gerencie sua equipe, agenda e configurações da clínica."
                    showTitleAsMain={true}
                    fullWidth={true}
                    icon={<Building className="h-6 w-6" />}
                />
            )}
            <div className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
                    {renderContent()}

                    {/* Dialogs */}
                    <Dialog open={isCreateClinicDialogOpen} onOpenChange={setIsCreateClinicDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Criar Clínica</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Defina um nome para sua clínica. Você poderá convidar profissionais para sua equipe.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clinicName" className="text-foreground">Nome da Clínica</Label>
                                    <Input id="clinicName" placeholder={suggestedClinicName} value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)} className="border-border focus:border-primary" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateClinicDialogOpen(false)} className="border-border text-muted-foreground">Cancelar</Button>
                                <Button onClick={() => createClinicMutation.mutate(clinicName)} disabled={!clinicName.trim() || createClinicMutation.isPending}
                                    className="bg-primary hover:bg-primary/90">
                                    {createClinicMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
                                    Criar Clínica
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={!!deletingClinicId} onOpenChange={(open) => { if (!open) setDeletingClinicId(null); }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">Excluir Clínica</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Todos os dados desta clínica (membros, convites) serão removidos permanentemente.
                                    Pacientes e prontuários não serão afetados.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeletingClinicId(null)} className="border-border">Cancelar</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => { if (deletingClinicId) deleteClinicMutation.mutate(deletingClinicId); }}
                                    disabled={deleteClinicMutation.isPending}
                                >
                                    {deleteClinicMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
                                    Excluir permanentemente
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {clinicData?.clinic && (
                        <InviteManagerDialog
                            open={isInviteDialogOpen}
                            onOpenChange={setIsInviteDialogOpen}
                            role={inviteRole}
                            clinicId={clinicData.clinic.id}
                            invitations={clinicData.invitations}
                            canInvite={clinicData.isAdmin}
                            onChange={() => refetchClinic()}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyClinic;
