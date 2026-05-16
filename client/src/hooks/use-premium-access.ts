import { useQuery } from "@tanstack/react-query";

interface Subscription {
  status: string;
  planId: number;
  currentPeriodEnd?: string | Date | null;
}
interface SubscriptionPlan {
  name: string;
  id: number;
}
interface UserSubscriptionPayload {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
}

const normalizePlanName = (name?: string | null) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const isPaidPlan = (plan?: SubscriptionPlan | null) => {
  const planName = normalizePlanName(plan?.name);
  if (!planName || planName === "gratuito") return false;
  return planName.includes("vita") || planName !== "gratuito";
};

const isSubscriptionUsable = (subscription?: Subscription | null) => {
  if (!subscription) return false;
  const status = subscription.status?.toLowerCase();
  const hasAccessStatus = status === "active" || status === "trialing";
  if (!hasAccessStatus) return false;
  if (!subscription.currentPeriodEnd) return true;
  const periodEnd = new Date(subscription.currentPeriodEnd);
  return Number.isNaN(periodEnd.getTime()) || periodEnd > new Date();
};

export function usePremiumAccess() {
  const { data, isLoading } = useQuery<UserSubscriptionPayload>({
    queryKey: ["/api/user-subscription"],
    staleTime: 5 * 60 * 1000,
  });

  const hasPremium =
    isSubscriptionUsable(data?.subscription) && isPaidPlan(data?.plan);

  return { hasPremium, isLoading };
}
