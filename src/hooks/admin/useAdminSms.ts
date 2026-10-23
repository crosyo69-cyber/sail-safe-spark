import { useMutation } from "@tanstack/react-query";
import {
  smsService,
  type AppointmentSmsRequest,
  type AppointmentSmsResponse,
} from "@/services/sms.service";
import { unwrap } from "@/services/_shared/result";

/**
 * Envoi manuel de SMS de rendez-vous depuis « Gestion des journées ».
 * Aucun envoi automatique : la mutation n'est déclenchée que par la
 * confirmation explicite du moniteur dans le dialogue de prévisualisation.
 */
export const useAdminSms = () => {
  const send = useMutation({
    mutationFn: async (body: AppointmentSmsRequest): Promise<AppointmentSmsResponse> =>
      unwrap(await smsService.sendAppointmentSms(body)),
  });

  return { send };
};
