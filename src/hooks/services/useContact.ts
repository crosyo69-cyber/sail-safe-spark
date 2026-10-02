import { useMutation } from "@tanstack/react-query";
import { contactService, type SendContactEmailBody } from "@/services/contact.service";
import { unwrap } from "@/services/_shared/result";

export const useContact = () => ({
  service: contactService,

  useSendContactEmail: () =>
    useMutation({
      mutationFn: async (body: SendContactEmailBody) =>
        unwrap(await contactService.sendContactEmail(body)),
    }),
});
