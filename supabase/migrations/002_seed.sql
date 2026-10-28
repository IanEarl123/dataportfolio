-- =====================================================================
-- Seed data — content carried over from the original index.html.
-- Run AFTER 001_init.sql. Run only once (it inserts, it doesn't upsert).
-- Image/PDF paths point at files in web/public, so they work immediately.
-- Edit or replace anything later from the Admin Dashboard.
-- =====================================================================

insert into public.certificates (title, issuer, issue_date, description, image_url, credential_url, sort_order) values
(
  'Master Spreadsheet Automation - Google Sheet Masterclass',
  'Udemy',
  '2025-01-01',  -- TODO: set the real completion date in the dashboard
  'Transform repetitive manual tasks into streamlined workflows that save hours of effort each week.',
  '/img/cert-spreadsheet-automation.jpg',
  '/pdf/cert-spreadsheet-automation.pdf',
  1
),
(
  'Introduction to Data Science',
  'Cisco Networking Academy',
  '2026-01-01',  -- TODO: set the real completion date in the dashboard
  'Applied data cleaning, visualization and basic machine learning concepts to real-world datasets.',
  '/img/cert-intro-data-science.png',
  '/pdf/cert-intro-data-science.pdf',
  2
);

insert into public.projects (title, description, icon, tech_stack, status, featured, sort_order) values
('Merchandiser Attendance System',
 'A dual-stage system using Excel for data validation and Power BI for tracking agent clock-ins and location compliance.',
 'fa-solid fa-user-check', array['Excel','Power BI'], 'coming_soon', true, 1),
('Inventory Sheet Tracker',
 'Tracks field merchandiser inventory submissions. Uses Excel Power Query to clean messy raw files for Power BI visualization.',
 'fa-solid fa-boxes-stacked', array['Excel','Power Query','Power BI'], 'coming_soon', true, 2),
('Sales Intelligence Dashboard',
 'Yearly performance tracking with DAX measures for growth and margin analysis across multiple regions.',
 'fa-solid fa-chart-line', array['Power BI','DAX'], 'coming_soon', true, 3),
('Apps Script Automation',
 'Automated Google Sheets notification portal that alerts managers about missing field reports in real time.',
 'fa-solid fa-code', array['Apps Script','JavaScript','Google Sheets'], 'coming_soon', false, 4),
('SQL Data Pipeline',
 'Cleaning and standardizing 100k+ rows of raw operational data for integration into a central SQL server.',
 'fa-solid fa-database', array['SQL'], 'coming_soon', false, 5),
('Supply Chain Forecasting',
 'Python-based forecasting model used to predict stock-out risks across regional distribution centers.',
 'fa-solid fa-bolt', array['Python','Pandas'], 'coming_soon', false, 6);

insert into public.achievements (title, description, icon, sort_order) values
('Automated ~30% of routine work',
 'Automated merchandiser letter generation, reminders and renewal processes, freeing time for strategic analysis.',
 'fa-solid fa-robot', 1);

insert into public.blog_posts (title, slug, excerpt, content, tags, published) values
('Hello, world: why I automate the boring parts',
 'hello-world-why-i-automate',
 'A short intro to how I approach reporting pipelines and workflow automation.',
 E'## Why automate?\n\nMost reporting work is the same steps every week: pull, clean, reshape, publish.\n\n- **Pull** raw files from the field\n- **Clean** them with Power Query\n- **Publish** to Power BI\n\nAutomating those steps means more time for the part that matters: *the insight*.\n\n> Edit or delete this post from the Admin Dashboard.',
 array['automation','power-bi'],
 true);
