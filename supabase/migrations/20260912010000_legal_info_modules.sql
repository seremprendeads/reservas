-- Amplía get_public_business_legal_info: agrega los módulos del negocio según
-- su plan, para que los documentos legales describan solo lo que realmente tiene.
DROP FUNCTION IF EXISTS public.get_public_business_legal_info(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_business_legal_info(p_slug TEXT)
RETURNS TABLE (
  business_name TEXT,
  slug          TEXT,
  logo_url      TEXT,
  legal_name    TEXT,
  tax_id        TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  country       TEXT,
  contact_email TEXT,
  phone         TEXT,
  updated_at    TIMESTAMPTZ,
  has_reservas  BOOLEAN,
  has_shop      BOOLEAN,
  has_landing   BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.name, b.slug, b.logo_url,
    l.legal_name, l.tax_id, l.address, l.city, l.province, l.country,
    l.contact_email, l.phone, l.updated_at,
    public.business_has_module(b.id, 'reservas'),
    public.business_has_module(b.id, 'shop'),
    public.business_has_module(b.id, 'landing')
  FROM public.businesses b
  LEFT JOIN public.business_legal_info l ON l.business_id = b.id
  WHERE b.slug = p_slug
    AND b.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_business_legal_info(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business_legal_info(TEXT) TO anon, authenticated, service_role;
