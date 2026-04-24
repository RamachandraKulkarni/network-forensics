import { supabase } from './supabaseClient';

export async function getCurrentSupabaseUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function upsertProfile(profile) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };

  return supabase.from('profiles').upsert(
    {
      id: profile.id,
      display_name: profile.displayName,
      github_username: profile.githubUsername,
      avatar_url: profile.avatarUrl,
      role: profile.role || 'student',
    },
    { onConflict: 'id' },
  );
}

export async function createChatSession({ userId, labId, title }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };

  return supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      lab_id: labId,
      title,
    })
    .select()
    .single();
}

export async function saveChatMessage({ sessionId, userId, role, content, attachments = [] }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };

  return supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      attachments,
    })
    .select()
    .single();
}

export async function saveLabNotes({ userId, labId, content }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };

  return supabase.from('lab_notes').upsert(
    {
      user_id: userId,
      lab_id: labId,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lab_id' },
  );
}
