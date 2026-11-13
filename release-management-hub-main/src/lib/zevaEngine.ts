// @ts-nocheck
/* Ported unchanged from the Release Hub V2 design project (zeva-engine.js). */
// Zēva response engine: deterministic, synchronous. Ported from the Zēva drawer spec (§11, §16, §17).
const hash = s => { let h = 0; for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return h; };
const idx = (key, n) => ((hash(key) % n) + n) % n;
const pick = (arr, key) => arr[idx(key, arr.length)];
// Zwayam copy rules: no em dashes, no exclamation marks.
export const clean = t => t == null ? t : String(t).replace(/\s*—\s*/g, ', ').replace(/!/g, '.').replace(/\.\s*\./g, '.').replace(/,\s*,/g, ',');
const P = s => s.split(' · ').map(x => { const [l, q] = x.split(' → '); return { label: l, query: q }; });

const INTENTS = [
  ['troubleshooting', 'error issue problem broken fix bug fail wrong stuck crash slow not'],
  ['config', 'setup configure setting enable disable change update install connect config'],
  ['data', 'export import download upload data extract migrate backup transfer sync'],
  ['navigation', 'find where locate access open navigate look search go see'],
  ['action', 'create add delete remove edit modify send submit approve reject assign'],
].map(([k, w]) => [k, w.split(' ')]);
export function detectQueryIntent(query) {
  const w = query.toLowerCase().split(/\s+/);
  for (const [k, l] of INTENTS) if (w.some(x => l.includes(x))) return k;
  return 'generic';
}

const T = {
  troubleshooting: ['Scanning troubleshooting guides|Checking known issues|Searching error documentation', 'Reviewing possible solutions|Narrowing down fixes|Matching against resolved cases', 'Scanned troubleshooting guides|Checked known issues|Searched error documentation', 'Reviewed possible solutions|Narrowed down fixes|Matched against resolved cases'],
  config: ['Searching setup documentation|Looking up configuration guides|Scanning admin settings docs', 'Preparing configuration steps|Organizing setup instructions|Compiling relevant settings', 'Searched setup documentation|Looked up configuration guides|Scanned admin settings docs', 'Prepared configuration steps|Organized setup instructions|Compiled relevant settings'],
  data: ['Looking up data handling docs|Searching import/export guides|Scanning data management articles', 'Compiling instructions|Preparing data walkthrough|Formatting transfer steps', 'Looked up data handling docs|Searched import/export guides|Scanned data management articles', 'Compiled instructions|Prepared data walkthrough|Formatted transfer steps'],
  navigation: ['Locating relevant section|Searching navigation guides|Looking up module location', 'Mapping out the path|Preparing directions|Tracing the right screen', 'Located relevant section|Searched navigation guides|Looked up module location', 'Mapped out the path|Prepared directions|Traced the right screen'],
  action: ['Searching how-to articles|Looking up action guides|Scanning step-by-step docs', 'Preparing walkthrough|Compiling action steps|Organizing instructions', 'Searched how-to articles|Looked up action guides|Scanned step-by-step docs', 'Prepared walkthrough|Compiled action steps|Organized instructions'],
  generic: ['Searching knowledge base|Scanning documentation|Looking through help articles', 'Preparing response|Formatting guidance|Putting together an answer', 'Searched knowledge base|Scanned documentation|Looked through help articles', 'Prepared response|Formatted guidance|Put together an answer'],
};
export function thinkingFor(query) {
  const t = T[detectQueryIntent(query)].map(s => s.split('|'));
  const i1 = idx(query, 3), i2 = idx(query + '_s2', 3);
  return { s1: t[0][i1] + '…', s2: t[1][i2] + '…', d1: t[2][i1] + '.', d2: t[3][i2] + '.' };
}

const TICKET_PHRASES = ['create a support ticket', 'open a ticket', 'raise a ticket', 'submit a ticket', 'i need to raise a support ticket'];
export const isTicketIntent = q => TICKET_PHRASES.some(p => q.toLowerCase().includes(p));

const NEG = "(?:can'?t|cannot|unable|couldn'?t|won'?t|doesn'?t|not)\\s+";
const CATS = [
  [new RegExp(NEG + '(?:export|download)'), 'Data export failure'],
  [new RegExp(NEG + '(?:import|upload)'), 'Data import failure'],
  [new RegExp(NEG + '(?:log\\s*in|sign\\s+in|access|login)'), 'Login or access issue'],
  [new RegExp(NEG + '(?:see|view|find|load)'), 'Content visibility issue'],
  [new RegExp(NEG + '(?:schedule|book|create|add|send|submit|delete|remove|edit|modify|assign|approve)'), 'Action failure'],
  [/not\s+(?:showing|loading|appearing|working|displaying|visible|responding)/, 'Feature not responding'],
  [/\b(?:error|crash|fail|broke|broken|bug)\b/, 'Error or bug report'],
  [/slow|lag|delay|timeout|hang|freeze|stuck/, 'Performance issue'],
  [/missing|disappear|lost|gone/, 'Missing data or content'],
  [/wrong|incorrect|inaccurate|mismatch/, 'Data discrepancy'],
  [/permission|access denied|unauthorized|forbidden|role/, 'Permission or access denied'],
  [/(?:notification|email|alert).*(?:not|fail|miss|stop)/, 'Notification delivery failure'],
  [/how\s+(?:do|can|to)|where\s+(?:do|can|is)|what\s+is/, 'Guidance request'],
];
const SUBJ = [
  [/interview.*(?:schedul|calendar|slot|panel|book)|(?:schedul|calendar|slot).*interview/, 'Interview scheduling'],
  [/candidate.*profile/, 'Candidate profiles'], [/profile|candidate/, 'Candidate management'],
  [/job.*(?:requisition|posting|post)/, 'Job requisition'], [/requisition|vacancy|opening|position/, 'Job requisition'],
  [/offer.*letter/, 'Offer letter'], [/offer|compensation/, 'Offer management'],
  [/report|analytics|statistic|metric|dashboard/, 'Reports and analytics'], [/workflow|approval/, 'Workflow and approval'],
  [/(?:export|download).*(?:excel|csv|pdf|data)/, 'Data export'], [/export|download/, 'Data export'],
  [/import|upload|bulk/, 'Data import and upload'], [/email|notification|template/, 'Email and notifications'],
  [/setting|config|permission|role|admin/, 'Admin configuration'], [/career\s+(?:page|portal)|portal/, 'Career portal'],
  [/integration|board|linkedin|naukri/, 'Integration'], [/filter|search|sort/, 'Search and filters'],
  [/pipeline|funnel|stage/, 'Hiring pipeline'], [/assessment|test|score|scorecard/, 'Assessments'],
];
export function generateTicketTitle(raw) {
  const q = raw.toLowerCase().replace(/’/g, "'");
  const c = (CATS.find(([r]) => r.test(q)) || [])[1], s = (SUBJ.find(([r]) => r.test(q)) || [])[1];
  if (c && s) return s + ' · ' + c;
  if (c) return c;
  if (s) return s + ' · User reported issue';
  let t = raw.trim().replace(/[.?!,;:]+$/, '').replace(/^(?:i\s+)?(?:can'?t|cannot|am unable to|need help with|having\s+(?:trouble|issues?|problems?)\s*(?:with)?)\s*/i, '');
  if (!t) return 'User reported issue · Needs triage';
  t = t[0].toUpperCase() + t.slice(1);
  return t.length > 70 ? t.slice(0, 67) + '...' : t;
}

const DOMAIN = 'release releases video videos demo newsletter webinar changelog job jobs hire hiring recruit recruitment recruiter candidate applicant resume interview offer onboard onboarding requisition vacancy opening position talent pipeline funnel sourcing shortlist screening panel zwayam zeva dashboard report analytics statistic metric workflow approval template career portal integration board linkedin naukri indeed post schedule assign approve reject filter export import download upload configure setting permission role admin user team notification error issue problem fix bug broken help setup create add delete remove edit modify send submit find access navigate open search view profile application trend stage status track calendar slot invite letter compensation data salary department location field form page module feature ticket support'.split(' ');
const relevant = w => DOMAIN.some(k => w.includes(k) || (w.length >= 4 && k.includes(w))) || w === 'cv';

const FRUST = [/not help(?:ful|ing)/, /(?:doesn'?t|didn'?t) help/, /no help/, /(?:didn'?t|doesn'?t) answer/, /not answering/, /never answer/, /wrong answer/, /incorrect/, /that'?s (?:wrong|incorrect)/, /not what i (?:asked|meant|need|want)/, /misunderst(?:ood|and)/, /useless/, /pointless/, /waste of time/, /already (?:asked|told|said|tried)/, /said that (?:already|before)/, /asked (?:this )?before/, /same (?:thing|answer|response)/, /keeps? (?:saying|giving|showing) (?:the )?same/, /still not (?:working|helping|clear|right)/, /still doesn'?t (?:work|help)/, /still stuck/, /doesn'?t (?:work|make sense)/, /not (?:working|making sense)/, /this is (?:frustrat|annoy|confus)/, /i (?:already|just) (?:tried|did) that/, /you'?re not (?:listen|understand|help)/, /that (?:didn'?t|doesn'?t|won'?t) (?:work|help|fix)/, /i (?:need|want) a (?:real|actual|proper|better) (?:answer|help|solution)/];
const SHORT_NEG = /^(?:no|nope|nah|wrong|incorrect|(?:that'?s )?(?:wrong|incorrect|not right|not it)|try again|again|doesn'?t work|not working|didn'?t work|not helpful|unhelpful|useless)\.?$/;
const words3 = s => new Set(s.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9']/g, '')).filter(w => w.length > 2));

const RECOVERY = {
  interview: 'Step-by-step interview scheduling guide → Walk me through how to schedule an interview step by step in Zwayam · Interview panel setup from scratch → How do I set up an interview panel from scratch in Zwayam? · Troubleshooting interview scheduling issues → Why is interview scheduling not working in Zwayam?',
  candidate: 'Complete candidate management walkthrough → Give me a complete guide to managing candidates in Zwayam · Searching and filtering candidates → How do I search and filter candidates effectively in Zwayam? · Troubleshooting candidate profile issues → Why are candidate profiles not showing or loading?',
  job: 'Full job requisition creation guide → Walk me through creating a job requisition step by step · Job posting and publishing workflow → How do I post and publish a job to career portals? · Troubleshooting job listing issues → Why is my job listing not appearing on the career portal?',
  offer: 'Complete offer letter workflow → Walk me through the entire offer letter process in Zwayam · Offer template configuration → How do I configure offer letter templates in Zwayam? · Troubleshooting offer generation issues → Why is the offer letter not generating correctly?',
  report: 'Step-by-step report generation guide → Walk me through generating a hiring report in Zwayam · Available report types explained → What types of reports are available in Zwayam? · Troubleshooting report export issues → Why is my report not exporting or downloading?',
  workflow: 'Approval workflow setup guide → Walk me through setting up an approval workflow step by step · Understanding workflow stages → How do workflow stages and routing work in Zwayam? · Troubleshooting workflow issues → Why is my approval workflow stuck or not progressing?',
  settings: 'Complete admin settings walkthrough → Walk me through the admin settings and configuration in Zwayam · User roles and permissions guide → How do I configure user roles and permissions step by step? · Troubleshooting permission issues → Why am I getting an access denied error in Zwayam?',
  generic: 'Browse popular help topics → What are the most common tasks I can do in Zwayam? · Getting started with Zwayam → How do I get started with Zwayam as a new user? · Explore platform navigation tips → How do I navigate the Zwayam platform effectively?',
};
const RCATS = [[/interview|panel|schedul|slot|calendar/, 'interview'], [/candidate|profile|applicant|resume/, 'candidate'], [/job|requisition|posting|position|vacancy/, 'job'], [/offer|letter|compensation/, 'offer'], [/report|analytic|statistic|metric|dashboard/, 'report'], [/workflow|approval|automat/, 'workflow'], [/setting|config|permission|role|admin/, 'settings']];

const ACTIONS = [
  ['schedul', 'scheduling an interview', 'How do I schedule an interview in Zwayam?'], ['book', 'booking an interview', 'How do I schedule an interview in Zwayam?'],
  ['reject', 'rejecting a candidate', 'How do I reject a candidate in Zwayam?'], ['shortlist', 'shortlisting a candidate', 'How do I shortlist a candidate in Zwayam?'],
  ['mov', 'moving a candidate to a different stage', 'How do I move a candidate between stages?'], ['approv', 'approving a requisition', 'How do I approve a job requisition in Zwayam?'],
  ['deny', 'denying a request', 'How do I reject or deny a request in Zwayam?'], ['deni', 'denying a request', 'How do I reject or deny a request in Zwayam?'],
  ['post', 'posting a job', 'How do I post a new job requisition?'], ['publish', 'publishing a job listing', 'How do I publish a job to career portals?'],
  ['clos', 'closing a job', 'How do I close a job requisition in Zwayam?'], ['assign', 'assigning a task', 'How do I assign a recruiter or panel member?'],
  ['reassign', 'reassigning a record', 'How do I reassign a job or candidate to someone else?'], ['send', 'sending a communication', 'How do I send offer letters or emails in Zwayam?'],
  ['shar', 'sharing a profile or report', 'How do I share candidate profiles or reports?'], ['archiv', 'archiving a record', 'How do I archive old jobs or candidate records?'],
  ['cancel', 'cancelling an action', 'How do I cancel a scheduled interview or pending action?'], ['reschedul', 'rescheduling an interview', 'How do I reschedule an interview in Zwayam?'],
  ['download', 'downloading data', 'How do I export or download reports in Zwayam?'], ['export', 'exporting data', 'How do I export candidate or job data?'],
  ['upload', 'uploading data', 'How do I bulk upload resumes or candidate data?'], ['import', 'importing records', 'How do I import candidates or jobs into Zwayam?'],
  ['creat', 'creating a record', 'How do I create a new job requisition in Zwayam?'], ['delet', 'deleting a record', 'How do I delete a record in Zwayam?'],
  ['remov', 'removing a record', 'How do I remove a candidate or close a requisition?'], ['updat', 'updating a record', 'How do I update job or candidate details in Zwayam?'],
  ['submit', 'submitting for approval', 'How do I submit a requisition for approval?'], ['generat', 'generating a report', 'How do I generate reports in Zwayam?'],
  ['notify', 'sending a notification', 'How do I send notifications in Zwayam?'], ['invit', 'inviting a participant', 'How do I invite panel members to an interview?'],
  ['forward', 'forwarding a profile', 'How do I forward candidate profiles in Zwayam?'], ['transfer', 'transferring a record', 'How do I transfer candidates between jobs?'],
].sort((a, b) => b[0].length - a[0].length);
const ACTION_CTX = {
  schedul: 'Setting up interview panels → How do I set up an interview panel in Zwayam? · Sending interview invitations → How do I send interview invites to candidates? · Managing interview calendar → How do I manage my interview calendar in Zwayam?',
  reschedul: 'Cancelling a scheduled interview → How do I cancel a scheduled interview or pending action? · Managing interview calendar → How do I manage my interview calendar in Zwayam? · Sending updated invitations → How do I send interview invites to candidates?',
  book: 'Setting up interview panels → How do I set up an interview panel in Zwayam? · Configuring interview time slots → How do I configure available interview slots? · Sending interview invitations → How do I send interview invites to candidates?',
  reject: 'Adding rejection reasons → How do I add rejection reasons in Zwayam? · Moving candidates between stages → How do I move a candidate between stages? · Sending rejection communications → How do I send rejection emails to candidates?',
  shortlist: 'Moving candidates between stages → How do I move a candidate between stages? · Scheduling interviews for shortlisted candidates → How do I schedule an interview in Zwayam? · Sharing shortlisted profiles → How do I share candidate profiles or reports?',
  mov: 'Configuring hiring stages → How do I configure hiring pipeline stages in Zwayam? · Bulk moving candidates → How do I move multiple candidates at once? · Viewing candidate stage history → How do I view a candidate\'s stage history?',
  approv: 'Configuring approval workflows → How do I set up approval workflows in Zwayam? · Viewing pending approvals → How do I view pending approvals in Zwayam? · Submitting requisitions for approval → How do I submit a requisition for approval?',
  deny: 'Configuring approval workflows → How do I set up approval workflows in Zwayam? · Adding denial reasons → How do I add rejection reasons in Zwayam? · Viewing pending approvals → How do I view pending approvals in Zwayam?',
  post: 'Configuring job templates → How do I use job templates in Zwayam? · Publishing to career portals → How do I publish a job to career portals? · Setting up job board integrations → How do I integrate job boards like LinkedIn or Naukri?',
  publish: 'Managing career portal settings → How do I configure the career portal in Zwayam? · Posting jobs to multiple boards → How do I post a new job requisition? · Tracking source effectiveness → How do I view source effectiveness reports?',
  clos: 'Archiving old requisitions → How do I archive old jobs or candidate records? · Viewing closed job reports → How do I generate reports in Zwayam? · Reopening a closed requisition → How do I reopen a closed job requisition?',
  assign: 'Managing team roles and permissions → How do I configure user roles and permissions? · Setting up recruiter workload → How do I view recruiter workload distribution? · Reassigning jobs to another recruiter → How do I reassign a job or candidate to someone else?',
  reassign: 'Managing recruiter assignments → How do I assign a recruiter or panel member? · Viewing assignment history → How do I view assignment history for a job? · Bulk reassigning records → How do I bulk reassign candidates or jobs?',
  send: 'Configuring email templates → How do I set up email templates in Zwayam? · Sending bulk communications → How do I send bulk emails to candidates? · Tracking sent communications → How do I track email delivery status?',
  shar: 'Setting sharing permissions → How do I configure sharing permissions in Zwayam? · Exporting profiles as PDF → How do I export candidate profiles as PDF? · Collaborating with hiring managers → How do I share candidates with hiring managers?',
  invit: 'Setting up interview panels → How do I set up an interview panel in Zwayam? · Managing panel availability → How do I check panel member availability? · Sending calendar invitations → How do I send calendar invites for interviews?',
  forward: 'Sharing profiles with hiring managers → How do I share candidates with hiring managers? · Exporting candidate data → How do I export candidate or job data? · Setting sharing permissions → How do I configure sharing permissions in Zwayam?',
  download: 'Exporting candidate data → How do I export candidate or job data? · Generating custom reports → How do I generate reports in Zwayam? · Understanding export formats → What export formats does Zwayam support?',
  export: 'Downloading hiring reports → How do I export or download reports in Zwayam? · Scheduling automated exports → How do I set up automated report exports? · Understanding export formats → What export formats does Zwayam support?',
  upload: 'Preparing bulk upload templates → How do I get the bulk upload template in Zwayam? · Resolving upload errors → How do I fix bulk upload errors in Zwayam? · Importing from external sources → How do I import candidates or jobs into Zwayam?',
  import: 'Using bulk upload templates → How do I bulk upload resumes or candidate data? · Mapping import fields → How do I map fields during data import? · Resolving import conflicts → How do I resolve duplicate records during import?',
  creat: 'Using job templates → How do I use job templates in Zwayam? · Configuring required fields → How do I configure required fields for requisitions? · Submitting for approval → How do I submit a requisition for approval?',
  delet: 'Archiving vs deleting records → What is the difference between archiving and deleting in Zwayam? · Recovering deleted records → How do I recover deleted records in Zwayam? · Understanding permission requirements → What permissions are needed to delete records?',
  remov: 'Archiving old records → How do I archive old jobs or candidate records? · Understanding data retention → How does data retention work in Zwayam? · Recovering removed records → How do I recover deleted records in Zwayam?',
  updat: 'Bulk editing records → How do I bulk edit candidate or job records? · Viewing change history → How do I view the edit history for a record? · Configuring editable fields → How do I configure which fields are editable?',
  submit: 'Configuring approval workflows → How do I set up approval workflows in Zwayam? · Tracking submission status → How do I track the status of my submissions? · Viewing pending approvals → How do I view pending approvals in Zwayam?',
  generat: 'Available report types → What types of reports are available in Zwayam? · Scheduling automated reports → How do I set up automated report exports? · Customizing report filters → How do I apply filters to reports in Zwayam?',
  notify: 'Configuring notification preferences → How do I configure notification settings in Zwayam? · Setting up email templates → How do I set up email templates in Zwayam? · Managing alert rules → How do I set up automated alerts in Zwayam?',
  archiv: 'Viewing archived records → How do I view archived jobs or candidates? · Restoring archived records → How do I restore an archived record in Zwayam? · Understanding archival policies → What happens when a record is archived in Zwayam?',
  cancel: 'Rescheduling an interview → How do I reschedule an interview in Zwayam? · Sending cancellation notifications → How do I notify participants about a cancellation? · Viewing cancelled actions log → How do I view the history of cancelled actions?',
  transfer: 'Moving candidates between jobs → How do I move a candidate between stages? · Reassigning ownership → How do I reassign a job or candidate to someone else? · Bulk transferring records → How do I bulk transfer candidates between requisitions?',
  _: 'Managing candidate profiles → How do I view candidate profiles? · Interview scheduling guide → How do I schedule an interview in Zwayam? · Job requisition walkthrough → How do I post a new job requisition?',
};
ACTION_CTX.deni = ACTION_CTX.deny;

const COMPOUND = [
  [/not\s+(?:showing|loading|appearing|visible|working|displaying)/, 'Candidate profiles not showing → Why are candidate profiles not showing or loading? · Search results not appearing → Why are search results not appearing in Zwayam? · Page or module not loading → What do I do if a page is not loading in Zwayam?'],
  [/(?:can'?t|cannot|unable)\s+(?:login|log\s*in|sign\s+in|access)/, 'Resetting your password → How do I reset my password in Zwayam? · Account locked or disabled → What do I do if my Zwayam account is locked? · Browser or network issues → How do I troubleshoot login issues in Zwayam?'],
  [/(?:can'?t|cannot|unable)\s+(?:see|view|find)/, 'Missing data or records → Why can\'t I see certain records in Zwayam? · Permission or role issue → Why am I getting an access denied error in Zwayam? · Filter or search misconfiguration → How do I reset filters to see all records?'],
];
const DISAMB = [
  ['ipg', 'Interview Panel Group (IPG) → How do I set up an Interview Panel Group in Zwayam? · Creating an interview panel → How do I create a new interview panel? · Assigning an interview panel to a job → How do I assign an interview panel to a requisition?'],
  ['offer offers', 'Creating or sending an offer letter → How do I create and send an offer letter in Zwayam? · Managing offer letter templates → How do I manage offer letter templates? · Tracking offer acceptance status → How do I track offer acceptance or rejection?'],
  ['profile profiles', 'Viewing or searching candidate profiles → How do I view and search candidate profiles in Zwayam? · Editing candidate profile fields → How do I edit candidate profile information? · Profiles not loading (troubleshooting) → Why are candidate profiles not showing or loading?'],
  ['filter filters filtering', 'Filtering candidates in the pipeline → How do I filter candidates by status or stage? · Filtering jobs or requisitions → How do I use filters on the job listing page? · Filters not working (troubleshooting) → Why are filters not working correctly in Zwayam?'],
  ['status', 'Checking job requisition status → How do I check the status of a job requisition? · Viewing candidate application status → How do I view a candidate\'s application status? · Understanding approval status → How do I track approval status in Zwayam?'],
  ['template templates', 'Email templates → How do I create and manage email templates in Zwayam? · Offer letter templates → How do I manage offer letter templates? · Job requisition templates → How do I use job templates to create requisitions faster?'],
  ['panel', 'Interview panel setup → How do I set up an interview panel in Zwayam? · Admin panel navigation → How do I navigate the admin panel in Zwayam? · Panel member availability → How do I check panel member availability for interviews?'],
  ['stage stages', 'Configuring hiring pipeline stages → How do I configure hiring pipeline stages in Zwayam? · Moving candidates between stages → How do I move a candidate between stages? · Approval stages in workflows → How do I set up approval stages in a workflow?'],
  ['pipeline', 'Viewing the candidate pipeline → How do I view and manage the candidate pipeline? · Pipeline analytics and conversion rates → How do I see pipeline conversion and funnel analytics? · Configuring pipeline stages → How do I configure hiring pipeline stages in Zwayam?'],
  ['workflow workflows', 'Approval workflows for requisitions → How do I set up approval workflows in Zwayam? · Hiring process workflows → How do I configure recruitment workflows? · Automating workflow rules → How do I create automation rules in workflows?'],
  ['calendar', 'Interview calendar management → How do I manage my interview calendar in Zwayam? · Calendar integration (Google or Outlook) → How do I integrate Google or Outlook calendar with Zwayam? · Setting up availability slots → How do I configure available interview slots?'],
  ['source sources sourcing', 'Candidate sourcing channels → How do I source candidates through different channels? · Source effectiveness reports → How do I view source effectiveness reports? · Job board source integration → How do I integrate with job boards like LinkedIn or Naukri?'],
  ['permission permissions access', 'Configuring user roles and permissions → How do I configure user roles and permissions? · Access denied (troubleshooting) → Why am I getting an access denied error in Zwayam? · Granting module-level access → How do I grant access to specific modules in Zwayam?'],
  ['notification notifications alert alerts', 'Configuring notification preferences → How do I configure notification settings in Zwayam? · Email notification setup → How do I set up automated email notifications? · Notifications not arriving (troubleshooting) → Why are notifications not being sent or received?'],
  ['tag tags tagging', 'Tagging candidates → How do I add tags to candidate profiles? · Managing job tags → How do I use tags to organize jobs or requisitions? · Searching by tags → How do I search or filter by tags in Zwayam?'],
  ['score scores scorecard scoring', 'Interview scorecards → How do I set up and use interview scorecards? · Candidate assessment scoring → How do I view candidate assessment scores? · Configuring scoring criteria → How do I configure scoring criteria for evaluations?'],
  ['feedback', 'Submitting interview feedback → How do I submit interview feedback in Zwayam? · Viewing feedback from panelists → How do I view all feedback for a candidate? · Configuring feedback forms → How do I customize the feedback form template?'],
  ['board boards', 'Job board integrations → How do I integrate with job boards like LinkedIn or Naukri? · Kanban board view → How do I use the Kanban board view in Zwayam? · Dashboard overview → How do I navigate the main dashboard?'],
  ['report reports', 'Hiring statistics and analytics → How do I access hiring statistics and reports? · Generating custom reports → How do I generate and customize reports in Zwayam? · Scheduling automated reports → How do I set up automated report exports?'],
  ['approval approvals', 'Viewing pending approvals → How do I view pending approvals in Zwayam? · Setting up approval workflows → How do I set up approval workflows in Zwayam? · Approval status tracking → How do I track the approval status of a requisition?'],
  ['integration integrations integrate', 'Job board integrations → How do I integrate with job boards like LinkedIn or Naukri? · Calendar integration (Google or Outlook) → How do I integrate Google or Outlook calendar with Zwayam? · HRMS and third-party integrations → How do I set up HRMS or third-party integrations?'],
  ['requisition requisitions req', 'Creating a new requisition → How do I create a new job requisition in Zwayam? · Tracking requisition status → How do I check the status of a job requisition? · Requisition approval workflow → How do I submit a requisition for approval?'],
  ['assessment assessments test tests', 'Setting up candidate assessments → How do I set up assessments for candidates in Zwayam? · Viewing assessment results → How do I view candidate assessment scores and results? · Configuring assessment templates → How do I create or customize assessment templates?'],
  ['email emails mail', 'Sending emails to candidates → How do I send emails to candidates in Zwayam? · Managing email templates → How do I create and manage email templates in Zwayam? · Email delivery issues (troubleshooting) → Why are emails not being delivered from Zwayam?'],
  ['duplicate duplicates duplication merge', 'Merging duplicate candidate profiles → How do I merge duplicate candidate profiles in Zwayam? · Detecting duplicate applications → How does Zwayam detect duplicate applications? · Preventing duplicate entries → How do I prevent duplicate records in Zwayam?'],
].map(([t, o]) => [t.split(' '), o]);

const L = titles => titles.map(title => ({ title, url: '#' }));
const KB = [
  [/release|what changed|what’s new|what's new|changelog/, { understanding: 'I understand you want to see what changed in the latest Zwayam release.', explanation: 'Release Hub lists every feature shipped each month, with release notes, demo videos and whether a feature is on for your organisation.', steps: ['Open ‘Releases’ from the Release Hub overview', 'Pick the latest month to see its features', 'Open a feature to read its release notes and watch the demo', 'Check its status to see if it’s on for your organisation'], links: L(['Reading release notes', 'How monthly releases work']) }],
  [/turn on|switch on|enable.*feature|feature.*(?:enable|turn|switch|on\b)/, { understanding: 'I understand you want to know which new features you can turn on.', explanation: 'Some features ship off by default so your admins can decide when to roll them out. Release Hub flags these on the overview.', steps: ['Open the Release Hub overview', 'Look for features marked ‘Off by default’', 'Open a feature to review what changes for your users', 'Turn it on for your organisation when you’re ready'], links: L(['Default off features explained', 'Rolling out a feature to your team']) }],
  [/demo|video/, { understanding: 'I understand you’re looking for this month’s demo videos.', explanation: 'Every release with a walkthrough has a short demo video in Release Hub, grouped by month and module.', steps: ['Open ‘Demo videos’ from the Release Hub overview', 'Filter by the current month or a module', 'Play a video to watch the walkthrough'], links: L(['Demo video library', 'Release Hub guide']) }],
  [/interview|schedule/, { understanding: 'I understand you want to learn how to schedule interviews in Zwayam.', explanation: 'Zwayam’s interview scheduling integrates with your calendar and sends automated notifications to both candidates and interviewers.', steps: ['Open the candidate’s profile page', 'Click the ‘Schedule interview’ button in the actions bar', 'Select the interview type, date, time and panel members', 'Add a meeting link or physical location details', 'Click ‘Send invitation’ to notify all participants'], links: L(['Interview scheduling best practices', 'Calendar integration setup']) }],
  [/statistic|report|analytics|hiring/, { understanding: 'I understand you’re looking to access hiring statistics and reports within Zwayam.', explanation: 'Zwayam offers a comprehensive Reports module with real-time analytics covering your recruitment pipeline, source effectiveness, time-to-hire and team performance metrics.', steps: ['Navigate to the ‘Reports’ tab in the left sidebar', 'Select ‘Hiring statistics’ from the available report types', 'Configure your date range and apply any relevant filters', 'Click ‘Generate report’ to view the analytics dashboard'], links: L(['Understanding hiring reports', 'Advanced analytics guide']) }],
  [/candidate|profile/, { understanding: 'I understand you’re looking for how to find and view candidate profiles.', explanation: 'All candidate profiles in Zwayam are centrally managed under the Candidates module, providing a unified view of applicant details, application status and communication history.', steps: ['Click on ‘Candidates’ in the left sidebar navigation', 'Use the search bar or filters to locate specific candidates', 'Click on any candidate’s name to open their full profile'], links: L(['Managing candidate profiles', 'Candidate search tips']) }],
  [/trend|application/, { understanding: 'I understand you’re interested in viewing application trends and pipeline metrics.', explanation: 'Zwayam provides detailed trend analysis showing application volumes, conversion rates and time-to-hire across custom time periods.', steps: ['Go to ‘Reports’ and open ‘Application trends’', 'Select your preferred time period (week, month, quarter)', 'Review the trend charts and key performance indicators', 'Export the data for offline analysis if needed'], links: L(['Interpreting trend data', 'Workforce planning with trends']) }],
];

const ADVANCED = [/\bapi\b/, /webhook/, /\bsso\b/, /\bsaml\b/, /\bldap\b/, /integration.*with/, /custom field/, /advanced filter/, /bulk action/, /automation rule/, /calculated field/, /workflow condition/, /email parser/, /data retention/, /audit log/, /white label/, /single sign/, /two factor/, /\b2fa\b/, /export to \w+/, /import from \w+/, /migrat/, /sync with/];
const GAP_SETS = [
  ['I couldn’t find a related guide for it in the current documentation though.', 'I’m actively learning and expanding my knowledge base. Meanwhile, feel free to explore the related topics below or create a ticket for personalized help.', 'If you’re facing a specific issue while trying to do this, I can also try to help troubleshoot it.'],
  ['I don’t have detailed steps for this particular workflow in my current documentation.', 'My knowledge is expanding regularly. In the meantime, you can check out the related topics below or create a support ticket.', 'If you’re running into a specific error or blocker, feel free to share and I’ll try to help.'],
  ['I couldn’t locate specific documentation for this scenario.', 'I’m continuously learning and my coverage is growing. For now, take a look at the related topics below or create a ticket to get direct support.', 'If there’s a particular part of this process you’re stuck on, let me know and I can try to guide you through it.'],
  ['I don’t have a step-by-step guide for this in my knowledge base.', 'I’m actively expanding what I know. Meanwhile, you can explore the suggestions below or create a support ticket for hands-on help.', 'If you hit a specific issue or error message while attempting this, I’d be happy to help troubleshoot.'],
  ['I wasn’t able to find documentation covering this exact scenario.', 'My knowledge base is growing over time. For now, check the related topics below or create a ticket to get assistance from the support team.', 'If you’re encountering a particular problem, describe what’s happening and I’ll do my best to assist.'],
  ['I don’t have detailed guidance on this in the current docs.', 'I’m learning more every day. In the meantime, explore the related topics below or create a support ticket.', 'If you’re seeing an error or getting stuck at a specific step, share the details and I’ll try to point you in the right direction.'],
];
const HINTS = [
  ['job post requisition opening vacancy position', 'Posting a new job requisition → How do I post a new job requisition?'],
  ['statistic report analytics hiring dashboard metric', 'Hiring statistics and reports → How do I access hiring statistics?'],
  ['candidate profile applicant resume cv talent', 'Managing candidate profiles → How do I view candidate profiles?'],
  ['interview schedule panel calendar slot invite', 'Interview scheduling → How do I schedule an interview?'],
  ['trend application pipeline funnel conversion volume', 'Application trends and pipeline → How can I see application trends?'],
  ['offer letter template compensation package', 'Offer letter management → How do I manage offer letter templates?'],
  ['permission role access admin user team', 'User roles and permissions → How do I set up user roles and permissions?'],
  ['integration board linkedin naukri indeed source', 'Job board integrations → How do I integrate with job boards?'],
  ['workflow approval stage process automate rule', 'Workflow configuration → How do I configure recruitment workflows?'],
  ['career page branding portal website custom', 'Career page customization → How do I customize the career page?'],
].map(([k, t]) => [k.split(' '), P(t)[0]]);
const INTENT_TOPICS = {
  troubleshooting: 'Common login and access issues → How do I fix login issues in Zwayam? · Resolving page load errors → What do I do if a page is not loading in Zwayam? · Fixing email notification failures → Why are email notifications not being sent?',
  config: 'Configuring approval workflows → How do I set up approval workflows in Zwayam? · Setting up user roles and permissions → How do I configure user roles and permissions? · Managing email templates → How do I set up email templates in Zwayam?',
  data: 'Exporting candidate data → How do I export candidate or job data? · Bulk uploading resumes → How do I bulk upload resumes or candidate data? · Generating hiring reports → How do I generate reports in Zwayam?',
  navigation: 'Finding the Reports module → Where do I find hiring reports in Zwayam? · Navigating candidate profiles → How do I view candidate profiles? · Accessing admin settings → Where are the admin settings in Zwayam?',
  action: 'Creating a job requisition → How do I create a new job requisition in Zwayam? · Submitting for approval → How do I submit a requisition for approval? · Assigning recruiters to jobs → How do I assign a recruiter or panel member?',
  general: 'Posting a new job requisition → How do I post a new job requisition? · Hiring statistics and reports → How do I access hiring statistics? · Interview scheduling → How do I schedule an interview?',
};
const CLAR = {
  troubleshooting: [['What error message or unexpected behavior are you seeing?', 'Can you describe what happens versus what you expected?', 'What were the exact steps that led to this issue?'], ['Which screen or page in Zwayam were you on?', 'Does this happen every time, or only in certain conditions?', 'When did this start occurring, after a recent change or seemingly at random?']],
  config: [['Which specific setting or option are you trying to configure?', 'Are you working in the Admin panel or a standard module?', 'Is this a system-wide setting or specific to your account?'], ['Are you setting this up for the first time, or modifying an existing configuration?', 'Do you have admin-level access to this area?', 'Which module does this setting belong to (Jobs, Candidates, Workflows)?']],
  data: [['What type of data are you working with (candidates, jobs, reports)?', 'Which format do you need: CSV, Excel or PDF?', 'Is this for a one-time export or a recurring scheduled task?'], ['How large is the dataset you’re working with?', 'Are there specific filters or date ranges you need applied?', 'Do you need raw data or a formatted report?']],
  navigation: [['Which module are you trying to reach (Jobs, Candidates, Reports, Settings)?', 'Are you looking for this in the admin panel or the recruiter view?', 'Have you checked the left sidebar navigation?'], ['Is this a feature you’ve used before, or something new you’re looking for?', 'Can you describe what the screen or section looks like?', 'Were you redirected here from another page?']],
  action: [['Which module is this action related to?', 'What type of record are you trying to work with?', 'Can you walk me through what you’ve tried so far?'], ['Do you have the required role or permissions for this action?', 'Is this for a single item or a bulk operation?', 'Are you working from the list view or a detail page?']],
  general: [['What were you trying to accomplish when this came up?', 'Could you walk me through what you’re working on right now?', 'What’s the end goal you’re trying to reach?'], ['Which part of Zwayam are you currently working in?', 'Is this related to a specific job, candidate or workflow?', 'Are you running into an issue, or exploring a feature for the first time?']],
};

export function generateResponse(query, history) {
  const hp = arr => pick(arr, query);
  // 17.0 context stitching
  const prior = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.type === 'assistant' && m.response && !m.response.isFallback && !m.isThinking) break;
    if (m.type === 'user') prior.unshift(m.content);
  }
  const q = [...prior, query].join(' ').toLowerCase().replace(/’/g, "'");
  const rawQ = query.toLowerCase().trim().replace(/’/g, "'");
  const completed = history.filter(m => m.type === 'assistant' && m.response && !m.isThinking);

  // 17.1 frustration
  if (completed.length) {
    const wc = rawQ.split(/\s+/).length;
    const pastUsers = history.filter(m => m.type === 'user').slice(-4).map(m => m.content);
    const cur = words3(rawQ);
    const repeat = cur.size > 0 && pastUsers.some(p => { const s = words3(p); let o = 0; cur.forEach(w => { if (s.has(w)) o++; }); return o / Math.max(cur.size, s.size) >= 0.7; });
    if (FRUST.some(r => r.test(rawQ)) || (wc <= 4 && SHORT_NEG.test(rawQ)) || repeat) {
      let lastResp = null, lastTopicQuery = null;
      for (let i = history.length - 1; i >= 0; i--) {
        const m = history[i];
        if (m.type === 'assistant' && m.response && !m.response.isFrustrated && !m.isThinking) {
          lastResp = m.response;
          for (let j = i - 1; j >= 0; j--) if (history[j].type === 'user') { lastTopicQuery = history[j].content; break; }
          break;
        }
      }
      const src = (lastTopicQuery || rawQ).toLowerCase();
      const cat = (RCATS.find(([r]) => r.test(src)) || [0, 'generic'])[1];
      const all = P(RECOVERY[cat]);
      const used = new Set([...(lastResp?.relatedTopics || []), ...(lastResp?.disambiguations || [])].map(t => t.query));
      let topics = all.filter(t => !used.has(t.query)); if (topics.length < 2) topics = all;
      return {
        isFrustrated: true, escalation: true, relatedTopics: topics.slice(0, 3),
        understanding: hp(['I’m sorry about that. It seems my earlier response wasn’t quite what you needed.', 'I apologize if my previous guidance wasn’t helpful. Let me take a different approach.', 'Sorry about that, I may not have given the right guidance earlier. Let me try to help another way.', 'I can see that wasn’t the answer you were looking for, and I’m sorry for the confusion.', 'My apologies, I understand that wasn’t useful. Let me try a different angle.', 'I’m sorry for the frustration. I want to make sure you get the right help here.']),
        explanation: hp(['Here are some alternative ways I can help with this:', 'Let me suggest a few different approaches that might be more useful:', 'I’d like to try helping you from a different angle. Here are some options:', 'Let me offer some alternatives that might better address what you’re looking for:', 'Here’s what else I can do to help you with this:', 'Let me point you toward some other options that might work better:']),
      };
    }
  }
  // 17.2 ticket initiation
  if (isTicketIntent(q)) return {
    understanding: 'I’d be happy to help you create a support ticket.',
    explanation: 'Before I do, could you briefly describe the issue you’re facing? This helps me check if there’s a quick solution. If not, I’ll draft a ticket for you with all the details pre-filled.',
  };
  // 17.3 off-topic
  const qWords = q.split(/\s+/).map(w => w.replace(/[^a-z0-9']/g, '')).filter(w => w.length > 2);
  const hasDomain = qWords.some(relevant);
  if (!hasDomain && qWords.length > 0) return {
    isOffTopic: true,
    understanding: hp(['I appreciate the curiosity. However, I’m specifically designed to help with Zwayam’s recruitment platform: managing jobs, candidates, interviews and hiring workflows.', 'That’s an interesting question, but it falls a bit outside my area of expertise. I’m Zwayam’s helpdesk assistant, so I’m best equipped to help with recruitment and hiring-related topics.', 'I’d love to help, but this doesn’t seem to be related to recruitment or the Zwayam platform. My knowledge is focused on hiring workflows, candidate management and platform features.', 'Good question, just not one I’m the right assistant for. I specialize in Zwayam’s recruitment tools: job postings, candidate tracking, interview scheduling and more.', 'This seems to be outside the scope of what I can help with. I’m tuned to assist with Zwayam’s hiring and recruitment features specifically.']),
    explanation: hp(['Could you try rephrasing your question around a recruitment or hiring topic?', 'Feel free to ask me anything about Zwayam, from posting jobs to generating reports.', 'Try asking about job requisitions, candidate profiles, interview scheduling or hiring analytics.', 'If there’s a Zwayam feature you’re trying to figure out, just describe it and I’ll do my best to guide you.', 'Is there a specific Zwayam feature or workflow you need help with? I’d be happy to assist with that instead.']),
    relatedTopics: P('Posting a new job requisition → How do I post a new job requisition? · Managing candidate profiles → How do I view candidate profiles? · Interview scheduling → How do I schedule an interview?'),
  };
  // 17.4 action command
  const hasQuestionIntent = /\b(?:how|what|where|why|when|which|can|could|would|should|is|does|do|help|guide|explain|tell|show|understand)\b/.test(q) || q.includes('?');
  const matched = []; const seen = new Set();
  for (const a of ACTIONS) if (new RegExp('\\b' + a[0] + '\\w*\\b').test(q) && !seen.has(a[1])) {
    // skip a shorter stem whose only hit is inside a longer matched stem's word (assign vs reassign)
    if (matched.some(m => m[0].includes(a[0]) && !new RegExp('\\b' + a[0]).test(q.replace(new RegExp('\\b' + m[0] + '\\w*', 'g'), '')))) continue;
    seen.add(a[1]); matched.push(a);
  }
  const hasEntityRef = /\b[A-Z][a-z]{2,}\b/.test(query.replace(/^\s*\S+/, '')) || /#\s*\d{3,}/.test(query) || /\b[A-Z]\s+\d{4,}\b/.test(query) || /\b\d{5,}\b/.test(query);
  if (matched.length && hasDomain && (!hasQuestionIntent || (hasEntityRef && !q.includes('how') && !q.includes('?')))) {
    const pr = matched[0]; const a = pr[1];
    const cap = s => s[0].toUpperCase() + s.slice(1);
    const topics = [{ label: 'How to: ' + cap(pr[1]), query: pr[2] }];
    if (matched[1] && matched[1][2] !== pr[2]) topics.push({ label: 'How to: ' + cap(matched[1][1]), query: matched[1][2] });
    for (const t of P(ACTION_CTX[pr[0]] || ACTION_CTX._)) { if (topics.length >= 3) break; if (!topics.some(x => x.query === t.query)) topics.push(t); }
    return {
      isActionCommand: true, escalation: true, relatedTopics: topics,
      understanding: hp([`I can see you’re trying to ${a}. I’m a helpdesk assistant, so I can’t perform actions inside Zwayam on your behalf.`, `It looks like you want me to help with ${a}. I’m not able to execute platform actions directly, but I can walk you through how to do it yourself.`, `I understand you’d like help with ${a}. While I can’t carry out actions in the system, I can guide you step by step so you can get it done quickly.`, `Got it, you’re looking at ${a}. I’m not able to perform that action for you, but I can show you exactly where to go and what to click.`, `I’d love to help with ${a}. I can’t execute actions within the platform directly, but I can give you clear, step-by-step guidance.`]),
      explanation: hp(['Would you like me to walk you through the steps instead?', 'Want me to show you how to do this yourself? It’s quick.', 'I can guide you through the exact steps. Want me to?', 'Let me point you in the right direction. Here’s how you can do it:', 'Here’s what I can do: guide you through the process step by step.']),
    };
  }
  // 17.5 ambiguity
  const hasExplicitQuestion = /\b(?:how|what|where|when|why|which)\b/.test(q) && q.includes('?');
  const hasDetailedQuestion = /how do i|how can i|how to|what is the|where (?:do|can|is)|can i/.test(q);
  if (!hasExplicitQuestion && !hasDetailedQuestion && hasDomain) {
    let opts = (COMPOUND.find(([r]) => r.test(q)) || [])[1];
    if (!opts && qWords.length <= 3) {
      const cw = q.replace(/[^a-z0-9\s']/g, '').split(/\s+/).filter(w => w.length > 1);
      opts = (DISAMB.find(([tr]) => tr.some(t => cw.includes(t))) || [])[1];
    }
    if (opts) {
      const qq = '“' + query.trim() + '”';
      return {
        isAmbiguous: true, escalation: true, disambiguations: P(opts),
        understanding: hp([`I want to make sure I understood your question correctly. When you say ${qq}, were you referring to:`, `${qq} could relate to a few things in Zwayam. To give you the right answer, did you mean:`, `Just to make sure I point you in the right direction: when you mention ${qq}, are you asking about:`, `${qq} can mean different things depending on context. Were you looking for:`, `I want to be precise here. ${qq} touches on a few areas. Could you confirm which one:`]),
      };
    }
  }
  // 17.6 knowledge base
  const kb = KB.find(([r]) => r.test(q));
  if (kb) return Object.assign({ escalation: true }, kb[1]);
  // 17.7 knowledge gap
  const complete = /how (?:do|can|to)|what (?:is|are|does)|where (?:do|can|is)|can i|is (?:there|it)|are there/.test(q);
  if (((complete && qWords.length >= 4 && hasDomain) || ADVANCED.some(r => r.test(q))) && hasDomain) {
    const set = hp(GAP_SETS);
    return {
      escalation: true, isGap: true, explanation: set.join('\n\n'),
      understanding: hp(['That’s a valid question.', 'Good question.', 'I understand what you’re asking about.', 'That’s a fair question.', 'I can see what you’re trying to do.', 'That makes sense to ask about.', 'That’s definitely a relevant question.', 'I appreciate you asking about this.', 'That’s a thoughtful question.', 'I see where you’re going with this.', 'That’s a reasonable thing to ask.', 'I understand why you’d want to know about this.']),
      relatedTopics: P('Browse comprehensive user documentation → Where can I find the full Zwayam user documentation? · Explore advanced feature guides → What advanced features does Zwayam support? · Get personalized help from support → How do I contact Zwayam support for specific questions?'),
      links: L(['Zwayam knowledge base', 'Advanced features guide']),
    };
  }
  // 17.8 fallback
  const scored = HINTS.map(([kws, topic]) => {
    let sc = 0;
    kws.forEach(k => { if (q.includes(k)) sc += 2; else if (qWords.some(w => w.length > 3 && w.slice(0, 3) === k.slice(0, 3))) sc += 1; });
    return [sc, topic];
  }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 3).map(x => x[1]);
  const fi = detectQueryIntent(q); const intent = fi === 'generic' ? 'general' : fi;
  const cl = CLAR[intent];
  const qq = '“' + query.trim() + '”';
  return {
    isFallback: true, escalation: true,
    relatedTopics: scored.length ? scored : P(INTENT_TOPICS[intent]),
    clarifications: [hp(cl[0]), hp(cl[1])],
    understanding: prior.length
      ? hp(['Thanks for the added context. I’m getting closer but still need a bit more. Specifically:', 'That helps. I’m narrowing it down but could use one more detail:', 'Got it, I can see where you’re heading. Could you clarify:', 'Helpful context. To pinpoint the right guidance, it would help to know:', 'Thanks for following up. A couple more specifics would really help:', 'Good addition. I have a better picture now. Just to confirm:'])
      : hp([`I don’t have a direct match for ${qq} yet. Could you give me a bit more context? For example:`, `${qq} could mean a few things in Zwayam. Are you asking about:`, `I want to make sure I point you in the right direction. When you say ${qq}, do you mean:`, `I’m not seeing an exact match for ${qq} in the docs. Could you clarify what you’re looking for:`, `${qq} touches on a few possible areas. To help me narrow it down:`, `To give you the most accurate answer on ${qq}, it would help to know:`]),
    links: L(['Zwayam user guide', 'FAQ and troubleshooting', 'Admin configuration handbook']),
  };
}

export const MOCK_HISTORY = [
  ['h1', 'How to post a new job requisition', '10 minutes ago'], ['h2', 'Setting up interview workflows', '1 hour ago'],
  ['h3', 'Configuring candidate evaluation forms', '2 hours ago'], ['h4', 'Managing offer letter templates', '3 hours ago'],
  ['h5', 'Understanding application status tracking', '5 hours ago'], ['h6', 'Bulk uploading candidate resumes', '45 minutes ago'],
  ['h7', 'Generating recruitment reports', '1 day ago'], ['h8', 'Setting user roles and permissions', '2 days ago'],
  ['h9', 'Integrating with job boards', '15 minutes ago'], ['h10', 'Customizing the career page', '30 minutes ago'],
  ['h11', 'Scheduling panel interviews', '20 minutes ago'], ['h12', 'Exporting applicant data', '4 hours ago'],
].map(([id, title, last]) => ({ id, title, last }));
