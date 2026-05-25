"use server";
import { createClient } from "@/lib/supabase/server";
import { getUser, logAudit, requireAdmin } from "../user/actions";
import { BASE, BUCKET } from "@/utils/constants";
import { getEnv } from "@/utils/helpers";
import { DraftRow } from "./types";

export async function uploadDraftMedia(
  formData: FormData
): Promise<{ path: string }> {
  const user = await getUser();
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return { path };
}
export async function getSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<{ url: string }> {
  await getUser(); 
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) throw new Error("Could not generate signed URL");

  return { url: data.signedUrl };
}





/**
 * Save or update a draft. Users can only touch their own pending/rejected drafts.
 */
export async function saveDraft(
  content: string,
  metadata: {
    linkUrl?: string;
    mediaPaths?: string[]; // ordered Supabase Storage paths
    scheduledFor?: string; // ISO string
    draftId?: string;      // if updating an existing draft
  } = {}
): Promise<{ id: string }> {
  const user = await getUser();
  const supabase = await createClient();

  const payload = {
    user_id: user.id,
    content,
    link_url: metadata.linkUrl ?? null,
    media_paths: metadata.mediaPaths ?? [],
    scheduled_for: metadata.scheduledFor ?? null,
    status: "pending" as const,
  };

  if (metadata.draftId) {
    // Update — make sure this user owns it and it's still editable
    const { data: existing, error: fetchErr } = await supabase
      .from("post_drafts")
      .select("id, user_id, status")
      .eq("id", metadata.draftId)
      .single();

    if (fetchErr || !existing) throw new Error("Draft not found");
    if (user.role !== "admin" && existing.user_id !== user.id)
      throw new Error("Forbidden");
    if (
      user.role !== "admin" &&
      !["pending", "rejected"].includes(existing.status)
    )
      throw new Error("Draft cannot be edited in its current state");

    const { error } = await supabase
      .from("post_drafts")
      .update(payload)
      .eq("id", metadata.draftId);

    if (error) throw new Error(error.message);

    await logAudit(metadata.draftId, "draft_updated", {
      content_preview: content.slice(0, 120),
    });

    return { id: metadata.draftId };
  }

  // Insert new
  const { data, error } = await supabase
    .from("post_drafts")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit(data.id, "drafted", {
    content_preview: content.slice(0, 120),
    media_count: payload.media_paths.length,
  });

  return { id: data.id };
}

/**
 * Fetch all drafts visible to the current user.
 * Admins see everything; users see only their own.
 */

/**
 * Delete a draft and its associated media files.
 * Users can delete their own pending/rejected drafts; admins can delete any.
 */
export async function deleteDraft(id: string): Promise<void> {
  const user = await getUser();
  const supabase = await createClient();

  const { data: draft, error } = await supabase
    .from("post_drafts")
    .select("id, user_id, status, media_paths")
    .eq("id", id)
    .single();

  if (error || !draft) throw new Error("Draft not found");
  if (user.role !== "admin" && draft.user_id !== user.id)
    throw new Error("Forbidden");
  if (
    user.role !== "admin" &&
    !["pending", "rejected"].includes(draft.status)
  )
    throw new Error("Cannot delete a draft in its current state");

  // Remove storage files
  if (draft.media_paths?.length) {
    await supabase.storage.from(BUCKET).remove(draft.media_paths);
  }

  const { error: delErr } = await supabase
    .from("post_drafts")
    .delete()
    .eq("id", id);

  if (delErr) throw new Error(delErr.message);
  await logAudit(id, "draft_deleted", {});
}

// ─── Admin-only actions ───────────────────────────────────────────────────────

/**
 * Admin: reject a draft with an optional explanation note.
 */
export async function rejectDraft(
  draftId: string,
  note?: string
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("post_drafts")
    .update({ status: "rejected", rejection_note: note ?? null })
    .eq("id", draftId);

  if (error) throw new Error(error.message);
  await logAudit(draftId, "draft_rejected", { note });
}

/**
 * Admin: publish a draft to Facebook.
 * - Uploads Supabase Storage images to Facebook as unpublished photos.
 * - Creates the Facebook post with those photo IDs.
 * - Marks the draft as published with the resulting fb_post_id.
 */
export async function publishDraft(
  draftId: string,
  overrides?: {
    content?: string;       // admin may tweak text before posting
    scheduledFor?: string;  // ISO string — leave undefined to post immediately
  }
): Promise<{ fbPostId: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { token, pageId } = getEnv();

  const draft = await getDraftById(draftId);
  const content = overrides?.content ?? draft.content;

  // 1. Download each file from Supabase Storage and upload to Facebook
  const photoIds: string[] = [];

  for (const storagePath of draft.media_paths) {
    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (dlErr || !blob) {
      throw new Error(`Could not download media: ${storagePath}`);
    }

    const fd = new FormData();
    fd.append("source", blob, storagePath.split("/").pop() ?? "media");
    fd.append("access_token", token);
    fd.append("published", "false");

    const uploadRes = await fetch(`${BASE}/${pageId}/photos`, {
      method: "POST",
      body: fd,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? "Failed to upload photo to Facebook");
    }

    const { id } = await uploadRes.json();
    photoIds.push(id);
  }

  // 2. Build the Facebook post body
  let scheduledUnix: number | undefined;
  const scheduledFor = overrides?.scheduledFor ?? draft.scheduled_for;
  if (scheduledFor) {
    scheduledUnix = Math.floor(new Date(scheduledFor).getTime() / 1000);
  }

  const fbBody: Record<string, unknown> = {
    message: content,
    access_token: token,
  };

  if (photoIds.length > 0) {
    fbBody.attached_media = photoIds.map((id) => ({ media_fbid: id }));
  }

  if (draft.link_url && photoIds.length === 0) {
    fbBody.link = draft.link_url;
  }

  if (scheduledUnix) {
    fbBody.scheduled_publish_time = scheduledUnix;
    fbBody.published = false;
  }

  const postRes = await fetch(`${BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fbBody),
  });

  if (!postRes.ok) {
    const err = await postRes.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to create Facebook post");
  }

  const { id: fbPostId } = await postRes.json();

  // 3. Mark draft as published
  await supabase
    .from("post_drafts")
    .update({ status: "published", fb_post_id: fbPostId })
    .eq("id", draftId);

  await logAudit(draftId, scheduledUnix ? "scheduled" : "published", {
    fb_post_id: fbPostId,
    content_preview: content.slice(0, 120),
    media_count: photoIds.length,
    ...(scheduledUnix && {
      scheduled_for: new Date(scheduledUnix * 1000).toISOString(),
    }),
  });

  return { fbPostId };
}
export async function getDraftById(id: string): Promise<DraftRow> {
  console.log("Fetching draft by ID:", id);
  const user = await getUser()
const supabase =await createClient();

  const { data, error } = await supabase
    .from("post_drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Draft not found");
  if (user.role !== "admin" && data.user_id !== user.id)
    throw new Error("Forbidden");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .single();

  return { ...data, author_name: profile?.full_name ?? null };
}

export async function deleteDraftMedia(path: string): Promise<void> {
  const user = await getUser()

  // Path starts with "{userId}/..." — enforce ownership unless admin
  const ownerId = path.split("/")[0];
  if (user.role !== "admin" && ownerId !== user.id) {
    throw new Error("Forbidden");
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
export async function getDrafts(status?: DraftRow["status"]): Promise<DraftRow[]> {
  const { id, role } = await getUser();

const supabase = await createClient();

  let query = supabase
    .from("post_drafts")
    .select("*")
    .order("created_at", { ascending: false });

  if (role !== "admin") query = query.eq("user_id", id);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const drafts = data ?? [];

  const userIds = [...new Set(drafts.map((d) => d.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  return drafts.map((row) => ({
    ...row,
    author_name: nameMap[row.user_id] ?? null,
  }));
}