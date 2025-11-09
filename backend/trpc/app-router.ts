import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import createCheckoutSessionProcedure from "@/backend/trpc/routes/stripe/create-checkout-session/route";
import cancelSubscriptionProcedure from "@/backend/trpc/routes/stripe/cancel-subscription/route";
import stripeWebhookProcedure from "@/backend/trpc/routes/stripe/webhook/route";
import { generateVerificationProcedure } from "@/backend/trpc/routes/device/generate-verification/route";
import { verifyDeviceProcedure } from "@/backend/trpc/routes/device/verify-device/route";
import { listDevicesProcedure } from "@/backend/trpc/routes/device/list-devices/route";
import { removeDeviceProcedure } from "@/backend/trpc/routes/device/remove-device/route";
import { getMembershipStatusProcedure } from "@/backend/trpc/routes/membership/get-status/route";
import { logVoiceUsageProcedure } from "@/backend/trpc/routes/membership/log-voice-usage/route";
import { verifyAgeProcedure } from "@/backend/trpc/routes/membership/verify-age/route";
import { createSubscriptionProcedure } from "@/backend/trpc/routes/paypal/create-subscription/route";
import { activateSubscriptionProcedure } from "@/backend/trpc/routes/paypal/activate-subscription/route";
import { cancelSubscriptionProcedure as cancelPayPalSubscriptionProcedure } from "@/backend/trpc/routes/paypal/cancel-subscription/route";
import { getSubscriptionProcedure } from "@/backend/trpc/routes/paypal/get-subscription/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  stripe: createTRPCRouter({
    createCheckoutSession: createCheckoutSessionProcedure,
    cancelSubscription: cancelSubscriptionProcedure,
    webhook: stripeWebhookProcedure,
  }),
  device: createTRPCRouter({
    generateVerification: generateVerificationProcedure,
    verifyDevice: verifyDeviceProcedure,
    listDevices: listDevicesProcedure,
    removeDevice: removeDeviceProcedure,
  }),
  membership: createTRPCRouter({
    getStatus: getMembershipStatusProcedure,
    logVoiceUsage: logVoiceUsageProcedure,
    verifyAge: verifyAgeProcedure,
  }),
  paypal: createTRPCRouter({
    createSubscription: createSubscriptionProcedure,
    activateSubscription: activateSubscriptionProcedure,
    cancelSubscription: cancelPayPalSubscriptionProcedure,
    getSubscription: getSubscriptionProcedure,
  }),
});

export type AppRouter = typeof appRouter;