/**
 * Template Registry
 */

// Template Imports
import designReview from './design-review.md';
import projectHandover from './project-handover.md';
import changeRequest from './change-request.md';
import meetingNotes from './meeting-notes.md';
import handover from './handover.md';
import example from './markdownexample.md';

/**
 * Template Interface
 */
export interface Template {
	id: string;
	name: string;
	description: string;
	content: string;
}

/**
 * All available templates to appear in UI
 */
export const templates: Template[] = [
	{
		id: 'handover',
		name: 'Infrastructure Handover',
		description: 'Full infrastructure handover with credentials, VM details, SQL, storage, backup, and pre-handover testing.',
		content: handover,
	},
	{
		id: 'design-review',
		name: 'Design Review',
		description: 'HLD/LLD review template with architecture diagrams, security checklist, and sign-off.',
		content: designReview,
	},
	{
		id: 'project-handover',
		name: 'Project Handover',
		description: 'Structured handover document covering environments, credentials, and known issues.',
		content: projectHandover,
	},
	{
		id: 'change-request',
		name: 'Change Request',
		description: 'Formal change request with impact assessment, rollback plan, and approval tracking.',
		content: changeRequest,
	},
	{
		id: 'meeting-notes',
		name: 'Meeting Notes',
		description: 'Meeting minutes template with attendees, discussion points, and action items.',
		content: meetingNotes,
	},
	{
		id: 'markdown-example',
		name: 'Markdown Example',
		description: 'Full infrastructure handover with credentials, VM details, SQL, storage, backup, and pre-handover testing.',
		content: example,
	}
];
