import { supabase } from "./supabase.js";

export async function getBusinesses(term = "") {
  let q = supabase.from("businesses").select("id,name,slug,category,description,address,phone").eq("is_active", true).order("name");
  if (term.trim()) q = q.or(`name.ilike.%${term.trim()}%,category.ilike.%${term.trim()}%,description.ilike.%${term.trim()}%`);
  const { data, error } = await q.limit(30);
  if (error) throw error;
  return data || [];
}
export async function getBusinessBySlug(slug) {
  const { data, error } = await supabase.from("businesses").select("id,name,slug,category,description,address,phone").eq("slug", slug).eq("is_active", true).single();
  if (error) throw error;
  return data;
}
export async function getServices(businessId, activeOnly = true) {
  let q = supabase.from("services").select("*").eq("business_id", businessId).order("name");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function saveBusiness(userId, payload) {
  const { data: existing, error: findError } = await supabase.from("businesses").select("id").eq("owner_id", userId).maybeSingle();
  if (findError) throw findError;
  const query = existing
    ? supabase.from("businesses").update(payload).eq("id", existing.id).select().single()
    : supabase.from("businesses").insert({ ...payload, owner_id: userId }).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function getMyBusiness(userId) {
  const { data, error } = await supabase.from("businesses").select("*").eq("owner_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function addService(businessId, payload) {
  const { data, error } = await supabase.from("services").insert({ ...payload, business_id: businessId }).select().single();
  if (error) throw error;
  return data;
}
export async function getHours(businessId) {
  const { data, error } = await supabase.from("business_hours").select("*").eq("business_id", businessId).order("weekday");
  if (error) throw error;
  return data || [];
}
export async function saveHours(businessId, rows) {
  for (const row of rows) {
    const { error } = await supabase.from("business_hours").upsert({ ...row, business_id: businessId }, { onConflict: "business_id,weekday" });
    if (error) throw error;
  }
}
export async function getAppointmentsForBusiness(businessId, date) {
  const start = `${date}T00:00:00-04:00`, end = `${date}T23:59:59.999-04:00`;
  const { data, error } = await supabase.from("appointments").select("id,start_at,end_at,status,notes,services(name,duration_minutes),profiles:client_id(full_name,email)").eq("business_id", businessId).gte("start_at", start).lte("start_at", end).order("start_at");
  if (error) throw error;
  return data || [];
}
export async function getClientAppointments(userId) {
  const { data, error } = await supabase.from("appointments").select("id,start_at,end_at,status,notes,businesses(name,address),services(name)").eq("client_id", userId).order("start_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createAppointment({ businessId, serviceId, startAt, notes = "" }) {
  const { data, error } = await supabase.rpc("create_appointment", {
    p_business_id: businessId, p_service_id: serviceId, p_start_at: startAt, p_notes: notes
  });
  if (error) throw error;
  return data;
}
export async function cancelAppointment(id) {
  const { data, error } = await supabase.rpc("cancel_appointment", { p_appointment_id: id });
  if (error) throw error;
  return data;
}
