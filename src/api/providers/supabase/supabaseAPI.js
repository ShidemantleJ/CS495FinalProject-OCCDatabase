// Supabase API wrapper.
import { supabase } from "../../../supabaseClient";
import { applyFilters, applyOrderAndRange } from "./queryHelpers";

// Supabase API export
export const supabaseAPI = {
  //region Auth functions
  getUser() {
    return supabase.auth.getUser();
  },
  getSession() {
    return supabase.auth.getSession();
  },
  onAuthStateChange(handler) {
    return supabase.auth.onAuthStateChange(handler);
  },
  signInWithPassword({ email, password }, options) {
    return supabase.auth.signInWithPassword({ email, password }, options);
  },
  setSession({ access_token, refresh_token }) {
    return supabase.auth.setSession({ access_token, refresh_token });
  },
  resetPasswordForEmail(email, { redirectTo } = {}) {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo });
  },
  updatePassword(newPassword) {
    return supabase.auth.updateUser({ password: newPassword });
  },
  signOut() {
    return supabase.auth.signOut();
  },
  async checkAdmin() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;
    const { data: memberData } = await supabase
      .from("team_members")
      .select("admin_flag")
      .eq("email", user.email)
      .single();
    return memberData?.admin_flag === true || memberData?.admin_flag === "true";
  },

  
  //region General functions
  async create(tableName, payload, { select = "*" } = {}) {
    return supabase.from(tableName).insert([payload]).select(select).single();
  },
  async update(tableName, id, updates, { select = "*" } = {}) {
    return supabase.from(tableName).update(updates).eq("id", id).select(select).single();
  },
  async upsert(tableName, payload, { select = "*", ...options } = {}) {
    return supabase.from(tableName).upsert(payload, options).select(select);
  },
  async delete(tableName, id) {
    return supabase.from(tableName).delete().eq("id", id);
  },
    // Delete all rows matching a filter or filters
  async deleteAll(tableName, filter) {
    let query = supabase.from(tableName).delete();
    if (Array.isArray(filter)) {
      filter.forEach(f => {
        if (f.op === "eq") {
          query = query.eq(f.column, f.value);
        }
      });
    } else if (filter && typeof filter === "object") {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    return query;
  },
  async get(tableName, id, { select = "*" } = {}) {
    return supabase.from(tableName).select(select).eq("id", id).single();
  },
  list(tableName, { select = "*", filters = [], orderBy, limit, range } = {}) {
    let query = supabase.from(tableName).select(select);
    query = applyFilters(query, filters);
    query = applyOrderAndRange(query, { orderBy, limit, range });
    return query;
  },


  //region Form Functions
  async getValidTablesForSubmissions() {
    const { data, error } = await supabase.rpc('get_enum_values', {
      enum_schema: 'public',
      enum_name: 'tables_names_for_form_submission',
    });
    if (error) console.error("Error fetching enum values:", error);
    return { data: data || [], error };
  },

  async getTableColumns(tableName) {
    const { data, error } = await supabase.rpc('get_table_columns', {
      p_table_name: tableName,
    });
    if (error) console.error("Error fetching table columns:", error);
    const dict = {};
    if (data) {
      data.forEach(({ column_name, data_type }) => {
        if (!column_name.endsWith("_id") && column_name !== "id") {
          dict[column_name] = data_type;
        }
      });
    }
    return { data: dict, error };
  },

  async submitForm(formTemplateId, formTemplateName, formContent, destinationTable, { select = "*" } = {}) {
    return supabase
      .from("form_submissions")
      .insert([{
        form_template_id: formTemplateId,
        form_template_name: formTemplateName,
        form_content: formContent,
        destination_table: destinationTable || null
      }])
      .select(select)
      .single();
  },

  async saveTemplate(templateName, startDate, endDate, _type, destinationTable, fields, { select = "*" } = {}) {
    return supabase
      .from("form_templates")
      .insert([{
        event_name: templateName,
        start_date: startDate,
        end_date: endDate,
        destination_table: destinationTable,
        fields: fields
      }])
      .select(select)
      .single();
  },

  async updateTemplate(templateId, updates, { select = "*" } = {}) {
    return supabase
      .from("form_templates")
      .update(updates)
      .eq("id", templateId)
      .select(select)
      .single();
  },

  async deleteTemplate(templateId) {
    return supabase
      .from("form_templates")
      .delete()
      .eq("id", templateId);
  },

  async getTemplates({ select = "*" } = {}) {
    return supabase.from("form_templates").select(select).order("event_name", { ascending: true });
  },

  // Storage functions
  createSignedUrl(bucket, path, expiresIn) {
    return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  },
  uploadToStorage(bucket, path, file, options) {
    return supabase.storage.from(bucket).upload(path, file, options);
  },

  
};
