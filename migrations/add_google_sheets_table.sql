-- Tabla para vincular itinerarios con Google Sheets exportados
CREATE TABLE IF NOT EXISTS google_sheets_exports (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL UNIQUE REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spreadsheet_id VARCHAR(200) NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_google_sheets_itinerary ON google_sheets_exports(itinerary_id);
CREATE INDEX idx_google_sheets_user ON google_sheets_exports(user_id);
CREATE INDEX idx_google_sheets_spreadsheet ON google_sheets_exports(spreadsheet_id);

-- Comentarios
COMMENT ON TABLE google_sheets_exports IS 'Vínculos entre itinerarios y spreadsheets de Google Sheets';
COMMENT ON COLUMN google_sheets_exports.itinerary_id IS 'ID del itinerario (único - un itinerario = un sheet)';
COMMENT ON COLUMN google_sheets_exports.spreadsheet_id IS 'ID del spreadsheet en Google Sheets';
COMMENT ON COLUMN google_sheets_exports.spreadsheet_url IS 'URL pública del spreadsheet';
