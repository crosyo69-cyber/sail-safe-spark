import { useMutation } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import { unwrap } from "@/services/_shared/result";

export const usePayments = () => ({
  service: paymentService,

  useCreateCheckout: () =>
    useMutation({
      mutationFn: async (body: Record<string, unknown>) =>
        unwrap(await paymentService.createCheckout(body)),
    }),
});