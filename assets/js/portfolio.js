import { configurationReady, getPublicAssetUrl, supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const pick = (record, keys, fallback = "") => keys.find((key) => record?.[key] !== null && record?.[key] !== undefined && record?.[key] !== "") ? record[keys.find((key) => record?.[key] !== null && record?.[key] !== undefined && record?.[key] !== "")] : fallback;
const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const safeUrl = (value) => {
  if (!value) return null;
  try { const url = new URL(value, window.location.href); return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null; } catch { return null; }
};
const formatDate = (date) => date ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`)) : "Present";

document.querySelector(".menu-button").addEventListener("click", (event) => {
  const nav = document.querySelector(".site-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".site-nav a").forEach((link) => link.addEventListener("click", () => document.querySelector(".site-nav").classList.remove("open")));
$("#year").textContent = new Date().getFullYear();

if (!configurationReady) {
  const banner = $("#configuration-message");
  banner.hidden = false;
  banner.textContent = "Connect this portfolio to Supabase by completing assets/js/config.js.";
  ["#skills-container", "#projects-container", "#experience-container", "#education-container", "#certificates-container"].forEach((id) => $(id).innerHTML = '<p class="empty-state">Supabase connection is not configured yet.</p>');
} else {
  loadPortfolio();
}

async function tableRows(table, options = {}) {
  let query = supabase.from(table).select("*");
  if (options.visible) query = query.eq("is_visible", true);
  if (options.order) query = query.order(options.order, { ascending: options.ascending ?? false });
  const { data, error } = await query;
  if (error) { console.warn(`${table}:`, error.message); return []; }
  return data ?? [];
}

async function loadPortfolio() {
  const [profiles, categories, skills, projects, links, certificates, experiences, education, socialLinks] = await Promise.all([
    tableRows("profiles"), tableRows("skill_categories"), tableRows("skills", { visible: true }), tableRows("projects", { visible: true, order: "start_date" }),
    tableRows("project_skills"), tableRows("certificates", { visible: true, order: "issue_date" }), tableRows("experiences", { visible: true, order: "start_date" }),
    tableRows("education", { visible: true, order: "start_date" }), tableRows("social_links", { visible: true }),
  ]);
  renderProfile(profiles[0], projects.length, skills.length, certificates.length, socialLinks);
  renderSkills(categories, skills);
  renderProjects(projects, links, skills);
  renderTimeline("#experience-container", experiences, "experience");
  renderTimeline("#education-container", education, "education");
  renderCertificates(certificates);
}

function renderProfile(profile = {}, projectCount, skillCount, certificateCount, socialLinks) {
  const name = pick(profile, ["full_name", "name"], "Zaid Hani Alhasnawi");
  const headline = pick(profile, ["headline", "professional_title", "title"], "I build maintainable desktop and database-backed business applications.");
  const about = pick(profile, ["about", "bio", "summary"], "Computer Science student and .NET software developer experienced in building desktop and database-backed applications for real administrative workflows.");
  const email = pick(profile, ["contact_email", "email"]);
  $("#hero-name").innerHTML = `${escapeHTML(name.split(" ").slice(0, 2).join(" "))}<br><span>${escapeHTML(name.split(" ").slice(2).join(" ") || "Alhasnawi")}.</span>`;
  $("#hero-headline").textContent = headline;
  $("#about-copy").textContent = about;
  $("#projects-count").textContent = projectCount;
  $("#skills-count").textContent = skillCount;
  $("#certificates-count").textContent = certificateCount;
  if (email) {
    const href = `mailto:${email}`;
    $("#hero-email").href = href; $("#contact-email").href = href;
  }
  const container = $("#contact-links");
  socialLinks.forEach((link) => {
    const href = safeUrl(pick(link, ["url", "link_url"]));
    if (!href) return;
    const anchor = document.createElement("a");
    anchor.className = "button button-secondary"; anchor.href = href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
    anchor.textContent = pick(link, ["platform_name", "platform", "title"], "Profile"); container.append(anchor);
  });
}

function renderSkills(categories, skills) {
  const container = $("#skills-container");
  const categoryMap = new Map(categories.map((category) => [category.category_id, pick(category, ["category_name", "name", "title"], "Other")]));
  const groups = new Map();
  skills.forEach((skill) => {
    const category = categoryMap.get(skill.category_id) || "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(skill);
  });
  container.innerHTML = groups.size ? [...groups.entries()].map(([category, items]) => `<article class="skill-group"><h3>${escapeHTML(category)}</h3><div class="skill-list">${items.map((skill) => `<span class="skill-pill">${escapeHTML(skill.skill_name)}</span>`).join("")}</div></article>`).join("") : '<p class="empty-state">No visible skills yet.</p>';
}

function renderProjects(projects, projectSkills, skills) {
  const container = $("#projects-container");
  const skillMap = new Map(skills.map((skill) => [skill.skill_id, skill.skill_name]));
  const linksByProject = new Map();
  projectSkills.forEach((link) => { if (!linksByProject.has(link.project_id)) linksByProject.set(link.project_id, []); linksByProject.get(link.project_id).push(skillMap.get(link.skill_id)); });
  container.innerHTML = projects.length ? projects.map((project) => {
    const repo = safeUrl(project.github_url); const demo = safeUrl(project.live_demo_url); const tech = (linksByProject.get(project.project_id) || []).filter(Boolean);
    return `<article class="project-card"><div class="card-meta"><span>${escapeHTML(project.project_type)}</span><span>•</span><span>${escapeHTML(project.project_status)}</span></div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.summary)}</p><p><strong>Role:</strong> ${escapeHTML(project.my_role)}</p><div class="tech-list">${tech.map((name) => `<span>#${escapeHTML(name.replace(/\s+/g, ""))}</span>`).join("")}</div>${repo || demo ? `<div class="card-links">${repo ? `<a href="${repo}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : ""}${demo ? `<a href="${demo}" target="_blank" rel="noopener noreferrer">Live demo ↗</a>` : ""}</div>` : ""}</article>`;
  }).join("") : '<p class="empty-state">No visible projects yet.</p>';
}

function renderTimeline(selector, rows, type) {
  const container = $(selector);
  container.innerHTML = rows.length ? rows.map((row) => {
    const title = type === "experience" ? pick(row, ["job_title", "position", "title"]) : pick(row, ["degree_name", "degree", "title"]);
    const place = type === "experience" ? pick(row, ["company_name", "organization_name", "employer"]) : pick(row, ["institution_name", "university_name", "institution"]);
    const description = pick(row, ["description", "summary"]);
    return `<article class="timeline-item"><time>${formatDate(row.start_date)} - ${row.is_current ? "Present" : formatDate(row.end_date)}</time><h4>${escapeHTML(title)}</h4><p>${escapeHTML(place)}</p>${description ? `<p>${escapeHTML(description)}</p>` : ""}</article>`;
  }).join("") : '<p class="empty-state">No entries yet.</p>';
}

function renderCertificates(certificates) {
  const container = $("#certificates-container");
  container.innerHTML = certificates.length ? certificates.map((certificate, index) => {
    const credential = safeUrl(certificate.credential_url); const asset = getPublicAssetUrl(certificate.image_path); const href = credential || asset;
    return `<article class="certificate-card ${certificate.is_featured ? "featured" : ""}" ${index >= 6 ? "hidden" : ""}><h3>${escapeHTML(certificate.title)}</h3><p>${escapeHTML(certificate.issuer_name)} · ${formatDate(certificate.issue_date)}</p>${certificate.credential_id ? `<p>ID: ${escapeHTML(certificate.credential_id)}</p>` : ""}${href ? `<a class="text-button" href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">View credential ↗</a>` : ""}</article>`;
  }).join("") : '<p class="empty-state">No visible certificates yet.</p>';
  const hiddenCards = container.querySelectorAll("[hidden]");
  $("#toggle-certificates").hidden = !hiddenCards.length;
  $("#toggle-certificates").onclick = (event) => { const showingAll = event.currentTarget.dataset.open === "true"; hiddenCards.forEach((card) => card.hidden = showingAll); event.currentTarget.dataset.open = String(!showingAll); event.currentTarget.textContent = showingAll ? "Show all" : "Show less"; };
}
