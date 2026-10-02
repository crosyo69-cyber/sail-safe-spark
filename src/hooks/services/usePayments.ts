import { useMutation } from "@tanstack/react-query";
import { paymentService, type CreateCheckoutBody } from "@/services/payment.service";
import { unwrap } from "@/services/_shared/result";

export const usePayments = () => ({
  service: paymentService,

  /**
   * The caller supplies the idempotency key (one per payment intention) —
   * see `useDepositCheckout`. `create-checkout` now requires it.
   */
  useCreateCheckout: () =>
    useMutation({
      mutationFn: async (
        { body, idempotencyKey }: { body: CreateCheckoutBody; idempotencyKey: string },
      ) => unwrap(await paymentService.createCheckout(body, idempotencyKey)),
    }),
});
