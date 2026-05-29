-- Script để tạo bảng thông báo trên Supabase

CREATE TABLE IF NOT EXISTS public.vnpt_notifications (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" text NOT NULL,
    "timestamp" text NOT NULL,
    "read" boolean DEFAULT false,
    "actionUrl" text,
    "userId" text
);

-- Tắt RLS để front-end có thể thoải mái đọc/ghi (cho mục đích test/demo)
ALTER TABLE public.vnpt_notifications DISABLE ROW LEVEL SECURITY;
