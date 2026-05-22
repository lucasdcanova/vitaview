import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface OnboardingStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
    route?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'minha-clinica',
        target: '[data-tour="nav-minha-clinica"]',
        title: '1. Minha Clínica',
        description: 'Comece configurando aqui os dados da sua clínica: nome, endereço, telefone e o cabeçalho dos receituários, atestados e laudos. É o que dá identidade aos seus documentos.',
        placement: 'right',
        route: '/minha-clinica'
    },
    {
        id: 'agenda',
        target: '[data-tour="nav-agenda"]',
        title: '2. Agenda',
        description: 'Organize seus atendimentos. Aqui você visualiza e gerencia todas as suas consultas agendadas do dia e da semana.',
        placement: 'right',
        route: '/agenda'
    },
    {
        id: 'pacientes',
        target: '[data-tour="nav-pacientes"]',
        title: '3. Pacientes',
        description: 'Gerencie sua base de pacientes. Ao acessar um paciente, você poderá registrar toda a anamnese, histórico clínico e evoluções de forma detalhada e segura.',
        placement: 'right',
        route: '/pacientes'
    },
    {
        id: 'vita-assist',
        target: '[data-tour="nav-vita-assist"]',
        title: '4. Vita Assist',
        description: 'Seu assistente de IA para medicina. Tire dúvidas clínicas, consulte protocolos e obtenha suporte inteligente para suas decisões médicas.',
        placement: 'right',
        route: '/vita-assist'
    },
    {
        id: 'subscription',
        target: '[data-tour="nav-assinatura"]',
        title: '5. Minha Assinatura',
        description: 'Gerencie seu plano, faturas e métodos de pagamento. Acompanhe o status da sua assinatura e faça upgrades conforme sua necessidade.',
        placement: 'right',
        route: '/subscription'
    },
    {
        id: 'reports',
        target: '[data-tour="nav-relatorios"]',
        title: '6. Relatórios',
        description: 'Acompanhe métricas detalhadas da sua clínica ou consultório. Visualize dados financeiros, volume de atendimentos e estatísticas de saúde dos seus pacientes.',
        placement: 'right',
        route: '/reports'
    },
    {
        id: 'settings',
        target: '[data-tour="nav-configuracoes"]',
        title: '7. Configurações',
        description: 'Personalize sua experiência. Aqui você completa seu perfil profissional, adiciona CRM/RQE e ajusta suas preferências de atendimento.',
        placement: 'right',
        route: '/profile'
    },
];

const ONBOARDING_STORAGE_KEY = 'vitaview_onboarding_completed';

export function useOnboarding() {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Check both DB preferences and localStorage (as fallback/cache)
    const [isCompleted, setIsCompleted] = useState(() => {
        // If user has preference set, honor it
        if (user?.preferences && (user.preferences as any).onboardingCompleted) {
            return true;
        }
        // Fallback to local storage (for immediate feedback or logged out users)
        return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    });

    // Update state when user data loads
    useEffect(() => {
        if (user?.preferences && (user.preferences as any).onboardingCompleted) {
            setIsCompleted(true);
        }
    }, [user]);

    // Start the tour, optionally at a specific step
    const startTour = useCallback((startAt: number = 0) => {
        const clamped = Math.max(0, Math.min(startAt, ONBOARDING_STEPS.length - 1));
        setCurrentStep(clamped);
        setIsActive(true);
    }, []);

    // Complete the tour
    const completeTour = useCallback(async () => {
        // Optimistic update
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        setIsCompleted(true);
        setIsActive(false);

        // Save to backend if user is logged in
        if (user) {
            try {
                await apiRequest('PATCH', '/api/user/preferences', {
                    preferences: { onboardingCompleted: true }
                });
                // Invalidate query to ensure fresh data
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            } catch (error) {
                console.error("Failed to save onboarding completion to server:", error);
            }
        }
    }, [user]);

    // Go to next step
    const nextStep = useCallback(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTour();
        }
    }, [currentStep, completeTour]);

    // Go to previous step
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    // Skip the tour
    const skipTour = useCallback(() => {
        completeTour();
    }, [completeTour]);

    // Tour start is now triggered explicitly by the clinic setup welcome dialog,
    // not auto-started on login. This avoids overlapping with the dialog and lets
    // existing users who already configured their clinic stay focused on their work.

    return {
        steps: ONBOARDING_STEPS,
        currentStep,
        currentStepData: ONBOARDING_STEPS[currentStep],
        isActive,
        isCompleted,
        totalSteps: ONBOARDING_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
    };
}
