CREATE TABLE IF NOT EXISTS support_tickets (
  date TEXT PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION increment_support_ticket(p_date TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  INSERT INTO support_tickets (date, counter) VALUES (p_date, 1)
  ON CONFLICT (date) DO UPDATE SET counter = support_tickets.counter + 1
  RETURNING counter INTO new_counter;

  RETURN new_counter;
END;
$$;
