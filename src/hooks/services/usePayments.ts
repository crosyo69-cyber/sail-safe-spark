import { useMutation } from "@tanstack/react-query";
import { paymentService, type CreateCheckoutBody } from "@/services/payment.service";
import { unwrap } from "@/services/_shared/result";

export const usePayments = () => ({
  service: paymentService,

  /**
   * No idempotency key by default — see the A4 note in payment.service.ts:
   * `create-checkout` does not honour `Idempotency-Key` yet.
   */
  useCreateCheckout: () =>
    useMutation({
      mutationFn: async (body: CreateCheckoutBody) =>
        unwrap(await paymentService.createCheckout(body)),
    }),
});
