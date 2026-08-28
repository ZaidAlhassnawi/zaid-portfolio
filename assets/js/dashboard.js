import { configurationReady, supabase } from "./supabase-client.js";
import { SUPABASE_CONFIG } from "./config.js";

if (!configurationReady) {
  window.location.replace("login.html");
  throw new Error("Supabase configuration is incomplete.");
}

const state = { user: null, profileId: null, categories: [], skills: [], projects: [], projectSkills: [], certificates: [] };
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
const nullable = (value) => value === "" ? null : value;
const formValue = (form, name) => form.elements[name].value.trim();

const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) window.location.replace("login.html");
state.user = sessionData.session.user;
$("#admin-email").textContent = state.user.email;

supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") window.location.replace("login.html"); });
$("#logout-button").addEventListener("click", () => supabase.auth.signOut());
$(".sidebar-toggle").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".dashboard-view").forEach((view) => view.classList.toggle("active", view.id === `view-${button.dataset.view}`));
  $(".sidebar").classList.remove("open");
}));
document.querySelectorAll("[data-open-dialog]").forEach((button) => button.addEventListener("click", () => { resetDialog(button.dataset.openDialog); document.getElementById(button.dataset.openDialog).showModal(); }));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

await loadAll();

async function loadAll() {
  setMessage("Loading dashboard data...");
  const [profileResult, categoryResult, skillResult, projectResult, linkResult, certificateResult] = await Promise.all([
    supabase.from("profiles").select("profile_id").limit(1).maybeSingle(),
    supabase.from("skill_categories").select("*").order("category_id"),
    supabase.from("skills").select("*").order("skill_name"),
    supabase.from("projects").select("*").order("start_date", { ascending:false }),
    supabase.from("project_skills").select("*"),
    supabase.from("certificates").select("*").order("issue_date", { ascending:false }),
  ]);
  const error = [profileResult, categoryResult, skillResult, projectResult, linkResult, certificateResult].find((result) => result.error)?.error;
  if (error) { setMessage(`Could not load dashboard: ${error.message}`, true); return; }
  state.profileId = profileResult.data?.profile_id;
  state.categories = categoryResult.data || []; state.skills = skillResult.data || []; state.projects = projectResult.data || [];
  state.projectSkills = linkResult.data || []; state.certificates = certificateResult.data || [];
  renderAll(); clearMessage();
}

function renderAll() {
  $("#stat-projects").textContent = state.projects.length; $("#stat-skills").textContent = state.skills.length; $("#stat-certificates").textContent = state.certificates.length;
  const categoryMap = new Map(state.categories.map((category) => [category.category_id, category.category_name || category.name || `Category ${category.category_id}`]));
  $("#skill-category-select").innerHTML = state.categories.map((category) => `<option value="${category.category_id}">${escapeHTML(categoryMap.get(category.category_id))}</option>`).join("");
  $("#project-skills-options").innerHTML = state.skills.map((skill) => `<label><input type="checkbox" name="project_skills" value="${skill.skill_id}"> ${escapeHTML(skill.skill_name)}</label>`).join("");
  $("#projects-table").innerHTML = state.projects.map((project) => `<tr><td><strong>${escapeHTML(project.title)}</strong><br><small>${escapeHTML(project.my_role)}</small></td><td>${escapeHTML(project.project_status)}</td><td>${escapeHTML(project.project_type)}</td><td><span class="badge ${project.is_visible ? "" : "off"}">${project.is_visible ? "Yes" : "No"}</span></td><td><div class="actions"><button data-edit-project="${project.project_id}">Edit</button><button data-delete-project="${project.project_id}" data-delete>Delete</button></div></td></tr>`).join("");
  $("#skills-table").innerHTML = state.skills.map((skill) => `<tr><td><strong>${escapeHTML(skill.skill_name)}</strong></td><td>${escapeHTML(categoryMap.get(skill.category_id) || "-")}</td><td>${escapeHTML(skill.proficiency_level || "-")}</td><td><span class="badge ${skill.is_visible ? "" : "off"}">${skill.is_visible ? "Yes" : "No"}</span></td><td><div class="actions"><button data-edit-skill="${skill.skill_id}">Edit</button><button data-delete-skill="${skill.skill_id}" data-delete>Delete</button></div></td></tr>`).join("");
  $("#certificates-table").innerHTML = state.certificates.map((certificate) => `<tr><td><strong>${escapeHTML(certificate.title)}</strong></td><td>${escapeHTML(certificate.issuer_name)}</td><td>${certificate.issue_date}</td><td><span class="badge ${certificate.is_featured ? "" : "off"}">${certificate.is_featured ? "Yes" : "No"}</span></td><td><div class="actions"><button data-edit-certificate="${certificate.certificate_id}">Edit</button><button data-delete-certificate="${certificate.certificate_id}" data-delete>Delete</button></div></td></tr>`).join("");
}

function resetDialog(dialogId) {
  const form = document.getElementById(dialogId).querySelector("form"); form.reset();
  if (form.elements.is_visible) form.elements.is_visible.checked = true;
  form.querySelectorAll('input[type="hidden"]').forEach((input) => input.value = "");
  const title = document.getElementById(`${dialogId.replace("-dialog", "")}-dialog-title`); if (title) title.textContent = `Add ${dialogId.replace("-dialog", "")}`;
}

document.addEventListener("click", async (event) => {
  const projectEdit = event.target.closest("[data-edit-project]"); const projectDelete = event.target.closest("[data-delete-project]");
  const skillEdit = event.target.closest("[data-edit-skill]"); const skillDelete = event.target.closest("[data-delete-skill]");
  const certificateEdit = event.target.closest("[data-edit-certificate]"); const certificateDelete = event.target.closest("[data-delete-certificate]");
  if (projectEdit) editProject(Number(projectEdit.dataset.editProject));
  if (skillEdit) editSkill(Number(skillEdit.dataset.editSkill));
  if (certificateEdit) editCertificate(Number(certificateEdit.dataset.editCertificate));
  if (projectDelete) await deleteProject(Number(projectDelete.dataset.deleteProject));
  if (skillDelete) await deleteSkill(Number(skillDelete.dataset.deleteSkill));
  if (certificateDelete) await deleteCertificate(Number(certificateDelete.dataset.deleteCertificate));
});

function editProject(id) {
  const project = state.projects.find((item) => item.project_id === id); if (!project) return;
  const form = $("#project-form"); resetDialog("project-dialog"); $("#project-dialog-title").textContent = "Edit project";
  ["project_id","title","slug","summary","description","my_role","project_type","project_status","start_date","end_date","github_url","live_demo_url","video_url"].forEach((name) => form.elements[name].value = project[name] ?? "");
  ["is_ongoing","is_featured","is_visible"].forEach((name) => form.elements[name].checked = Boolean(project[name]));
  const selected = new Set(state.projectSkills.filter((link) => link.project_id === id).map((link) => String(link.skill_id)));
  form.querySelectorAll('[name="project_skills"]').forEach((checkbox) => checkbox.checked = selected.has(checkbox.value));
  $("#project-dialog").showModal();
}

$("#project-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const id = Number(form.elements.project_id.value) || null;
  const isOngoing = form.elements.is_ongoing.checked;
  const payload = { profile_id:state.profileId, title:formValue(form,"title"), slug:formValue(form,"slug"), summary:formValue(form,"summary"), description:formValue(form,"description"), my_role:formValue(form,"my_role"), project_type:formValue(form,"project_type"), project_status:formValue(form,"project_status"), start_date:nullable(formValue(form,"start_date")), end_date:isOngoing ? null : nullable(formValue(form,"end_date")), is_ongoing:isOngoing, github_url:nullable(formValue(form,"github_url")), live_demo_url:nullable(formValue(form,"live_demo_url")), video_url:nullable(formValue(form,"video_url")), is_featured:form.elements.is_featured.checked, is_visible:form.elements.is_visible.checked };
  if (state.projects.some((project) => project.slug === payload.slug && project.project_id !== id)) return setMessage("This project slug is already in use.",true);
  setMessage("Saving project...");
  const result = id ? await supabase.from("projects").update(payload).eq("project_id",id).select("project_id").single() : await supabase.from("projects").insert(payload).select("project_id").single();
  if (result.error) return setMessage(result.error.message,true);
  const projectId = id || result.data.project_id; const skillIds = [...form.querySelectorAll('[name="project_skills"]:checked')].map((item) => Number(item.value));
  const deleteResult = await supabase.from("project_skills").delete().eq("project_id",projectId); if (deleteResult.error) return setMessage(deleteResult.error.message,true);
  if (skillIds.length) { const linkResult = await supabase.from("project_skills").insert(skillIds.map((skill_id) => ({ project_id:projectId, skill_id }))); if (linkResult.error) return setMessage(linkResult.error.message,true); }
  $("#project-dialog").close(); await loadAll(); setMessage("Project saved successfully.");
});

async function deleteProject(id) {
  const project = state.projects.find((item) => item.project_id === id); if (!confirm(`Delete “${project?.title}”? This cannot be undone.`)) return;
  setMessage("Deleting project..."); await supabase.from("project_skills").delete().eq("project_id",id); const { error } = await supabase.from("projects").delete().eq("project_id",id);
  if (error) return setMessage(error.message,true); await loadAll(); setMessage("Project deleted.");
}

function editSkill(id) {
  const skill = state.skills.find((item) => item.skill_id === id); if (!skill) return; const form = $("#skill-form"); resetDialog("skill-dialog"); $("#skill-dialog-title").textContent = "Edit skill";
  ["skill_id","skill_name","category_id","proficiency_level","icon_name"].forEach((name) => form.elements[name].value = skill[name] ?? ""); form.elements.is_visible.checked = skill.is_visible; $("#skill-dialog").showModal();
}

$("#skill-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const id = Number(form.elements.skill_id.value) || null;
  const payload = { skill_name:formValue(form,"skill_name"), category_id:Number(formValue(form,"category_id")), proficiency_level:nullable(formValue(form,"proficiency_level")), icon_name:nullable(formValue(form,"icon_name")), is_visible:form.elements.is_visible.checked };
  const result = id ? await supabase.from("skills").update(payload).eq("skill_id",id) : await supabase.from("skills").insert(payload);
  if (result.error) return setMessage(result.error.message,true); $("#skill-dialog").close(); await loadAll(); setMessage("Skill saved successfully.");
});

async function deleteSkill(id) {
  const skill = state.skills.find((item) => item.skill_id === id); if (!confirm(`Delete “${skill?.skill_name}”? It will also be removed from its projects.`)) return;
  await supabase.from("project_skills").delete().eq("skill_id",id); const { error } = await supabase.from("skills").delete().eq("skill_id",id);
  if (error) return setMessage(error.message,true); await loadAll(); setMessage("Skill deleted.");
}

function editCertificate(id) {
  const certificate = state.certificates.find((item) => item.certificate_id === id); if (!certificate) return; const form = $("#certificate-form"); resetDialog("certificate-dialog"); $("#certificate-dialog-title").textContent = "Edit certificate";
  ["certificate_id","title","issuer_name","certificate_type","issue_date","expiration_date","credential_id","credential_url","description"].forEach((name) => form.elements[name].value = certificate[name] ?? "");
  form.elements.current_image_path.value = certificate.image_path ?? ""; form.elements.is_featured.checked = certificate.is_featured; form.elements.is_visible.checked = certificate.is_visible; $("#certificate-dialog").showModal();
}

$("#certificate-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const id = Number(form.elements.certificate_id.value) || null; let imagePath = form.elements.current_image_path.value || null;
  const file = form.elements.certificate_file.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) return setMessage("The certificate file exceeds 5 MB.",true);
    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"]; if (!allowed.includes(file.type)) return setMessage("Unsupported certificate file type.",true);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-"); imagePath = `${state.user.id}/certificates/${crypto.randomUUID()}-${safeName}`;
    const upload = await supabase.storage.from(SUPABASE_CONFIG.storageBucket).upload(imagePath,file,{ upsert:false, contentType:file.type }); if (upload.error) return setMessage(upload.error.message,true);
  }
  const payload = { profile_id:state.profileId, title:formValue(form,"title"), issuer_name:formValue(form,"issuer_name"), certificate_type:formValue(form,"certificate_type"), issue_date:formValue(form,"issue_date"), expiration_date:nullable(formValue(form,"expiration_date")), credential_id:nullable(formValue(form,"credential_id")), credential_url:nullable(formValue(form,"credential_url")), image_path:imagePath, description:nullable(formValue(form,"description")), is_featured:form.elements.is_featured.checked, is_visible:form.elements.is_visible.checked };
  const result = id ? await supabase.from("certificates").update(payload).eq("certificate_id",id) : await supabase.from("certificates").insert(payload);
  if (result.error) return setMessage(result.error.message,true); $("#certificate-dialog").close(); await loadAll(); setMessage("Certificate saved successfully.");
});

async function deleteCertificate(id) {
  const certificate = state.certificates.find((item) => item.certificate_id === id); if (!confirm(`Delete “${certificate?.title}”?`)) return;
  const { error } = await supabase.from("certificates").delete().eq("certificate_id",id); if (error) return setMessage(error.message,true);
  if (certificate.image_path) await supabase.storage.from(SUPABASE_CONFIG.storageBucket).remove([certificate.image_path]); await loadAll(); setMessage("Certificate deleted.");
}

function setMessage(message, isError=false) { const box=$("#dashboard-message"); box.hidden=false; box.textContent=message; box.classList.toggle("error",isError); window.scrollTo({top:0,behavior:"smooth"}); }
function clearMessage() { $("#dashboard-message").hidden=true; }
