-- Add document_urls column to ai_chat_messages table
ALTER TABLE ai_chat_messages ADD COLUMN IF NOT EXISTS document_urls TEXT;

-- Update type enum to include 'document'
ALTER TABLE ai_chat_messages ALTER COLUMN type TYPE VARCHAR(20);
