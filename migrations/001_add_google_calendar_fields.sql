-- Migration: Add Google Calendar Integration Fields
-- Created: 2025-12-12
-- Purpose: Add support for Google Calendar synchronization

-- Add Google Calendar sync fields to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_calendar_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_sync_status VARCHAR(20) DEFAULT 'not_synced';

-- Create Google Calendar tokens table
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id SERIAL PRIMARY KEY,
    lawyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date BIGINT,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lawyer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_google_sync ON appointments(lawyer_id, google_calendar_sync_enabled);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_lawyer_id ON google_calendar_tokens(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON appointments(google_calendar_event_id);

-- Add constraint for sync status values
ALTER TABLE appointments 
ADD CONSTRAINT IF NOT EXISTS chk_sync_status 
CHECK (google_calendar_sync_status IN ('not_synced', 'pending', 'synced', 'error'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_google_calendar_tokens_updated_at 
    BEFORE UPDATE ON google_calendar_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN appointments.google_calendar_event_id IS 'Google Calendar event ID for synced appointments';
COMMENT ON COLUMN appointments.google_calendar_sync_enabled IS 'Whether calendar sync is enabled for this appointment';
COMMENT ON COLUMN appointments.google_calendar_sync_status IS 'Current sync status: not_synced, pending, synced, error';
COMMENT ON TABLE google_calendar_tokens IS 'Stores OAuth tokens for Google Calendar API access';
COMMENT ON COLUMN google_calendar_tokens.access_token IS 'OAuth access token for Google Calendar API';
COMMENT ON COLUMN google_calendar_tokens.refresh_token IS 'OAuth refresh token for obtaining new access tokens';
COMMENT ON COLUMN google_calendar_tokens.expiry_date IS 'Unix timestamp when access token expires';
COMMENT ON COLUMN google_calendar_tokens.calendar_id IS 'Google Calendar ID (primary for main calendar)';
COMMENT ON COLUMN google_calendar_tokens.is_active IS 'Whether the calendar connection is active';
