delete from public.assistant_prepared_actions
where title in ('Rappel_Credits_A_Exp_Bientot','expiration_credits')
  and status = 'prepared';