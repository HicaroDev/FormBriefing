import fs from 'fs';
import path from 'path';

const baseDir = 'c:\\DEV\\FormBriefing';
const modeloDir = path.join(baseDir, 'modelo_site');

// 1. Dashboard
let dashboard = fs.readFileSync(path.join(modeloDir, 'dashboard_studiointake', 'code.html'), 'utf-8');
dashboard = dashboard.replace(/href="#"(?=.*>Dashboard<\/a>)/g, 'href="index.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Pilates Brief<\/a>)/g, 'href="pilates.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Physio Brief<\/a>)/g, 'href="physio.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Events Brief<\/a>)/g, 'href="events.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Control Panel<\/a>)/g, 'href="index.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Pilates Intake<\/a>)/g, 'href="pilates.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Physiotherapy Intake<\/a>)/g, 'href="physio.html"');
dashboard = dashboard.replace(/href="#"(?=.*>Events Intake<\/a>)/g, 'href="events.html"');
dashboard = dashboard.replace(/<button class="w-full py-1.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:bg-surface-container transition-colors duration-150 flex items-center justify-center gap-1.5 shadow-xs font-semibold" type="button">/g, 
  '<button onclick="window.location.href=\'portal.html\'" class="w-full py-1.5 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:bg-surface-container transition-colors duration-150 flex items-center justify-center gap-1.5 shadow-xs font-semibold" type="button">');
dashboard = dashboard.replace(/<button class="p-1 rounded text-primary hover:bg-surface-container-high transition-colors" title="Abrir Briefing" type="button">/g,
  '<button onclick="window.location.href=\'client-form.html\'" class="p-1 rounded text-primary hover:bg-surface-container-high transition-colors" title="Abrir Briefing" type="button">');
fs.writeFileSync(path.join(baseDir, 'index.html'), dashboard, 'utf-8');

// 2. Portal PIN
let portal = fs.readFileSync(path.join(modeloDir, 'acesso_ao_formul_rio_c_digo_do_cliente', 'code.html'), 'utf-8');
portal = portal.replace(/btn\.classList\.add\('bg-primary-container', 'text-white'\);/g, 
  "btn.classList.add('bg-primary-container', 'text-white'); setTimeout(() => { window.location.href = 'client-form.html'; }, 600);");
fs.writeFileSync(path.join(baseDir, 'portal.html'), portal, 'utf-8');

// 3. Client Form
let clientForm = fs.readFileSync(path.join(modeloDir, 'preenchimento_do_briefing_portal_do_cliente', 'code.html'), 'utf-8');
clientForm = clientForm.replace(/href="#dashboard"/g, 'href="index.html"');
clientForm = clientForm.replace(/href="#pilates-brief"/g, 'href="pilates.html"');
clientForm = clientForm.replace(/href="#physio-brief"/g, 'href="physio.html"');
clientForm = clientForm.replace(/href="#events-brief"/g, 'href="events.html"');
fs.writeFileSync(path.join(baseDir, 'client-form.html'), clientForm, 'utf-8');

// 4. Login
let login = fs.readFileSync(path.join(modeloDir, 'login_studiointake', 'code.html'), 'utf-8');
login = login.replace(/submitBtn\.classList\.remove\('opacity-90', 'cursor-wait'\);/g,
  "submitBtn.classList.remove('opacity-90', 'cursor-wait'); setTimeout(() => { window.location.href = 'index.html'; }, 400);");
fs.writeFileSync(path.join(baseDir, 'login.html'), login, 'utf-8');

// 5. Pilates
let pilates = fs.readFileSync(path.join(modeloDir, 'briefing_pilates', 'code.html'), 'utf-8');
pilates = pilates.replace(/<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">Dashboard<\/a>/g,
  '<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="index.html">Dashboard</a>');
pilates = pilates.replace(/<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">Physio Brief<\/a>/g,
  '<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="physio.html">Physio Brief</a>');
pilates = pilates.replace(/<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">Events Brief<\/a>/g,
  '<a class="text-on-surface-variant pb-1 font-label-md text-label-md hover:text-primary transition-colors duration-150" href="events.html">Events Brief</a>');
fs.writeFileSync(path.join(baseDir, 'pilates.html'), pilates, 'utf-8');

// 6. Physio
let physio = fs.readFileSync(path.join(modeloDir, 'briefing_physiotherapy', 'code.html'), 'utf-8');
physio = physio.replace(/href="#dashboard"/g, 'href="index.html"');
physio = physio.replace(/href="#pilates"/g, 'href="pilates.html"');
physio = physio.replace(/href="#events"/g, 'href="events.html"');
fs.writeFileSync(path.join(baseDir, 'physio.html'), physio, 'utf-8');

// 7. Events
let events = fs.readFileSync(path.join(modeloDir, 'briefing_events', 'code.html'), 'utf-8');
events = events.replace(/href="#dashboard"/g, 'href="index.html"');
events = events.replace(/href="#pilates"/g, 'href="pilates.html"');
events = events.replace(/href="#physio"/g, 'href="physio.html"');
fs.writeFileSync(path.join(baseDir, 'events.html'), events, 'utf-8');

// 8. Universal
let universal = fs.readFileSync(path.join(modeloDir, 'universal_briefing_form_template', 'code.html'), 'utf-8');
universal = universal.replace(/href="#overview"/g, 'href="index.html"');
fs.writeFileSync(path.join(baseDir, 'universal.html'), universal, 'utf-8');

console.log('All files converted with 100% exact Stitch code preserved!');
