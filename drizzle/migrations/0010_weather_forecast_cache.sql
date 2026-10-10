CREATE TABLE public.weather_forecast_cache (
  forecast_date date NOT NULL,
  location text NOT NULL DEFAULT 'almanarre',
  fetched_at timestamptz,
  hourly jsonb,
  status text NOT NULL DEFAULT 'unavailable' CHECK (status IN ('ok','incomplete','unavailable')),
  last_error text,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (forecast_date, location)
);
GRANT SELECT ON public.weather_forecast_cache TO authenticated;
GRANT ALL ON public.weather_forecast_cache TO service_role;
ALTER TABLE public.weather_forecast_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read forecast cache" ON public.weather_forecast_cache
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
COMMENT ON TABLE public.weather_forecast_cache IS 'F-29-03: Open-Meteo next-day forecast cache, written only by the weather-forecast edge function (service_role).';